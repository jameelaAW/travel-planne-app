import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading trip">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
