import { formatMoney } from "@/lib/format";

/** Horizontal bar: spent vs a limit. Turns red past 100%, amber past 90%. */
export function BudgetBar({
  spent,
  limit,
  currency,
  label,
  size = "md",
}: {
  spent: number;
  limit: number;
  currency: string;
  label: string;
  size?: "sm" | "md";
}) {
  const ratio = limit > 0 ? spent / limit : spent > 0 ? Infinity : 0;
  const pct = Math.min(ratio, 1) * 100;
  const color = ratio > 1 ? "bg-red-500" : ratio >= 0.9 ? "bg-amber-500" : "bg-teal-600";
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={spent}
      aria-valuetext={`${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}`}
      className={`w-full overflow-hidden rounded-full bg-slate-200 ${size === "sm" ? "h-2" : "h-3"}`}
    >
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** "$50 remaining" in green, or "$50 over" in red. */
export function RemainingText({ remaining, currency, className = "" }: { remaining: number; currency: string; className?: string }) {
  const over = remaining < 0;
  return (
    <span className={`font-semibold tabular-nums ${over ? "text-red-600" : "text-emerald-700"} ${className}`}>
      {over ? `−${formatMoney(Math.abs(remaining), currency)} over` : `${formatMoney(remaining, currency)} remaining`}
    </span>
  );
}
