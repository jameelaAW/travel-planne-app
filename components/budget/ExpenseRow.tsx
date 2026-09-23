"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/data/types";
import { deleteExpenseAction } from "@/lib/actions/expense-actions";
import { formatMoney } from "@/lib/format";
import { Button, ErrorBanner } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";
import { ExpenseForm } from "./ExpenseForm";

export function ExpenseRow({
  tripId,
  expense,
  currency,
  categories,
  categoryName,
}: {
  tripId: string;
  expense: Expense;
  currency: string;
  categories: Pick<Category, "id" | "name">[];
  /** Shown when the row is listed outside its category (e.g. the all-expenses view). */
  categoryName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { pending, error, run } = useAction();

  if (editing)
    return (
      <li>
        <ExpenseForm tripCurrency={currency}
          tripId={tripId}
          categories={categories}
          expense={expense}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );

  return (
    <li className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{expense.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            {categoryName && <span>{categoryName}</span>}
            <span
              className={`rounded px-1.5 py-0.5 ${expense.is_estimated ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
            >
              {expense.is_estimated ? "Estimate" : "Booked"}
            </span>
            {expense.original_currency && expense.original_amount != null && (
              <span title={`${expense.fx_source ?? "ECB"} rate ${expense.fx_rate_date}: 1 ${expense.original_currency} = ${expense.fx_rate} ${currency}`}>
                {formatMoney(expense.original_amount, expense.original_currency)} · {expense.fx_source ?? "ECB"} {expense.fx_rate_date}
              </span>
            )}
            {expense.notes && <span className="truncate">{expense.notes}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 text-sm font-semibold tabular-nums">{formatMoney(expense.amount, currency)}</span>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setEditing(true)} aria-label={`Edit ${expense.title}`}>
            Edit
          </Button>
          {confirming ? (
            <>
              <Button
                variant="danger"
                className="px-2 py-1 text-xs"
                disabled={pending}
                autoFocus
                onClick={() => run(() => deleteExpenseAction(tripId, expense.id))}
                aria-label={`Confirm delete ${expense.title}`}
              >
                {pending ? "…" : "Delete"}
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs text-red-700"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${expense.title}`}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <ErrorBanner message={error} />
    </li>
  );
}
