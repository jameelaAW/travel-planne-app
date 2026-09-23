import { notFound } from "next/navigation";
import { readStoredPlan } from "@/lib/ai/allocation";
import { loadTripView } from "@/lib/data/trip-view";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripSummaryCard } from "@/components/budget/TripSummaryCard";
import { CategoriesView } from "@/components/budget/CategoriesView";
import { SmartAllocationPanel } from "@/components/budget/SmartAllocationPanel";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await loadTripView(id);
  if (!view) notFound();
  const { trip, summary } = view;
  const current: Record<string, number> = {};
  for (const c of summary.categories) current[c.category_type] = (current[c.category_type] ?? 0) + c.allocated_amount;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <TripHeader trip={trip} section="Categories" />
      <TripSummaryCard summary={summary} currency={trip.currency} />
      <SmartAllocationPanel
        tripId={trip.id}
        currency={trip.currency}
        plan={readStoredPlan(trip.ai_suggested_allocation)}
        status={trip.ai_review_status}
        current={current}
      />
      <CategoriesView tripId={trip.id} summary={summary} currency={trip.currency} />
    </main>
  );
}
