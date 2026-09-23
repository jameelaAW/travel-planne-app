import "server-only";
import type { RateTable } from "./types";

/**
 * Monetary Authority of Singapore — "Exchange Rates - End of Period, Daily" (Monthly Statistical
 * Bulletin) via the MAS API gateway. Requires a free API key from https://eservices.mas.gov.sg/apimg-portal/
 * sent as the `KeyId` header. Rows look like { end_of_day: "2026-09-22", usd_sgd: "1.2893",
 * jpy_sgd_100: "0.8712", ... }: SGD per 1 unit, or per 100 units for `_100` fields.
 */
const MAS_DAILY_URL =
  "https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily";

export function masConfigured() {
  return !!process.env.MAS_API_KEY;
}

export async function getMasRates(): Promise<RateTable> {
  const key = process.env.MAS_API_KEY;
  if (!key) throw new Error("MAS rates need a MAS_API_KEY (free from the MAS API portal)");
  const res = await fetch(MAS_DAILY_URL, { headers: { KeyId: key, Accept: "application/json" }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`MAS rates unavailable (HTTP ${res.status})`);
  return parseMasJson(await res.json());
}

type MasRow = Record<string, string | number | null>;

export function parseMasJson(body: unknown): RateTable {
  const b = body as { elements?: MasRow[]; result?: { records?: MasRow[] } };
  const rows = b.elements ?? b.result?.records ?? [];
  // Latest day that actually carries rates.
  const latest = rows
    .filter((r) => typeof r.end_of_day === "string")
    .sort((a, b) => String(b.end_of_day).localeCompare(String(a.end_of_day)))
    .find((r) => Object.keys(r).some((k) => /_sgd(_100)?$/.test(k) && r[k] != null && r[k] !== ""));
  if (!latest) throw new Error("MAS rates response was not in the expected format");

  // Normalise to "units of currency per 1 SGD" so cross rates work like the ECB table (base = SGD).
  const rates: Record<string, number> = { SGD: 1 };
  for (const [k, v] of Object.entries(latest)) {
    const m = k.match(/^([a-z]{3})_sgd(_100)?$/);
    const sgdPer = Number(v);
    if (!m || !Number.isFinite(sgdPer) || sgdPer <= 0) continue;
    const perUnit = m[2] ? sgdPer / 100 : sgdPer;
    rates[m[1].toUpperCase()] = 1 / perUnit;
  }
  if (Object.keys(rates).length < 5) throw new Error("MAS rates response had too few currencies");
  return { source: "MAS", base: "SGD", date: String(latest.end_of_day), rates };
}
