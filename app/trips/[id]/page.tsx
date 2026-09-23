import Link from "next/link";
import { notFound } from "next/navigation";
import { summarizeTrip } from "@/lib/budget";
import { listCategories } from "@/lib/data/categories";
import { listExpenses } from "@/lib/data/expenses";
import { getTrip } from "@/lib/data/trips";
import { formatDateRange } from "@/lib/format";
import { EditTripPanel } from "@/components/trip/EditTripPanel";
import { DeleteTripButton } from "@/components/trip/DeleteTripButton";
import { TripSummaryCard } from "@/components/budget/TripSummaryCard";
import { CategoriesView } from "@/components/budget/CategoriesView";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();
  const [categories, expenses] = await Promise.all([listCategories(id), listExpenses(id)]);
  const summary = summarizeTrip(trip, categories, expenses);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        ← All trips
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{trip.title}</h1>
          <p className="text-slate-600">
            {trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <EditTripPanel trip={trip} />
          <DeleteTripButton id={trip.id} title={trip.title} />
        </div>
      </header>
      <TripSummaryCard summary={summary} currency={trip.currency} />
      <h2 className="text-lg font-semibold">Budget categories</h2>
      <CategoriesView tripId={trip.id} summary={summary} currency={trip.currency} />
    </main>
  );
}
