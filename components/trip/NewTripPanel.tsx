"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTripAction } from "@/lib/actions/trip-actions";
import { Button, Card } from "@/components/ui/primitives";
import { TripForm } from "./TripForm";

export function NewTripPanel({ label = "New trip" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) return <Button onClick={() => setOpen(true)}>+ {label}</Button>;

  return (
    <Card className="w-full p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Plan a new trip</h2>
      <TripForm
        submitLabel="Create trip"
        onSubmit={createTripAction}
        onCancel={() => setOpen(false)}
        onDone={(data) => {
          setOpen(false);
          if (data?.id) router.push(`/trips/${data.id}/categories`);
        }}
      />
    </Card>
  );
}
