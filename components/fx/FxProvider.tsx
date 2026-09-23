"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EcbRates } from "@/lib/fx/ecb";

const FxContext = createContext<EcbRates | null>(null);

export function FxProvider({ rates, children }: { rates: EcbRates | null; children: ReactNode }) {
  return <FxContext.Provider value={rates}>{children}</FxContext.Provider>;
}

/** ECB reference rates for previews. The server recomputes every conversion; this is display-only. */
export function useFx() {
  const table = useContext(FxContext);
  const codes = table ? Object.keys(table.rates).sort() : [];
  function preview(amount: number, from: string, to: string) {
    if (!table || from === to) return null;
    const f = table.rates[from];
    const t = table.rates[to];
    if (!f || !t) return null;
    const rate = t / f;
    return { amount: Math.round(amount * rate * 100) / 100, rate, date: table.date };
  }
  return { table, codes, preview };
}

export function CurrencySelect({
  name,
  value,
  defaultValue,
  onChange,
  label,
  className = "",
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  label: string;
  className?: string;
}) {
  const { codes } = useFx();
  const current = (value ?? defaultValue ?? "USD").toUpperCase();
  const options = codes.includes(current) || codes.length === 0 ? codes : [current, ...codes];
  if (options.length === 0)
    return (
      <input
        name={name}
        aria-label={label}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value.toUpperCase())}
        maxLength={3}
        className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase shadow-sm ${className}`}
      />
    );
  return (
    <select
      name={name}
      aria-label={label}
      value={value}
      defaultValue={value === undefined ? current : undefined}
      onChange={(e) => onChange?.(e.target.value)}
      className={`block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm shadow-sm focus:outline-2 focus:outline-teal-600 ${className}`}
    >
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
