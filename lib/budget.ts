import type { Category, Expense, Trip } from "@/lib/data/types";

export type CategorySummary = Category & {
  spent: number;
  remaining: number;
  over: boolean;
  /** spent / allocated, 0..∞ (0 when nothing allocated and nothing spent) */
  ratio: number;
  expenses: Expense[];
};

export type TripSummary = {
  budget: number;
  allocated: number;
  spent: number;
  /** budget − allocated: money not yet assigned to a category */
  unallocated: number;
  /** budget − spent: money left after all planned expenses */
  remaining: number;
  overAllocated: boolean;
  overBudget: boolean;
  categories: CategorySummary[];
  uncategorized: Expense[];
  uncategorizedSpent: number;
  overspentCount: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** All spend math is derived here from server rows — nothing derived is stored. */
export function summarizeTrip(trip: Trip, categories: Category[], expenses: Expense[]): TripSummary {
  const ids = new Set(categories.map((c) => c.id));
  const byCat = new Map<string, Expense[]>();
  const uncategorized: Expense[] = [];
  for (const e of expenses) {
    if (e.category_id && ids.has(e.category_id)) {
      const list = byCat.get(e.category_id) ?? [];
      list.push(e);
      byCat.set(e.category_id, list);
    } else {
      uncategorized.push(e);
    }
  }

  const cats: CategorySummary[] = categories.map((c) => {
    const list = byCat.get(c.id) ?? [];
    const spent = round(list.reduce((s, e) => s + e.amount, 0));
    const remaining = round(c.allocated_amount - spent);
    return {
      ...c,
      spent,
      remaining,
      over: remaining < 0,
      ratio: c.allocated_amount > 0 ? spent / c.allocated_amount : spent > 0 ? Infinity : 0,
      expenses: list,
    };
  });

  const allocated = round(cats.reduce((s, c) => s + c.allocated_amount, 0));
  const uncategorizedSpent = round(uncategorized.reduce((s, e) => s + e.amount, 0));
  const spent = round(cats.reduce((s, c) => s + c.spent, 0) + uncategorizedSpent);

  return {
    budget: trip.total_budget,
    allocated,
    spent,
    unallocated: round(trip.total_budget - allocated),
    remaining: round(trip.total_budget - spent),
    overAllocated: allocated > trip.total_budget,
    overBudget: spent > trip.total_budget,
    categories: cats,
    uncategorized,
    uncategorizedSpent,
    overspentCount: cats.filter((c) => c.over).length,
  };
}
