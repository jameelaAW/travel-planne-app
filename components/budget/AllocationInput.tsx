"use client";

import { useEffect, useState } from "react";
import { setAllocationAction } from "@/lib/actions/category-actions";
import { parseAmount } from "@/lib/format";
import { useAction } from "@/components/ui/use-action";

/** Inline-editable allocation. Saves on Enter or blur; Escape reverts. */
export function AllocationInput({
  tripId,
  categoryId,
  categoryName,
  value,
  currency,
}: {
  tripId: string;
  categoryId: string;
  categoryName: string;
  value: number;
  currency: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const { pending, error, run, setError } = useAction();
  useEffect(() => setDraft(String(value)), [value]);

  const parsed = parseAmount(draft);
  const invalid = parsed === null || parsed < 0;
  const dirty = !invalid && parsed !== value;

  function save() {
    if (invalid) return setError("Allocation must be a positive number.");
    if (!dirty) return;
    run(() => setAllocationAction(tripId, categoryId, draft));
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span>Allocated</span>
        <span className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">{currency}</span>
          <input
            aria-label={`Allocation for ${categoryName}`}
            aria-invalid={invalid || undefined}
            inputMode="decimal"
            value={draft}
            disabled={pending}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") setDraft(String(value));
            }}
            className={`w-32 rounded-md border py-1 pr-2 pl-11 text-right text-sm font-semibold tabular-nums focus:outline-2 focus:outline-teal-600 ${invalid ? "border-red-500" : "border-slate-300"} ${pending ? "opacity-60" : ""}`}
          />
        </span>
        {pending && <span className="text-xs text-slate-400">Saving…</span>}
      </label>
      {(error || invalid) && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error ?? "Allocation must be a positive number."}
        </p>
      )}
    </div>
  );
}
