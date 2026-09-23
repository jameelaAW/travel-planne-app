import type { Trip } from "@/lib/data/types";
import { formatDateRange } from "@/lib/format";

export function TripHeader({ trip, section, children }: { trip: Trip; section: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">{section}</p>
        <h1 className="text-2xl font-bold tracking-tight">{trip.title}</h1>
        <p className="text-slate-600">
          {trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}
        </p>
      </div>
      {children && <div className="flex flex-wrap items-start gap-2">{children}</div>}
    </header>
  );
}
