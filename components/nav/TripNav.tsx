import { NotSignedInError } from "@/lib/auth";
import { loadTripList } from "@/lib/data/trip-view";
import { Skeleton } from "@/components/ui/primitives";
import { TripNavList } from "./TripNavList";

export async function TripNav() {
  try {
    const trips = await loadTripList();
    return <TripNavList trips={trips.map((t) => ({ id: t.id, title: t.title }))} />;
  } catch (e) {
    if (e instanceof NotSignedInError) return null;
    return <TripNavList trips={[]} error="Couldn't load trips." />;
  }
}

export function TripNavSkeleton() {
  return (
    <div className="space-y-2 px-5 pt-3" aria-busy="true" aria-label="Loading trips">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-6 w-3/5" />
    </div>
  );
}
