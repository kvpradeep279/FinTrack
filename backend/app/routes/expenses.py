import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import (
    Category,
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    SortOrder,
)

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ExpenseResponse,
    summary="Create a new expense",
    description=(
        "Creates an expense. Idempotent when `idempotency_key` is supplied — "
        "retrying with the same key returns the original record (HTTP 200) instead "
        "of creating a duplicate. Safe for unreliable networks and double-submit."
    ),
)
def create_expense(
    data: ExpenseCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    expense, created = crud.create_expense(db, data)
    if not created:
        # Idempotent replay — resource already exists, signal with 200
        response.status_code = status.HTTP_200_OK
    return ExpenseResponse.from_orm_model(expense)


@router.get(
    "",
    response_model=ExpenseListResponse,
    summary="List expenses",
    description="Returns expenses with optional category filter and date sort. Total reflects the filtered set.",
)
def list_expenses(
    category: Optional[Category] = Query(None, description="Filter by category"),
    sort: SortOrder = Query(SortOrder.DATE_DESC, description="Sort order"),
    db: Session = Depends(get_db),
) -> ExpenseListResponse:
    expenses = crud.list_expenses(
        db,
        category=category.value if category else None,
        sort=sort,
    )
    return ExpenseListResponse.build(expenses)


@router.get(
    "/export/csv",
    summary="Export expenses as CSV",
    description="Downloads the currently filtered expense list as a CSV file.",
    response_class=Response,
)
def export_expenses_csv(
    category: Optional[Category] = Query(None),
    sort: SortOrder = Query(SortOrder.DATE_DESC),
    db: Session = Depends(get_db),
) -> Response:
    expenses = crud.list_expenses(
        db,
        category=category.value if category else None,
        sort=sort,
    )
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "date", "category", "description", "amount", "created_at"],
    )
    writer.writeheader()
    for e in expenses:
        writer.writerow(
            {
                "id": e.id,
                "date": str(e.date),
                "category": e.category,
                "description": e.description,
                "amount": str(e.amount),
                "created_at": e.created_at.isoformat(),
            }
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
    description="Deletes an expense by its UUID. Returns 404 if not found.",
)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    deleted = crud.delete_expense(db, expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
