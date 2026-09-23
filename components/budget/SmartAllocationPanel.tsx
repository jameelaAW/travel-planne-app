"use client";

import { useState } from "react";
import type { AllocationPlan } from "@/lib/ai/allocation";
import { applySuggestedAllocationsAction, dismissSuggestionAction, suggestAllocationAction } from "@/lib/actions/ai-actions";
import { DEFAULT_CATEGORY_NAMES } from "@/lib/data/types";
import { formatMoney } from "@/lib/format";
import { Button, Card, ErrorBanner } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

const LOW_CONFIDENCE = 0.5;

export function SmartAllocationPanel({
  tripId,
  currency,
  plan,
  status,
  current,
}: {
  tripId: string;
  currency: string;
  plan: AllocationPlan | null;
  status: string | null;
  /** current allocation by category_type */
  current: Record<string, number>;
}) {
  const pending = plan && status === "pending";
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(plan?.description ?? "");
  const { pending: busy, error, run } = useAction();

  if (!pending && !open)
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-medium">Not sure how to split your budget?</p>
          <p className="text-sm text-slate-500">
            {status === "applied" ? "Suggestion applied. You can still edit any amount below." : "Get a suggested allocation you can review before anything changes."}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          ✨ Suggest allocation
        </Button>
      </Card>
    );

  if (!pending)
    return (
      <Card className="space-y-3 p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Describe the trip (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Going to Tokyo for a week, staying in hostels, want to do some shopping"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-teal-600"
          />
        </label>
        <ErrorBanner message={error} />
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => run(() => suggestAllocationAction(tripId, description), () => setOpen(false))}>
            {busy ? "Thinking…" : "Suggest allocation"}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
        </div>
      </Card>
    );

  const lowCount = plan.allocations.filter((a) => a.confidence < LOW_CONFIDENCE).length;
  return (
    <Card className="space-y-3 border-teal-300 p-4 ring-1 ring-teal-100">
      <section aria-label="Suggested allocation" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Suggested allocation</h2>
          <span className="text-xs text-slate-500">{plan.source === "claude" ? "Suggested by Claude" : "Rule-based suggestion"} · nothing changes until you apply</span>
        </div>
        <p className="text-sm text-slate-600">{plan.rationale}</p>
        {lowCount > 0 && (
          <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {lowCount} {lowCount === 1 ? "amount has" : "amounts have"} low confidence. Check {lowCount === 1 ? "it" : "them"} before applying.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1 font-medium">Category</th>
                <th className="py-1 text-right font-medium">Current</th>
                <th className="py-1 text-right font-medium">Suggested</th>
                <th className="py-1 pl-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.allocations.map((a) => {
                const low = a.confidence < LOW_CONFIDENCE;
                return (
                  <tr key={a.category_type}>
                    <td className="py-1.5">{DEFAULT_CATEGORY_NAMES[a.category_type]}</td>
                    <td className="py-1.5 text-right text-slate-500 tabular-nums">{formatMoney(current[a.category_type] ?? 0, currency)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{formatMoney(a.allocated_amount, currency)}</td>
                    <td className="py-1.5 pl-3">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${low ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
                        {Math.round(a.confidence * 100)}%{low ? " · review" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ErrorBanner message={error} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => run(() => applySuggestedAllocationsAction(tripId))}>
            {busy ? "Working…" : "Apply suggestions"}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => run(() => dismissSuggestionAction(tripId))}>
            Dismiss
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => run(() => dismissSuggestionAction(tripId), () => setOpen(true))}>
            Try again
          </Button>
        </div>
      </section>
    </Card>
  );
}
