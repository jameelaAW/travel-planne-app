"use client";

import { useState } from "react";
import type { ActionResult, Trip } from "@/lib/data/types";
import { parseAmount } from "@/lib/format";
import { Button, ErrorBanner, Field, Input } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

type Props = {
  trip?: Trip;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<ActionResult<{ id: string }>>;
  onDone?: (data?: { id: string }) => void;
  onCancel?: () => void;
};

export function TripForm({ trip, submitLabel, onSubmit, onDone, onCancel }: Props) {
  const { pending, error, fieldErrors, setFieldErrors, run } = useAction();
  const [budget, setBudget] = useState(trip ? String(trip.total_budget) : "");

  const budgetValue = parseAmount(budget);
  const budgetError =
    budget !== "" && (budgetValue === null || budgetValue < 0)
      ? "Budget must be a positive number."
      : fieldErrors.total_budget;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const errs: Record<string, string> = {};
        if (!String(form.get("title") ?? "").trim()) errs.title = "Title is required.";
        if (!String(form.get("destination") ?? "").trim()) errs.destination = "Destination is required.";
        const b = parseAmount(form.get("total_budget"));
        if (b === null || b < 0) errs.total_budget = "Budget must be a positive number.";
        if (Object.keys(errs).length) return setFieldErrors(errs);
        run(() => onSubmit(form), onDone);
      }}
    >
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trip name" error={fieldErrors.title}>
          <Input
            name="title"
            defaultValue={trip?.title}
            placeholder="Tokyo 7 Days"
            invalid={!!fieldErrors.title}
            autoFocus={!trip}
          />
        </Field>
        <Field label="Destination" error={fieldErrors.destination}>
          <Input
            name="destination"
            defaultValue={trip?.destination}
            placeholder="Tokyo, Japan"
            invalid={!!fieldErrors.destination}
          />
        </Field>
        <Field label="Total budget" error={budgetError}>
          <Input
            name="total_budget"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="3500"
            invalid={!!budgetError}
          />
        </Field>
        <Field label="Currency" error={fieldErrors.currency}>
          <Input
            name="currency"
            defaultValue={trip?.currency ?? "USD"}
            maxLength={3}
            className="uppercase"
            invalid={!!fieldErrors.currency}
          />
        </Field>
        <Field label="Start date">
          <Input type="date" name="start_date" defaultValue={trip?.start_date ?? ""} />
        </Field>
        <Field label="End date" error={fieldErrors.end_date}>
          <Input type="date" name="end_date" defaultValue={trip?.end_date ?? ""} invalid={!!fieldErrors.end_date} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !!budgetError}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
