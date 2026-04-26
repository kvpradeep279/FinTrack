import uuid
from datetime import date, timedelta

TODAY = str(date.today())
YESTERDAY = str(date.today() - timedelta(days=1))
FUTURE_DATE = str(date.today() + timedelta(days=1))


def make_payload(**overrides) -> dict:
    """Factory for valid expense payloads."""
    return {
        "amount": "99.99",
        "category": "Food",
        "description": "Test expense",
        "date": TODAY,
        "idempotency_key": str(uuid.uuid4()),
        **overrides,
    }


# ── Create Expense ────────────────────────────────────────────────────────────

class TestCreateExpense:
    def test_create_success_returns_201(self, client):
        res = client.post("/expenses", json=make_payload())
        assert res.status_code == 201
        body = res.json()
        assert body["amount"] == "99.99"
        assert body["category"] == "Food"
        assert "id" in body
        assert "created_at" in body

    def test_amount_returned_as_string(self, client):
        """Amounts must be strings in JSON to prevent JS float rounding."""
        res = client.post("/expenses", json=make_payload(amount="1234.56"))
        assert isinstance(res.json()["amount"], str)

    def test_idempotent_replay_returns_200_same_id(self, client):
        key = str(uuid.uuid4())
        r1 = client.post("/expenses", json=make_payload(idempotency_key=key))
        r2 = client.post("/expenses", json=make_payload(idempotency_key=key))
        assert r1.status_code == 201
        assert r2.status_code == 200          # replay, not new resource
        assert r1.json()["id"] == r2.json()["id"]  # same record

    def test_negative_amount_rejected(self, client):
        res = client.post("/expenses", json=make_payload(amount="-10.00"))
        assert res.status_code == 422

    def test_zero_amount_rejected(self, client):
        res = client.post("/expenses", json=make_payload(amount="0.00"))
        assert res.status_code == 422

    def test_future_date_rejected(self, client):
        res = client.post("/expenses", json=make_payload(date=FUTURE_DATE))
        assert res.status_code == 422

    def test_invalid_category_rejected(self, client):
        res = client.post("/expenses", json=make_payload(category="Gambling"))
        assert res.status_code == 422

    def test_three_decimal_places_rejected(self, client):
        res = client.post("/expenses", json=make_payload(amount="10.999"))
        assert res.status_code == 422


# ── Delete Expense ────────────────────────────────────────────────────────────

class TestDeleteExpense:
    def test_delete_success_returns_204(self, client):
        # Create an expense
        res = client.post("/expenses", json=make_payload())
        expense_id = res.json()["id"]
        
        # Delete it
        del_res = client.delete(f"/expenses/{expense_id}")
        assert del_res.status_code == 204
        
        # Ensure it's gone
        list_res = client.get("/expenses")
        assert len(list_res.json()["items"]) == 0

    def test_delete_not_found_returns_404(self, client):
        del_res = client.delete("/expenses/non-existent-id")
        assert del_res.status_code == 404
        assert del_res.json()["detail"] == "Expense not found"


# ── List Expenses ─────────────────────────────────────────────────────────────

class TestListExpenses:
    def test_empty_list(self, client):
        res = client.get("/expenses")
        assert res.status_code == 200
        assert res.json() == {"items": [], "total": "0.00"}

    def test_filter_by_category(self, client):
        client.post("/expenses", json=make_payload(category="Food", amount="50.00"))
        client.post("/expenses", json=make_payload(category="Transport", amount="20.00"))

        res = client.get("/expenses?category=Food")
        data = res.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["category"] == "Food"
        assert data["total"] == "50.00"

    def test_sort_date_desc(self, client):
        client.post("/expenses", json=make_payload(date=YESTERDAY, amount="10.00"))
        client.post("/expenses", json=make_payload(date=TODAY, amount="20.00"))

        items = client.get("/expenses?sort=date_desc").json()["items"]
        assert items[0]["date"] == TODAY
        assert items[1]["date"] == YESTERDAY

    def test_total_calculation_is_exact(self, client):
        """0.1 + 0.2 == 0.30, not 0.30000000000000004 — Decimal ensures this."""
        client.post("/expenses", json=make_payload(amount="0.10"))
        client.post("/expenses", json=make_payload(amount="0.20"))
        assert client.get("/expenses").json()["total"] == "0.30"

    def test_total_reflects_filter(self, client):
        client.post("/expenses", json=make_payload(category="Food", amount="100.00"))
        client.post("/expenses", json=make_payload(category="Transport", amount="50.00"))
        res = client.get("/expenses?category=Transport")
        assert res.json()["total"] == "50.00"


