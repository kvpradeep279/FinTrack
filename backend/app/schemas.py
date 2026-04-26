import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Category(str, Enum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    HOUSING = "Housing"
    HEALTHCARE = "Healthcare"
    ENTERTAINMENT = "Entertainment"
    SHOPPING = "Shopping"
    EDUCATION = "Education"
    OTHER = "Other"


class SortOrder(str, Enum):
    DATE_DESC = "date_desc"
    DATE_ASC = "date_asc"


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., description="Positive amount with at most 2 decimal places")
    category: Category
    description: str = Field(..., max_length=500)
    date: date
    idempotency_key: Optional[str] = Field(None, description="UUID v4 for safe retries")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        quantized = v.quantize(Decimal("0.01"))
        if quantized != v:
            raise ValueError("Amount must have at most 2 decimal places")
        if v > Decimal("999999.99"):
            raise ValueError("Amount exceeds maximum allowed value of 999999.99")
        return quantized

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Please enter a valid description")
        return stripped

    @field_validator("date")
    @classmethod
    def date_not_future(cls, v: date) -> date:
        from datetime import date as date_type
        if v > date_type.today():
            raise ValueError("Expense date cannot be in the future")
        return v

    @field_validator("idempotency_key")
    @classmethod
    def validate_uuid_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            uuid.UUID(v, version=4)
        except ValueError:
            raise ValueError("idempotency_key must be a valid UUID v4")
        return v


class ExpenseResponse(BaseModel):
    id: str
    # amount returned as string — avoids JavaScript float precision loss (e.g. 0.1 + 0.2)
    amount: str
    category: str
    description: str
    date: date
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, expense) -> "ExpenseResponse":
        return cls(
            id=expense.id,
            amount=str(expense.amount),
            category=expense.category,
            description=expense.description,
            date=expense.date,
            created_at=expense.created_at,
        )


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: str  # Server-computed sum of the filtered result set

    @classmethod
    def build(cls, expenses: list) -> "ExpenseListResponse":
        items = [ExpenseResponse.from_orm_model(e) for e in expenses]
        total = sum((Decimal(item.amount) for item in items), Decimal("0"))
        return cls(items=items, total=str(total.quantize(Decimal("0.01"))))
