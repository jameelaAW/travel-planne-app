import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading trips">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-28" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-4 h-6 w-24" />
          </div>
        ))}
      </div>
    </main>
  );
}
