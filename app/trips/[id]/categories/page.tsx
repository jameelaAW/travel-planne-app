import { notFound } from "next/navigation";
import { loadTripView } from "@/lib/data/trip-view";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripSummaryCard } from "@/components/budget/TripSummaryCard";
import { CategoriesView } from "@/components/budget/CategoriesView";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await loadTripView(id);
  if (!view) notFound();
  const { trip, summary } = view;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <TripHeader trip={trip} section="Categories" />
      <TripSummaryCard summary={summary} currency={trip.currency} />
      <CategoriesView tripId={trip.id} summary={summary} currency={trip.currency} />
    </main>
  );
}
