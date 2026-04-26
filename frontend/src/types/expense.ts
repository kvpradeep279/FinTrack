// Shared TypeScript types — single source of truth for the entire frontend.
// Categories must stay in sync with the backend Category enum.

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type SortOrder = "date_desc" | "date_asc";

export interface Expense {
  id: string;
  /** String to avoid JS float precision issues — parse with Decimal only for display */
  amount: string;
  category: Category;
  description: string;
  date: string; // ISO 8601 date string: YYYY-MM-DD
  created_at: string; // ISO 8601 datetime
}

export interface ExpenseListResponse {
  items: Expense[];
  /** Server-computed total of the filtered result set, as a string */
  total: string;
}

export interface CreateExpensePayload {
  amount: string;
  category: Category;
  description: string;
  date: string;
  idempotency_key: string;
}
