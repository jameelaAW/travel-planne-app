"use client";

import { createContext, useContext, type ReactNode } from "react";
import { setRateSourceAction } from "@/lib/actions/fx-actions";
import { RATE_SOURCES, type RateSource, type RateTable } from "@/lib/fx/types";
import { useAction } from "@/components/ui/use-action";

type Tables = Record<RateSource, RateTable | { error: string }>;
type Ctx = { tables: Tables; preferred: RateSource };

const FxContext = createContext<Ctx | null>(null);

export function FxProvider({ tables, preferred, children }: Ctx & { children: ReactNode }) {
  return <FxContext.Provider value={{ tables, preferred }}>{children}</FxContext.Provider>;
}

const isTable = (t: RateTable | { error: string } | undefined): t is RateTable => !!t && "rates" in t;

/** Rate tables for previews. The server recomputes every conversion; this is display-only. */
export function useFx() {
  const ctx = useContext(FxContext);
  const tables = ctx?.tables;
  const preferred = ctx?.preferred ?? "ECB";
  const table = (s: RateSource) => (isTable(tables?.[s]) ? (tables![s] as RateTable) : null);
  const unavailableReason = (s: RateSource) => (tables && !isTable(tables[s]) ? (tables[s] as { error: string }).error : null);
  const codes = [...new Set(RATE_SOURCES.flatMap((s) => Object.keys(table(s)?.rates ?? {})))].sort();

  function preview(amount: number, from: string, to: string, source: RateSource) {
    const t = table(source);
    if (!t || from === to) return null;
    const f = t.rates[from];
    const r = t.rates[to];
    if (!f || !r) return null;
    const rate = r / f;
    return { amount: Math.round(amount * rate * 100) / 100, rate, date: t.date, source };
  }
  return { preferred, table, unavailableReason, codes, preview };
}

export function CurrencySelect({
  name,
  value,
  onChange,
  label,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { codes } = useFx();
  const current = value.toUpperCase();
  if (codes.length === 0)
    return (
      <input
        name={name}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={3}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase shadow-sm"
      />
    );
  const options = codes.includes(current) ? codes : [current, ...codes];
  return (
    <select
      name={name}
      aria-label={label}
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:outline-2 focus:outline-teal-600"
    >
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

/** Per-form choice of which exchange rates to apply. */
export function RateSourceSelect({
  value,
  onChange,
  from,
  to,
}: {
  value: RateSource;
  onChange: (s: RateSource) => void;
  from: string;
  to: string;
}) {
  const { table, unavailableReason } = useFx();
  return (
    <select
      name="rate_source"
      aria-label="Exchange rates to apply"
      value={value}
      onChange={(e) => onChange(e.target.value as RateSource)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
    >
      {RATE_SOURCES.map((s) => {
        const t = table(s);
        const missing = t && (!t.rates[from] || !t.rates[to]);
        const disabled = !t || !!missing;
        const note = !t ? ` (unavailable${unavailableReason(s)?.includes("KEY") ? ": needs API key" : ""})` : missing ? ` (no ${!t.rates[from] ? from : to} rate)` : "";
        return (
          <option key={s} value={s} disabled={disabled}>
            {s} rates{note}
          </option>
        );
      })}
    </select>
  );
}

/** Sidebar setting: the viewer's default rate source, remembered in a cookie. */
export function RateSourcePicker() {
  const { preferred, table } = useFx();
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1 border-t border-slate-200 px-5 py-4">
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Exchange rates</p>
      <div role="radiogroup" aria-label="Default exchange rates" className="flex gap-1">
        {RATE_SOURCES.map((s) => {
          const available = !!table(s);
          const active = preferred === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending || !available}
              title={available ? `Use ${s} rates by default (${table(s)!.date})` : `${s} rates unavailable`}
              onClick={() => !active && run(() => setRateSourceAction(s))}
              className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        {table(preferred) ? `${preferred} rates of ${table(preferred)!.date}` : "No rates available"}
        {!table("MAS") && " · MAS needs an API key"}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
