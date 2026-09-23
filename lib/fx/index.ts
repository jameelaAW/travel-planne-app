import "server-only";
import { cookies } from "next/headers";
import { getEcbRates } from "./ecb";
import { getMasRates, masConfigured } from "./mas";
import { isRateSource, type RateSource, type RateTable } from "./types";

export type Conversion = { amount: number; rate: number; date: string; source: RateSource };
export const RATE_SOURCE_COOKIE = "fx_source";

export async function getRates(source: RateSource): Promise<RateTable> {
  return source === "MAS" ? getMasRates() : getEcbRates();
}

export function crossRate(table: RateTable, from: string, to: string): number {
  const f = table.rates[from.toUpperCase()];
  const t = table.rates[to.toUpperCase()];
  if (!f || !t) throw new Error(`${table.source} does not publish a rate for ${!f ? from : to}`);
  return t / f;
}

export function convert(table: RateTable, amount: number, from: string, to: string): Conversion {
  const rate = from.toUpperCase() === to.toUpperCase() ? 1 : crossRate(table, from, to);
  return { amount: Math.round(amount * rate * 100) / 100, rate, date: table.date, source: table.source };
}

/** The viewer's chosen default rate source (cookie), ECB when unset or when MAS isn't configured. */
export async function preferredSource(): Promise<RateSource> {
  const v = (await cookies()).get(RATE_SOURCE_COOKIE)?.value;
  if (v === "MAS" && !masConfigured()) return "ECB";
  return isRateSource(v) ? v : "ECB";
}

/** Every source's latest table for previews; a source that can't be reached maps to its error. */
export async function allRateTables(): Promise<Record<RateSource, RateTable | { error: string }>> {
  const settle = async (s: RateSource) => {
    try {
      return await getRates(s);
    } catch (e) {
      return { error: (e as Error).message };
    }
  };
  const [ECB, MAS] = await Promise.all([settle("ECB"), settle("MAS")]);
  return { ECB, MAS };
}
