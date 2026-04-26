"use client";

import type { Expense } from "@/types/expense";

interface Props {
  expenses: Expense[];
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function SpendingBreakdown({ expenses }: Props) {
  if (expenses.length === 0) return null;

  // Aggregate totals per category
  const map = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const prev = map.get(exp.category) ?? { total: 0, count: 0 };
    map.set(exp.category, {
      total: prev.total + parseFloat(exp.amount),
      count: prev.count + 1,
    });
  }

  const grandTotal = Array.from(map.values()).reduce((s, v) => s + v.total, 0);

  const summaries: CategorySummary[] = Array.from(map.entries())
    .map(([cat, { total, count }]) => ({
      category: cat,
      total,
      count,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      color: CATEGORY_COLORS[cat] ?? "#6b7280",
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="breakdown-card breakdown-card--compact">
      <h3 className="breakdown-card__title" style={{ marginBottom: "16px", textAlign: "center" }}>
        Spending Breakdown
      </h3>
      
      <div className="mini-rings-container">
        {summaries.map((s) => {
          // Creates a progress ring: filled with the category color up to the percentage, the rest is gray
          const gradient = `conic-gradient(${s.color} 0% ${s.percentage}%, var(--color-border) ${s.percentage}% 100%)`;
          return (
            <div key={s.category} className="mini-ring-item" title={`${s.count} expense(s) — ${formatCurrency(s.total)}`}>
              <div className="mini-ring-chart-wrapper">
                <div 
                  className="mini-ring-chart" 
                  style={{ background: gradient }}
                />
                <span className="mini-ring-center-text" style={{ color: s.color }}>
                  <span className="mini-ring-val">{s.percentage.toFixed(0)}</span>
                  <span className="mini-ring-sym">%</span>
                </span>
              </div>
              <span className="mini-ring-name">{s.category}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
