import "server-only";

/**
 * European Central Bank euro foreign exchange reference rates — the app's single source for
 * currency conversion. Rates are quoted as units of currency per 1 EUR, published once per
 * working day (~16:00 CET). Cross rates go through EUR: A→B = rate[B] / rate[A].
 */
const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export type EcbRates = { date: string; rates: Record<string, number> };
export type Conversion = { amount: number; rate: number; date: string };

export async function getEcbRates(): Promise<EcbRates> {
  const res = await fetch(ECB_DAILY_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ECB rates unavailable (HTTP ${res.status})`);
  return parseEcbXml(await res.text());
}

export function parseEcbXml(xml: string): EcbRates {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rates: Record<string, number> = { EUR: 1 };
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[m[1]] = Number(m[2]);
  if (!date || Object.keys(rates).length < 10) throw new Error("ECB rates response was not in the expected format");
  return { date, rates };
}

/** Rate to multiply an amount in `from` by to get `to`. */
export function crossRate(table: EcbRates, from: string, to: string): number {
  const f = table.rates[from.toUpperCase()];
  const t = table.rates[to.toUpperCase()];
  if (!f || !t) throw new Error(`ECB does not publish a reference rate for ${!f ? from : to}`);
  return t / f;
}

export function convert(table: EcbRates, amount: number, from: string, to: string): Conversion {
  const rate = from.toUpperCase() === to.toUpperCase() ? 1 : crossRate(table, from, to);
  return { amount: Math.round(amount * rate * 100) / 100, rate, date: table.date };
}

/** Currency codes selectable in the app (ECB-published + EUR), falling back to the trip's own when ECB is unreachable. */
export async function supportedCurrencies(): Promise<{ codes: string[]; rates: EcbRates | null }> {
  try {
    const rates = await getEcbRates();
    return { codes: Object.keys(rates.rates).sort(), rates };
  } catch {
    return { codes: [], rates: null };
  }
}
