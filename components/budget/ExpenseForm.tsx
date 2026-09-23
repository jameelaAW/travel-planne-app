"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/data/types";
import { createExpenseAction, updateExpenseAction } from "@/lib/actions/expense-actions";
import { formatMoney, parseAmount } from "@/lib/format";
import { CurrencySelect, useFx } from "@/components/fx/FxProvider";
import { Button, ErrorBanner, Field, Input } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

type Props = {
  tripId: string;
  tripCurrency: string;
  categories: Pick<Category, "id" | "name">[];
  defaultCategoryId?: string | null;
  expense?: Expense;
  onDone: () => void;
  onCancel: () => void;
};

export function ExpenseForm({ tripId, tripCurrency, categories, defaultCategoryId, expense, onDone, onCancel }: Props) {
  const { pending, error, fieldErrors, setFieldErrors, run } = useAction();
  // Editing a converted expense shows what the user originally entered.
  const [amount, setAmount] = useState(expense ? String(expense.original_amount ?? expense.amount) : "");
  const [currency, setCurrency] = useState(expense?.original_currency ?? tripCurrency);
  const { preview } = useFx();
  const parsed = parseAmount(amount);
  const fx = parsed !== null ? preview(parsed, currency, tripCurrency) : null;
  const amountError =
    amount !== "" && parsed === null
      ? "Amount must be a number."
      : parsed !== null && parsed < 0
        ? "Amount can't be negative."
        : fieldErrors.amount;

  return (
    <form
      noValidate
      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const errs: Record<string, string> = {};
        if (!String(form.get("title") ?? "").trim()) errs.title = "Title is required.";
        if (parseAmount(form.get("amount")) === null) errs.amount = "Amount must be a number.";
        if (Object.keys(errs).length) return setFieldErrors(errs);
        run(
          () => (expense ? updateExpenseAction(tripId, expense.id, form) : createExpenseAction(tripId, form)),
          onDone,
        );
      }}
    >
      <ErrorBanner message={error} />
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
        <Field label="Expense" error={fieldErrors.title}>
          <Input name="title" defaultValue={expense?.title} placeholder="Round-trip flight" autoFocus invalid={!!fieldErrors.title} />
        </Field>
        <Field label="Amount" error={amountError}>
          <Input
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            invalid={!!amountError}
          />
        </Field>
        <Field label="Currency" error={fieldErrors.currency}>
          <CurrencySelect name="currency" label="Expense currency" value={currency} onChange={setCurrency} />
        </Field>
      </div>
      {currency !== tripCurrency && (
        <p role="status" className="text-xs text-slate-600">
          {fx ? (
            <>
              ≈ <strong className="tabular-nums">{formatMoney(fx.amount, tripCurrency)}</strong> at the ECB reference rate ({fx.date}): 1{" "}
              {currency} = {Number(fx.rate.toPrecision(6))} {tripCurrency}. Saved in {tripCurrency}; the exact rate is applied on save.
            </>
          ) : (
            <>Will be converted to {tripCurrency} at the latest ECB reference rate on save.</>
          )}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select
            name="category_id"
            defaultValue={expense ? (expense.category_id ?? "") : (defaultCategoryId ?? "")}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-2 focus:outline-teal-600"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="">Uncategorized</option>
          </select>
        </Field>
        <Field label="Notes (optional)">
          <Input name="notes" defaultValue={expense?.notes ?? ""} placeholder="e.g. booked via airline site" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="is_estimated" defaultChecked={expense ? expense.is_estimated : true} className="size-4 accent-teal-700" />
        Estimate (not booked yet)
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !!amountError || amount === ""}>
          {pending ? "Saving…" : expense ? "Save expense" : "Add expense"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
