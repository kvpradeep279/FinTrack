"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseTable from "@/components/ExpenseTable";
import FilterBar from "@/components/FilterBar";
import TotalBanner from "@/components/TotalBanner";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import { useExpenses } from "@/hooks/useExpenses";
import type { Category, SortOrder } from "@/types/expense";

const queryClient = new QueryClient();

function Dashboard() {
  const [category, setCategory] = useState<Category | "">("");
  const [sort, setSort] = useState<SortOrder>("date_desc");

  const { data, isLoading, isError, error, refetch } = useExpenses({
    category: category || undefined,
    sort,
  });

  // Always fetch unfiltered data so the Spending Breakdown shows the true global percentages
  const { data: allData, isLoading: isAllLoading } = useExpenses({});

  const expenses = data?.items ?? [];
  const allExpenses = allData?.items ?? [];
  const total = data?.total ?? "0.00";

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">₹</span>
            <div>
              <h1 className="app-header__title">FinTrack</h1>
              <p className="app-header__subtitle">Personal Expense Tracker</p>
            </div>
          </div>
          <TotalBanner total={total} count={expenses.length} isLoading={isLoading} />
        </div>
      </header>

      {/* ── Main Layout ────────────────────────────── */}
      <main className="app-main">
        {/* Sidebar: Add Expense */}
        <aside className="sidebar">
          <ExpenseForm />
        </aside>

        {/* Content: Filters + Table */}
        <section className="content">
          {/* Filter Bar */}
          <FilterBar
            category={category}
            sort={sort}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />

          {/* Error State */}
          {isError && (
            <div className="alert alert--error alert--with-retry">
              <span>
                Failed to load expenses:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </span>
              <button
                className="btn btn--small"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Expense Table */}
          <ExpenseTable expenses={expenses} isLoading={isLoading} />
          
          {/* Spending Breakdown (Horizontal Row) */}
          {!isAllLoading && allExpenses.length > 0 && <SpendingBreakdown expenses={allExpenses} />}
        </section>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
