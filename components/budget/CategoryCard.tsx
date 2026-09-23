"use client";

import { useState } from "react";
import type { CategorySummary } from "@/lib/budget";
import type { Category } from "@/lib/data/types";
import { deleteCategoryAction, renameCategoryAction } from "@/lib/actions/category-actions";
import { formatMoney } from "@/lib/format";
import { Button, Card, ErrorBanner, Input } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";
import { AllocationInput } from "./AllocationInput";
import { BudgetBar, RemainingText } from "./BudgetBar";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseRow } from "./ExpenseRow";

export function CategoryCard({
  tripId,
  category,
  currency,
  categories,
}: {
  tripId: string;
  category: CategorySummary;
  currency: string;
  categories: Pick<Category, "id" | "name">[];
}) {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { pending, error, run } = useAction();

  return (
    <Card className={`p-4 ${category.over ? "border-red-300 ring-1 ring-red-200" : ""}`}>
      <section aria-label={category.name} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {renaming ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const name = String(new FormData(e.currentTarget).get("name") ?? "");
                run(() => renameCategoryAction(tripId, category.id, name), () => setRenaming(false));
              }}
            >
              <Input name="name" defaultValue={category.name} autoFocus aria-label="Category name" className="py-1" />
              <Button type="submit" className="py-1" disabled={pending}>
                Save
              </Button>
              <Button type="button" variant="ghost" className="py-1" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <h3 className="font-semibold text-slate-900">{category.name}</h3>
          )}
          <RemainingText remaining={category.remaining} currency={currency} className="text-sm" />
        </div>

        <AllocationInput
          tripId={tripId}
          categoryId={category.id}
          categoryName={category.name}
          value={category.allocated_amount}
          currency={currency}
        />

        <div className="space-y-1">
          <BudgetBar spent={category.spent} limit={category.allocated_amount} currency={currency} label={`${category.name} spend`} size="sm" />
          <p className="text-xs text-slate-500 tabular-nums">
            {formatMoney(category.spent, currency)} planned of {formatMoney(category.allocated_amount, currency)}
          </p>
        </div>

        {category.expenses.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No expenses planned yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {category.expenses.map((e) => (
              <ExpenseRow key={e.id} tripId={tripId} expense={e} currency={currency} categories={categories} />
            ))}
          </ul>
        )}

        {adding ? (
          <ExpenseForm tripCurrency={currency}
            tripId={tripId}
            categories={categories}
            defaultCategoryId={category.id}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
            <Button variant="secondary" className="py-1 text-xs" onClick={() => setAdding(true)} aria-label={`Add expense to ${category.name}`}>
              + Add expense
            </Button>
            <span className="flex-1" />
            {!renaming && (
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setRenaming(true)}>
                Rename
              </Button>
            )}
            {confirmDelete ? (
              <>
                <span className="text-xs text-slate-600">
                  Delete category?{category.expenses.length > 0 ? " Its expenses become Uncategorized." : ""}
                </span>
                <Button
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  disabled={pending}
                  onClick={() => run(() => deleteCategoryAction(tripId, category.id))}
                >
                  Delete
                </Button>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="px-2 py-1 text-xs text-red-700" onClick={() => setConfirmDelete(true)}>
                Delete category
              </Button>
            )}
          </div>
        )}
        <ErrorBanner message={error} />
      </section>
    </Card>
  );
}
