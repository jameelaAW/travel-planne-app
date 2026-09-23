export type Trip = {
  id: string;
  user_id: string | null;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: number;
  currency: string;
  status: string;
  ai_suggested_allocation: unknown | null;
  ai_source: string | null;
  ai_confidence: number | null;
  ai_review_status: string | null;
  created_at: string;
};

export type TripInput = {
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: number;
  currency: string;
};

export const CATEGORY_TYPES = ["air", "land_travel", "local_travel", "food", "lodging", "shopping"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const DEFAULT_CATEGORY_NAMES: Record<CategoryType, string> = {
  air: "Air Tickets",
  land_travel: "Land Travel",
  local_travel: "Local Travel",
  food: "Food",
  lodging: "Lodging",
  shopping: "Shopping",
};

export type Category = {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  category_type: string;
  allocated_amount: number;
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  category_id: string | null;
  user_id: string | null;
  title: string;
  amount: number;
  is_estimated: boolean;
  notes: string | null;
  ai_categorized: string | null;
  ai_source: string | null;
  ai_confidence: number | null;
  ai_review_status: string | null;
  created_at: string;
  /** Present once migration 0002 is applied: what the user entered before ECB conversion. */
  original_amount?: number | null;
  original_currency?: string | null;
  fx_rate?: number | null;
  fx_rate_date?: string | null;
  fx_source?: string | null;
};

export type FxDetails = {
  original_amount: number;
  original_currency: string;
  fx_rate: number;
  fx_rate_date: string;
  fx_source: "ECB";
};

export type ExpenseInput = {
  title: string;
  /** Always in the trip currency. */
  amount: number;
  category_id: string | null;
  is_estimated: boolean;
  notes: string | null;
  /** Set when the expense was entered in another currency and converted at the ECB rate. */
  fx?: FxDetails | null;
};

/** Standard result returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
