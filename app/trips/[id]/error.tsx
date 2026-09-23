"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui/primitives";

export default function TripError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Card className="space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Couldn&apos;t load this trip</h1>
        <p className="text-sm text-slate-600">Check your connection and retry.</p>
        {error?.message && <p className="text-xs text-slate-400">{error.message}</p>}
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Retry</Button>
          <Link href="/" className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm">
            All trips
          </Link>
        </div>
      </Card>
    </main>
  );
}
