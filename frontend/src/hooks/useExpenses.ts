"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ListExpensesParams } from "@/lib/api";
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "@/lib/idempotency";
import type { Category, CreateExpensePayload } from "@/types/expense";

export const EXPENSES_QUERY_KEY = "expenses";

export function useExpenses(params: ListExpensesParams) {
  return useQuery({
    queryKey: [EXPENSES_QUERY_KEY, params],
    queryFn: () => api.listExpenses(params),
    staleTime: 30_000,
    retry: 2,
  });
}

export interface CreateExpenseInput {
  amount: string;
  category: Category;
  description: string;
  date: string;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => {
      const key = getOrCreateIdempotencyKey();
      const payload: CreateExpensePayload = { ...input, idempotency_key: key };
      return api.createExpense(payload);
    },
    onSuccess: () => {
      // Clear key after confirmed success — next submission gets a fresh UUID
      clearIdempotencyKey();
      // Invalidate all expense queries so the list refreshes
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
    },
  });
}
