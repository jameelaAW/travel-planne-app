"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { Button, Card } from "@/components/ui/primitives";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseRow } from "./ExpenseRow";

export function UncategorizedCard({
  tripId,
  expenses,
  spent,
  currency,
  categories,
}: {
  tripId: string;
  expenses: Expense[];
  spent: number;
  currency: string;
  categories: Pick<Category, "id" | "name">[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <Card className="space-y-3 border-dashed p-4">
      <section aria-label="Uncategorized" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Uncategorized</h3>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(spent, currency)}</span>
        </div>
        <p className="text-xs text-slate-500">Counts toward the trip total. Edit an expense to move it into a category.</p>
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No expenses planned yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((e) => (
              <ExpenseRow key={e.id} tripId={tripId} expense={e} currency={currency} categories={categories} />
            ))}
          </ul>
        )}
        {adding ? (
          <ExpenseForm tripCurrency={currency} tripId={tripId} categories={categories} defaultCategoryId={null} onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
        ) : (
          <Button variant="secondary" className="py-1 text-xs" onClick={() => setAdding(true)}>
            + Add expense
          </Button>
        )}
      </section>
    </Card>
  );
}
