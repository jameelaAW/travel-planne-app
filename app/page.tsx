import Link from "next/link";
import { listTripTotals } from "@/lib/data/trips";
import { loadTripList } from "@/lib/data/trip-view";
import { formatDateRange, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/primitives";
import { NewTripPanel } from "@/components/trip/NewTripPanel";
import { BudgetBar } from "@/components/budget/BudgetBar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [trips, totals] = await Promise.all([loadTripList(), listTripTotals()]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your trips</h1>
        <p className="text-sm text-slate-500">Plan where every dollar goes before you book.</p>
      </header>

      <NewTripPanel />

      {trips.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-600">No trips yet. Create your first trip.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => {
            const { spent } = totals.get(t.id) ?? { allocated: 0, spent: 0 };
            const remaining = t.total_budget - spent;
            return (
              <li key={t.id}>
                <Link
                  href={`/trips/${t.id}`}
                  className="block space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-400 hover:shadow focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  <div>
                    <h2 className="font-semibold text-slate-900">{t.title}</h2>
                    <p className="text-sm text-slate-500">{t.destination}</p>
                    <p className="text-xs text-slate-400">{formatDateRange(t.start_date, t.end_date)}</p>
                  </div>
                  <BudgetBar spent={spent} limit={t.total_budget} currency={t.currency} label={`${t.title} planned spend`} size="sm" />
                  <div className="flex items-baseline justify-between text-sm tabular-nums">
                    <span className="text-slate-600">
                      {formatMoney(spent, t.currency)} / {formatMoney(t.total_budget, t.currency)}
                    </span>
                    <span className={`font-semibold ${remaining < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {remaining < 0 ? `−${formatMoney(-remaining, t.currency)} over` : `${formatMoney(remaining, t.currency)} left`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
