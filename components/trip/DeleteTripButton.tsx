"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTripAction } from "@/lib/actions/trip-actions";
import { Button, ErrorBanner } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export function DeleteTripButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const { pending, error, run } = useAction();
  const router = useRouter();

  if (!confirming)
    return (
      <Button variant="secondary" className="text-red-700" onClick={() => setConfirming(true)}>
        Delete trip
      </Button>
    );

  return (
    <div role="alertdialog" aria-label="Confirm delete" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-sm text-red-800">
        Delete <strong>{title}</strong> and all its categories and expenses? This can&apos;t be undone.
      </p>
      <ErrorBanner message={error} />
      <div className="flex gap-2">
        <Button
          variant="danger"
          disabled={pending}
          autoFocus
          onClick={() =>
            run(
              () => deleteTripAction(id),
              () => {
                router.push("/");
                router.refresh();
              },
            )
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
