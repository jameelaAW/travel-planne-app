import type { CategorySummary, TripSummary } from "@/lib/budget";

export type FitScore = { score: number; tone: "green" | "yellow" | "red"; label: string };

/** Budget Fit Score = 100 − (overspent_categories / total_categories × 100). Rule-based (docs/INTELLIGENCE_LAYER.md). */
export function budgetFitScore(s: TripSummary): FitScore {
  const total = s.categories.length;
  let score = total === 0 ? 100 : Math.round(100 - (s.overspentCount / total) * 100);
  // Spending past the whole trip budget can't be a "good fit" regardless of category balance.
  if (s.overBudget) score = Math.min(score, 59);
  const tone = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
  const label = tone === "green" ? "Plan fits the budget" : tone === "yellow" ? "Some categories over" : "Plan is over budget";
  return { score, tone, label };
}

/** Std-dev of category allocation percentages; lower = more balanced. */
export function allocationBalance(s: TripSummary): number | null {
  if (s.categories.length === 0 || s.allocated <= 0) return null;
  const pcts = s.categories.map((c) => (c.allocated_amount / s.allocated) * 100);
  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  return Math.sqrt(pcts.reduce((a, p) => a + (p - mean) ** 2, 0) / pcts.length);
}

/** Most over-budget first (by amount over), then closest to their limit (by spend ratio). */
export function rankCategories(cats: CategorySummary[]): CategorySummary[] {
  const overBy = (c: CategorySummary) => Math.min(c.remaining, 0);
  return [...cats].sort((a, b) => overBy(a) - overBy(b) || b.ratio - a.ratio);
}
