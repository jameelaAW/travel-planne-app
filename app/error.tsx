"use client";

import { Button, Card } from "@/components/ui/primitives";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Card className="space-y-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Couldn&apos;t load your trips</h1>
        <p className="text-sm text-slate-600">
          Check your connection and retry.
          {error?.message ? <span className="mt-1 block text-xs text-slate-400">{error.message}</span> : null}
        </p>
        <Button onClick={reset}>Retry</Button>
      </Card>
    </main>
  );
}
