import "server-only";
import type { RateTable } from "./types";

/**
 * European Central Bank euro foreign exchange reference rates: units of currency per 1 EUR,
 * published once per working day (~16:00 CET). No key required.
 */
const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export async function getEcbRates(): Promise<RateTable> {
  const res = await fetch(ECB_DAILY_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ECB rates unavailable (HTTP ${res.status})`);
  return parseEcbXml(await res.text());
}

export function parseEcbXml(xml: string): RateTable {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rates: Record<string, number> = { EUR: 1 };
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[m[1]] = Number(m[2]);
  if (!date || Object.keys(rates).length < 10) throw new Error("ECB rates response was not in the expected format");
  return { source: "ECB", base: "EUR", date, rates };
}
