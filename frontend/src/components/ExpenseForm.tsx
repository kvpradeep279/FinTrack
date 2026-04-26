"use client";

import { useState, useEffect } from "react";
import { useCreateExpense } from "@/hooks/useExpenses";
import { getOrCreateIdempotencyKey } from "@/lib/idempotency";
import { CATEGORIES, type Category } from "@/types/expense";
import { ApiError } from "@/lib/api";

interface Props {
  onSuccess?: () => void;
}

const today = new Date().toISOString().split("T")[0];

export default function ExpenseForm({ onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate, isPending } = useCreateExpense();

  // Pre-generate idempotency key when user first touches the form
  useEffect(() => {
    getOrCreateIdempotencyKey();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Client-side guard before hitting the API
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Amount must be a positive number.");
      return;
    }

    mutate(
      { amount, category, description, date },
      {
        onSuccess: () => {
          setAmount("");
          setDescription("");
          setDate(today);
          setCategory("Food");
          setSuccessMsg("Expense added!");
          setTimeout(() => setSuccessMsg(""), 3000);
          onSuccess?.();
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            setErrorMsg(err.detail);
          } else {
            setErrorMsg("Network error — your expense was not saved. You can retry safely.");
          }
        },
      }
    );
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">Add Expense</h2>

      {successMsg && <div className="alert alert--success">{successMsg}</div>}
      {errorMsg && <div className="alert alert--error">{errorMsg}</div>}

      <div className="field">
        <label className="field__label" htmlFor="amount">Amount (₹)</label>
        <input
          id="amount"
          className="field__input"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="category">Category</label>
        <select
          id="category"
          className="field__input field__select"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          disabled={isPending}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">Description</label>
        <input
          id="description"
          className="field__input"
          type="text"
          placeholder="e.g. Lunch at Subway"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          required
          disabled={isPending}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="date">Date</label>
        <input
          id="date"
          className="field__input"
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <button
        id="submit-expense"
        type="submit"
        className="btn btn--primary"
        disabled={isPending}
      >
        {isPending ? (
          <span className="btn__spinner">Saving…</span>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}