# ── CSV Export ────────────────────────────────────────────────────────────────

class TestCSVExport:
    def test_csv_export_contains_headers_and_data(self, client):
        client.post("/expenses", json=make_payload(amount="75.00", category="Food"))
        res = client.get("/expenses/export/csv")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "amount" in res.text
        assert "75.00" in res.text
        assert "Food" in res.text

    def test_csv_export_respects_category_filter(self, client):
        client.post("/expenses", json=make_payload(category="Food", amount="10.00"))
        client.post("/expenses", json=make_payload(category="Transport", amount="20.00"))
        res = client.get("/expenses/export/csv?category=Food")
        assert "Food" in res.text
        assert "Transport" not in res.text


# ── Health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_ok(self, client):
        assert client.get("/health").json()["status"] == "ok"


# ── Validation Edge Cases (coverage completeness) ─────────────────────────────

class TestValidationEdgeCases:
    def test_amount_above_ceiling_rejected(self, client):
        """schemas.py:42 — amount > 999999.99 must be rejected."""
        res = client.post("/expenses", json=make_payload(amount="1000000.00"))
        assert res.status_code == 422
        assert "999999" in res.text

    def test_description_is_stripped_of_whitespace(self, client):
        """schemas.py:46 — leading/trailing whitespace must be stripped silently."""
        res = client.post("/expenses", json=make_payload(description="  Grocery run  "))
        assert res.status_code == 201
        assert res.json()["description"] == "Grocery run"

    def test_empty_description_rejected(self, client):
        """schemas.py:50 — empty descriptions must trigger custom ValueError."""
        res = client.post("/expenses", json=make_payload(description="   "))
        assert res.status_code == 422
        assert "Please enter a valid description" in res.text

    def test_invalid_idempotency_key_format_rejected(self, client):
        """schemas.py:65-66 — non-UUID idempotency_key must be rejected."""
        res = client.post("/expenses", json=make_payload(idempotency_key="not-a-uuid"))
        assert res.status_code == 422
        assert "idempotency_key" in res.text

    def test_no_idempotency_key_creates_independent_records(self, client):
        """schemas.py:61-62 — None idempotency_key is valid; two posts = two records."""
        p1 = make_payload(idempotency_key=None)
        p2 = make_payload(idempotency_key=None)
        client.post("/expenses", json=p1)
        client.post("/expenses", json=p2)
        assert len(client.get("/expenses").json()["items"]) == 2


# ── Sort Ascending (coverage completeness) ────────────────────────────────────

class TestSortAscending:
    def test_sort_date_asc(self, client):
        """crud.py:53 — DATE_ASC branch must order oldest first."""
        client.post("/expenses", json=make_payload(date=YESTERDAY, amount="10.00"))
        client.post("/expenses", json=make_payload(date=TODAY, amount="20.00"))

        items = client.get("/expenses?sort=date_asc").json()["items"]
        assert items[0]["date"] == YESTERDAY
        assert items[1]["date"] == TODAY


# ── Global Exception Handler ──────────────────────────────────────────────────

class TestExceptionHandler:
    def test_unhandled_exception_returns_500_json(self, no_raise_client):
        """main.py:61-63 — global handler must return structured JSON with request_id."""
        from unittest.mock import patch
        import app.crud as crud_module

        def boom(*args, **kwargs):
            raise RuntimeError("Simulated unexpected error")

        with patch.object(crud_module, "list_expenses", boom):
            res = no_raise_client.get("/expenses", headers={"X-Request-ID": "test-req-123"})

        assert res.status_code == 500
        body = res.json()
        assert body["detail"] == "Internal server error"
        assert "request_id" in body
