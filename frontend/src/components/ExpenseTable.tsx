"use client";

import { useDeleteExpense } from "@/hooks/useExpenses";
import type { Expense } from "@/types/expense";

interface Props {
  expenses: Expense[];
  isLoading: boolean;
}

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Housing: "#8b5cf6",
  Healthcare: "#ec4899",
  Entertainment: "#f59e0b",
  Shopping: "#10b981",
  Education: "#06b6d4",
  Other: "#6b7280",
};

export default function ExpenseTable({ expenses, isLoading }: Props) {
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  if (isLoading) {
    return (
      <div className="table-container">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📋</div>
        <p className="empty-state__text">No expenses yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th className="text-right">Amount</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id} className="expense-row">
              <td className="expense-row__date">{formatDate(exp.date)}</td>
              <td>
                <span
                  className="category-badge"
                  style={{
                    backgroundColor:
                      (CATEGORY_COLORS[exp.category] ?? "#6b7280") + "20",
                    color: CATEGORY_COLORS[exp.category] ?? "#6b7280",
                    borderColor:
                      (CATEGORY_COLORS[exp.category] ?? "#6b7280") + "40",
                  }}
                >
                  {exp.category}
                </span>
              </td>
              <td className="expense-row__desc">{exp.description}</td>
              <td className="expense-row__amount text-right">
                {formatCurrency(exp.amount)}
              </td>
              <td style={{ textAlign: "right", paddingRight: "16px" }}>
                <button
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this expense?")) {
                      deleteExpense(exp.id);
                    }
                  }}
                  disabled={isDeleting}
                  title="Delete expense"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
