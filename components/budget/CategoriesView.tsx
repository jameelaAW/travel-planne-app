import type { TripSummary } from "@/lib/budget";
import { Card } from "@/components/ui/primitives";
import { AddCategory, RestoreDefaultsButton } from "./AddCategory";
import { CategoryCard } from "./CategoryCard";
import { UncategorizedCard } from "./UncategorizedCard";

export function CategoriesView({ tripId, summary, currency }: { tripId: string; summary: TripSummary; currency: string }) {
  const options = summary.categories.map((c) => ({ id: c.id, name: c.name }));
  return (
    <div className="space-y-4">
      {summary.categories.length === 0 ? (
        <Card className="space-y-3 p-6 text-center">
          <p className="text-slate-600">This trip has no budget categories.</p>
          <div className="flex justify-center">
            <RestoreDefaultsButton tripId={tripId} />
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.categories.map((c) => (
            <CategoryCard key={c.id} tripId={tripId} category={c} currency={currency} categories={options} />
          ))}
        </div>
      )}
      {(summary.uncategorized.length > 0 || summary.categories.length === 0) && (
        <UncategorizedCard
          tripId={tripId}
          expenses={summary.uncategorized}
          spent={summary.uncategorizedSpent}
          currency={currency}
          categories={options}
        />
      )}
      <AddCategory tripId={tripId} />
    </div>
  );
}
