"use client";

import { useState } from "react";
import type { Category, SortOrder } from "@/types/expense";
import { CATEGORIES } from "@/types/expense";
import { api } from "@/lib/api";

interface Props {
  category: Category | "";
  sort: SortOrder;
  onCategoryChange: (c: Category | "") => void;
  onSortChange: (s: SortOrder) => void;
}

export default function FilterBar({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportCSV() {
    setIsExporting(true);
    try {
      const url = api.getCsvExportUrl({ category: category || undefined, sort });
      // Direct navigation allows the browser's native download manager to take over
      // It will see the backend's "Content-Disposition: attachment; filename=expenses.csv"
      // header and save it correctly without leaving the page.
      window.location.href = url;
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      // Small delay to allow the navigation to register before un-disabling the button
      setTimeout(() => setIsExporting(false), 500);
    }
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar__controls">
        <div className="filter-group">
          <label className="filter-group__label" htmlFor="filter-category">
            Category
          </label>
          <select
            id="filter-category"
            className="field__input field__select filter-group__select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as Category | "")}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-group__label" htmlFor="filter-sort">
            Sort
          </label>
          <select
            id="filter-sort"
            className="field__input field__select filter-group__select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
          </select>
        </div>
      </div>

      <button
        id="export-csv"
        type="button"
        onClick={handleExportCSV}
        disabled={isExporting}
        className="btn btn--outline"
      >
        {isExporting ? "Exporting…" : "⬇ Export CSV"}
      </button>
    </div>
  );
}
