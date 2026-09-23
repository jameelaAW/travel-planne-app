import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTripView } from "@/lib/data/trip-view";
import { formatMoney } from "@/lib/format";
import { allocationBalance, budgetFitScore, rankCategories } from "@/lib/scoring";
import { Card } from "@/components/ui/primitives";
import { EditTripPanel } from "@/components/trip/EditTripPanel";
import { DeleteTripButton } from "@/components/trip/DeleteTripButton";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripSummaryCard } from "@/components/budget/TripSummaryCard";
import { FitScoreCard } from "@/components/budget/FitScoreCard";
import { BudgetBar, RemainingText } from "@/components/budget/BudgetBar";

export const dynamic = "force-dynamic";

export default async function TripOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await loadTripView(id);
  if (!view) notFound();
  const { trip, summary, expenses, categories } = view;
  const cur = trip.currency;
  const fit = budgetFitScore(summary);
  const ranked = rankCategories(summary.categories);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const largest = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <TripHeader trip={trip} section="Overview">
        <EditTripPanel trip={trip} />
        <DeleteTripButton id={trip.id} title={trip.title} />
      </TripHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <TripSummaryCard summary={summary} currency={cur} />
        <FitScoreCard fit={fit} overspent={summary.overspentCount} total={summary.categories.length} balance={allocationBalance(summary)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="ranking" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="ranking" className="text-lg font-semibold">
              Categories by risk
            </h2>
            <Link href={`/trips/${trip.id}/categories`} className="text-sm text-teal-700 hover:underline">
              Edit allocations →
            </Link>
          </div>
          <Card className="divide-y divide-slate-100">
            {ranked.length === 0 && <p className="p-4 text-sm text-slate-500">No categories yet.</p>}
            {ranked.map((c) => (
              <div key={c.id} className="space-y-1.5 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <RemainingText remaining={c.remaining} currency={cur} className="text-xs" />
                </div>
                <BudgetBar spent={c.spent} limit={c.allocated_amount} currency={cur} label={`${c.name} spend`} size="sm" />
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatMoney(c.spent, cur)} of {formatMoney(c.allocated_amount, cur)}
                </p>
              </div>
            ))}
          </Card>
        </section>

        <section aria-labelledby="largest" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="largest" className="text-lg font-semibold">
              Largest expenses
            </h2>
            <Link href={`/trips/${trip.id}/expenses`} className="text-sm text-teal-700 hover:underline">
              All expenses →
            </Link>
          </div>
          <Card className="divide-y divide-slate-100">
            {largest.length === 0 && <p className="p-4 text-sm text-slate-500">No expenses planned yet.</p>}
            {largest.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-slate-500">{(e.category_id && catName.get(e.category_id)) || "Uncategorized"}</p>
                </div>
                <span className="font-semibold tabular-nums">{formatMoney(e.amount, cur)}</span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </main>
  );
}
