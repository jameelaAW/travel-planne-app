"use client";

import { useState } from "react";
import { addCategoryAction, restoreDefaultCategoriesAction } from "@/lib/actions/category-actions";
import { CATEGORY_TYPES, DEFAULT_CATEGORY_NAMES } from "@/lib/data/types";
import { Button, ErrorBanner, Field, Input } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export function AddCategory({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const { pending, error, fieldErrors, run } = useAction();

  if (!open)
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add category
      </Button>
    );

  return (
    <form
      noValidate
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        run(() => addCategoryAction(tripId, form), () => setOpen(false));
      }}
    >
      <ErrorBanner message={error} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" error={fieldErrors.name}>
          <Input name="name" placeholder="Activities" autoFocus invalid={!!fieldErrors.name} />
        </Field>
        <Field label="Type">
          <select
            name="category_type"
            defaultValue="other"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-2 focus:outline-teal-600"
          >
            {CATEGORY_TYPES.map((t) => (
              <option key={t} value={t}>
                {DEFAULT_CATEGORY_NAMES[t]}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Allocation" error={fieldErrors.allocated_amount}>
          <Input name="allocated_amount" inputMode="decimal" placeholder="0" invalid={!!fieldErrors.allocated_amount} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add category"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function RestoreDefaultsButton({ tripId }: { tripId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-2">
      <Button onClick={() => run(() => restoreDefaultCategoriesAction(tripId))} disabled={pending}>
        {pending ? "Creating…" : "Create the 6 default categories"}
      </Button>
      <ErrorBanner message={error} />
    </div>
  );
}
