import { notFound } from "next/navigation";
import { loadTripView } from "@/lib/data/trip-view";
import { formatMoney } from "@/lib/format";
import { TripHeader } from "@/components/trip/TripHeader";
import { AllExpenses } from "@/components/budget/AllExpenses";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await loadTripView(id);
  if (!view) notFound();
  const { trip, expenses, categories, summary } = view;
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <TripHeader trip={trip} section="Expenses" />
      <p className="text-sm text-slate-600">
        {expenses.length} planned {expenses.length === 1 ? "expense" : "expenses"} totalling{" "}
        <strong className="tabular-nums">{formatMoney(summary.spent, trip.currency)}</strong> of{" "}
        {formatMoney(summary.budget, trip.currency)} — largest first.
      </p>
      <AllExpenses
        tripId={trip.id}
        expenses={sorted}
        currency={trip.currency}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </main>
  );
}
