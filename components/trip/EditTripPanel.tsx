"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateTripAction } from "@/lib/actions/trip-actions";
import type { Trip } from "@/lib/data/types";
import { Button, Card } from "@/components/ui/primitives";
import { TripForm } from "./TripForm";

export function EditTripPanel({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!open)
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit trip
      </Button>
    );
  return (
    <Card className="w-full p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit trip</h2>
      <TripForm
        trip={trip}
        submitLabel="Save changes"
        onSubmit={(form) => updateTripAction(trip.id, form)}
        onCancel={() => setOpen(false)}
        onDone={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </Card>
  );
}
