/**
 * Typed API client — all communication with the backend lives here.
 * No fetch calls are scattered across components.
 */
import type {
  Category,
  CreateExpensePayload,
  ExpenseListResponse,
  SortOrder,
} from "@/types/expense";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) {
        if (Array.isArray(body.detail)) {
          // Pydantic 422 validation errors are arrays of objects
          detail = body.detail
            .map((e: { msg: string }) => e.msg.replace(/^Value error, /, ""))
            .join(" — ");
        } else {
          // Standard FastAPI string detail
          detail = body.detail;
        }
      }
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) {
    return {} as Promise<T>;
  }

  return res.json() as Promise<T>;
}

export interface ListExpensesParams {
  category?: Category | "";
  sort?: SortOrder;
}

export const api = {
  createExpense(payload: CreateExpensePayload) {
    return request<{ id: string }>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listExpenses(params: ListExpensesParams = {}): Promise<ExpenseListResponse> {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.sort) qs.set("sort", params.sort);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<ExpenseListResponse>(`/expenses${query}`);
  },

  deleteExpense(id: string) {
    return request(`/expenses/${id}`, { method: "DELETE" });
  },

  /** Returns a CSV blob URL for the current filter state */
  getCsvExportUrl(params: ListExpensesParams = {}): string {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.sort) qs.set("sort", params.sort);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return `${BASE_URL}/expenses/export/csv${query}`;
  },
};

export { ApiError };
