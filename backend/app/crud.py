import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Expense
from app.schemas import ExpenseCreate, SortOrder


def get_expense_by_idempotency_key(db: Session, key: str) -> Optional[Expense]:
    return db.scalar(select(Expense).where(Expense.idempotency_key == key))


def create_expense(db: Session, data: ExpenseCreate) -> tuple[Expense, bool]:
    """
    Create an expense. Returns (expense, created).
    created=False means this is an idempotent replay — original record returned unchanged.
    This ensures that network retries and page-refresh double-submits are safe.
    """
    if data.idempotency_key:
        existing = get_expense_by_idempotency_key(db, data.idempotency_key)
        if existing:
            return existing, False

    expense = Expense(
        id=str(uuid.uuid4()),
        amount=data.amount,
        category=data.category.value,
        description=data.description,
        date=data.date,
        idempotency_key=data.idempotency_key,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense, True


def list_expenses(
    db: Session,
    category: Optional[str] = None,
    sort: SortOrder = SortOrder.DATE_DESC,
) -> list[Expense]:
    stmt = select(Expense)

    if category:
        stmt = stmt.where(Expense.category == category)

    if sort == SortOrder.DATE_DESC:
        stmt = stmt.order_by(Expense.date.desc(), Expense.created_at.desc())
    else:
        stmt = stmt.order_by(Expense.date.asc(), Expense.created_at.asc())

    return list(db.scalars(stmt).all())


def delete_expense(db: Session, expense_id: str) -> bool:
    expense = db.scalar(select(Expense).where(Expense.id == expense_id))
    if not expense:
        return False
    db.delete(expense)
    db.commit()
    return True
