import Link from "next/link";
import { listTrips } from "@/lib/data/trips";
import { formatDateRange, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/primitives";
import { NewTripPanel } from "@/components/trip/NewTripPanel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trips = await listTrips();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your trips</h1>
          <p className="text-sm text-slate-500">Plan where every dollar goes before you book.</p>
        </div>
      </header>

      <NewTripPanel />

      {trips.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-600">No trips yet. Create your first trip.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trips/${t.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-400 hover:shadow focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                <h2 className="font-semibold text-slate-900">{t.title}</h2>
                <p className="text-sm text-slate-500">{t.destination}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateRange(t.start_date, t.end_date)}</p>
                <p className="mt-3 text-lg font-semibold tabular-nums">{formatMoney(t.total_budget, t.currency)}</p>
                <p className="text-xs text-slate-500">total budget</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
