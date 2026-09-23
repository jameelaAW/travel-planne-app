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

/** Standard result returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
