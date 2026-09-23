export const RATE_SOURCES = ["ECB", "MAS"] as const;
export type RateSource = (typeof RATE_SOURCES)[number];

export const RATE_SOURCE_LABELS: Record<RateSource, string> = {
  ECB: "ECB (European Central Bank, EUR reference rates)",
  MAS: "MAS (Monetary Authority of Singapore, SGD end-of-day rates)",
};

/** `rates[X]` = units of X per 1 unit of `base`. Any cross rate A→B = rates[B] / rates[A]. */
export type RateTable = { source: RateSource; base: string; date: string; rates: Record<string, number> };

export function isRateSource(v: unknown): v is RateSource {
  return RATE_SOURCES.includes(v as RateSource);
}
