"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/data/types";
import { Button, Card } from "@/components/ui/primitives";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseRow } from "./ExpenseRow";

export function AllExpenses({
  tripId,
  expenses,
  currency,
  categories,
}: {
  tripId: string;
  expenses: Expense[];
  currency: string;
  categories: Pick<Category, "id" | "name">[];
}) {
  const [adding, setAdding] = useState(false);
  const names = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      {adding ? (
        <ExpenseForm
          tripId={tripId}
          categories={categories}
          defaultCategoryId={categories[0]?.id ?? null}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button onClick={() => setAdding(true)}>+ Add expense</Button>
      )}
      <Card className="px-4">
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No expenses planned yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((e) => (
              <ExpenseRow
                key={e.id}
                tripId={tripId}
                expense={e}
                currency={currency}
                categories={categories}
                categoryName={(e.category_id && names.get(e.category_id)) || "Uncategorized"}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
