<div align="center">
  <div style="background-color: #4f46e5; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 32px;">₹ FinTrack</h1>
  </div>
  <h3>Production-Grade Personal Expense Tracker</h3>
  <p>A full-stack financial application focusing on correctness, exact math, and idempotency.</p>

  <div>
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  </div>

  <br />

  [![Backend Tests](https://img.shields.io/badge/tests-22%20passed-brightgreen?style=flat-square)]()
  [![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square)]()
  [![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg?style=flat-square)]()
</div>

<hr />

## 📑 Table of Contents

- [Live Demo](#-live-demo)
- [Core Features](#-core-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Engineering Decisions](#-key-engineering-decisions)
- [Trade-offs & Omissions](#-trade-offs--omissions)
- [Local Setup](#-local-setup)
- [Testing](#-testing)
- [API Reference](#-api-reference)

---

## 🚀 Live Demo

| Service | Environment | URL |
|---------|-------------|-----|
| **Frontend UI** | Vercel | *(Pending Deployment)* |
| **Backend API** | Railway | *(Pending Deployment)* |
| **API Swagger Docs** | Railway | *(Pending Deployment)* `/docs` |

---

## ✨ Core Features

- **Create & Delete Expenses:** Add expenses with strict validation, or securely delete them.
- **Dynamic Ledger:** View, filter (by category), and sort expenses instantly.
- **Analytics Dashboard:** Real-time spending breakdown panel with visual donut charts.
- **Data Export:** Cross-browser native CSV export that strictly obeys current UI filters.
- **Idempotent Operations:** Prevents duplicate expenses if a network request drops or user double-clicks.
- **Bulletproof Math:** Total calculation prevents JavaScript floating-point errors.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend Framework** | **FastAPI (Python 3.12)** | Fast execution, native async support, and auto-generated OpenAPI documentation. |
| **Validation** | **Pydantic v2** | Strong typed data serialization and strict boundary validation. Custom user-friendly error messages. |
| **ORM / Database** | **SQLAlchemy 2.0 + SQLite** | ACID-compliant storage. SQLite was chosen for zero-infra overhead while maintaining relational data integrity. |
| **Frontend Framework** | **Next.js 14 (App Router)** | Production-ready React framework with excellent developer experience and SSR capabilities. |
| **Data Fetching** | **TanStack React Query** | Built-in caching, retry mechanisms, and loading/error state management. |
| **Styling** | **Vanilla CSS** | Zero framework bloat. Utilizes CSS variables for a strict, modern design system. |

---

## 🧠 Key Engineering Decisions

### 1. Money Handling (The Float Problem)
Floating-point arithmetic in JavaScript is notoriously inaccurate for currency. 
- **Database:** `amount` is stored as `NUMERIC(12, 2)`.
- **Backend Memory:** Handled strictly as Python's exact `Decimal`.
- **API Boundary:** Returned to the frontend as a `string`. The frontend only uses `Intl.NumberFormat` for rendering.

### 2. Idempotent POST (`/expenses`)
Unreliable networks cause duplicate submissions. 
- The React client generates a **UUID v4 Idempotency Key**.
- If the backend detects the same key, it returns HTTP `200 OK` with the *original* record instead of a duplicate.

### 3. Server-Side Filtering
The frontend does not filter in memory. Category filtering and sorting are passed as query parameters to the backend, which pushes the work to the database and returns a pre-computed `total`.

---

## ⚖️ Trade-offs & Omissions

Due to the timebox and explicit requirements of the assignment, the following were intentionally omitted to prioritize correctness and depth:

- **PostgreSQL:** SQLite was used to minimize infrastructure overhead. 
- **Authentication:** Not required. Adding JWTs would dilute the focus from the core tracking logic.
- **Edit Operations:** Skipped to avoid complex UI states, though "Delete" was added for UX safety.
- **Pagination:** Assumed a personal dataset scale.

---

## 💻 Local Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)

pip install -r requirements.txt
cp .env.example .env

# Start the server (auto-creates SQLite db)
python -m uvicorn app.main:app --reload --port 8000
```
Interactive API docs will be available at: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local

# Start the dev server
npm run dev
```
Open the UI at: `http://localhost:3000`

---

## 🧪 Testing

The backend is fully covered by automated integration tests using `pytest` and a shared in-memory SQLite connection fixture.

```bash
cd backend
python -m pytest tests/ -v --cov=app --cov-report=term-missing
```

**Coverage:** Exactly 100% (25 passing tests).
**Highlights:** Tests explicitly verify idempotency, exact decimal math, category boundary rejection, deletion, and the global exception handler.

---

## 📡 API Reference

### Endpoints
- `POST /expenses` — Create expense (idempotent via `idempotency_key`)
- `GET /expenses` — List expenses (Accepts `?category=` and `?sort=`)
- `GET /expenses/export/csv` — Download CSV of the current filtered view
- `GET /health` — Health check

### Data Model
```typescript
{
  "id": "uuid-string",
  "amount": "123.45",
  "category": "Food | Transport | Housing | ...",
  "description": "Lunch",
  "date": "2026-04-26",
  "created_at": "2026-04-26T12:00:00Z"
}
```
