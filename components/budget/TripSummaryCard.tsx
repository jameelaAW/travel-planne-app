import type { TripSummary } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/primitives";
import { BudgetBar } from "./BudgetBar";

function Stat({ label, value, tone = "default", hint }: { label: string; value: string; tone?: "default" | "good" | "bad"; hint?: string }) {
  const color = tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-700" : "text-slate-900";
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className={`text-xl font-semibold tabular-nums ${color}`}>{value}</dd>
      {hint && <dd className="text-xs text-slate-500">{hint}</dd>}
    </div>
  );
}

const signed = (n: number, c: string) => (n < 0 ? `−${formatMoney(Math.abs(n), c)}` : formatMoney(n, c));

export function TripSummaryCard({ summary, currency }: { summary: TripSummary; currency: string }) {
  const s = summary;
  return (
    <Card className="space-y-4 p-5">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total budget" value={formatMoney(s.budget, currency)} />
        <Stat
          label="Allocated"
          value={formatMoney(s.allocated, currency)}
          tone={s.overAllocated ? "bad" : "default"}
          hint={s.overAllocated ? `${formatMoney(-s.unallocated, currency)} more than budget` : `${formatMoney(s.unallocated, currency)} left to allocate`}
        />
        <Stat label="Planned spend" value={formatMoney(s.spent, currency)} tone={s.overBudget ? "bad" : "default"} />
        <Stat
          label="Remaining"
          value={signed(s.remaining, currency)}
          tone={s.remaining < 0 ? "bad" : "good"}
          hint={s.remaining < 0 ? "Over total budget" : "Budget minus planned spend"}
        />
      </dl>
      <div className="space-y-1">
        <BudgetBar spent={s.spent} limit={s.budget} currency={currency} label="Total planned spend vs total budget" />
        <p className="text-xs text-slate-500 tabular-nums">
          {formatMoney(s.spent, currency)} planned of {formatMoney(s.budget, currency)} total budget
          {s.overspentCount > 0 && (
            <span className="ml-2 font-medium text-red-600">
              · {s.overspentCount} {s.overspentCount === 1 ? "category" : "categories"} over allocation
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
