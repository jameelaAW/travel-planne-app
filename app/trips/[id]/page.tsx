import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/lib/data/trips";
import { formatDateRange, formatMoney } from "@/lib/format";
import { EditTripPanel } from "@/components/trip/EditTripPanel";
import { DeleteTripButton } from "@/components/trip/DeleteTripButton";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        ← All trips
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{trip.title}</h1>
        <p className="text-slate-600">
          {trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}
        </p>
        <p className="text-lg font-semibold tabular-nums">
          {formatMoney(trip.total_budget, trip.currency)} <span className="text-sm font-normal text-slate-500">total budget</span>
        </p>
      </header>
      <div className="flex flex-wrap items-start gap-3">
        <EditTripPanel trip={trip} />
        <DeleteTripButton id={trip.id} title={trip.title} />
      </div>
    </main>
  );
}
