import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { CATEGORY_TYPES, type CategoryType, type Trip } from "@/lib/data/types";

export const LOW_CONFIDENCE = 0.5;

export type AllocationItem = { category_type: CategoryType; allocated_amount: number; confidence: number };
export type AllocationPlan = {
  allocations: AllocationItem[];
  rationale: string;
  source: "claude" | "rules";
  confidence: number;
  generated_at: string;
  description?: string;
};

const PlanSchema = z.object({
  allocations: z.array(
    z.object({
      category_type: z.enum(CATEGORY_TYPES),
      allocated_amount: z.number(),
      confidence: z.number(),
    }),
  ),
  rationale: z.string(),
});

/** Trip length in days from dates, else from free text ("a week", "7 days", "weekend"). */
export function tripDays(trip: Pick<Trip, "start_date" | "end_date" | "title">, description = ""): number | null {
  if (trip.start_date && trip.end_date) {
    const d = (Date.parse(trip.end_date) - Date.parse(trip.start_date)) / 86_400_000;
    if (d >= 0) return Math.max(1, Math.round(d) + 1);
  }
  const text = `${trip.title} ${description}`.toLowerCase();
  const n = text.match(/(\d+)\s*(?:-|\s)?(day|night)/);
  if (n) return Number(n[1]);
  const w = text.match(/(\d+)\s*weeks?/);
  if (w) return Number(w[1]) * 7;
  if (/\ba week\b|\bone week\b/.test(text)) return 7;
  if (/weekend/.test(text)) return 3;
  return null;
}

/** Split `total` by weights, rounded to whole units, remainder on the largest share so it sums exactly. */
function splitBudget(total: number, weights: Record<CategoryType, number>) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const out = CATEGORY_TYPES.map((t) => ({ t, v: Math.floor((total * weights[t]) / sum) }));
  const diff = Math.round((total - out.reduce((a, b) => a + b.v, 0)) * 100) / 100;
  out.sort((a, b) => weights[b.t] - weights[a.t])[0].v += diff;
  return new Map(out.map((o) => [o.t, o.v]));
}

/** Deterministic planner used when no AI key is configured, or AI output is invalid. */
export function ruleBasedPlan(trip: Trip, description = ""): AllocationPlan {
  const days = tripDays(trip, description);
  const text = `${trip.destination} ${description}`.toLowerCase();
  // Baseline shares for a ~1 week international trip.
  const w: Record<CategoryType, number> = { air: 32, lodging: 25, food: 17, local_travel: 6, land_travel: 7, shopping: 13 };
  if (days !== null && days <= 3) Object.assign(w, { air: 40, lodging: 22, food: 14, shopping: 10 });
  if (days !== null && days >= 14) Object.assign(w, { air: 22, lodging: 32, food: 22, local_travel: 7 });
  if (/road ?trip|drive|train|rail|domestic/.test(text)) Object.assign(w, { air: 10, land_travel: 22 });
  if (/shopping|souvenir/.test(text)) w.shopping += 6;
  if (/hostel|backpack|budget/.test(text)) w.lodging -= 7;
  const amounts = splitBudget(trip.total_budget, w);
  // Rules are a sensible starting point, not a forecast: moderate confidence, lower for discretionary spend.
  const conf: Record<CategoryType, number> = { air: 0.6, lodging: 0.6, food: 0.55, local_travel: 0.45, land_travel: 0.4, shopping: 0.35 };
  const allocations = CATEGORY_TYPES.map((t) => ({ category_type: t, allocated_amount: amounts.get(t)!, confidence: conf[t] }));
  return {
    allocations,
    rationale: `Typical split for a ${days ? `${days}-day` : "trip of unknown length"} trip; shopping and ground transport vary most, so review those.`,
    source: "rules",
    confidence: 0.5,
    generated_at: new Date().toISOString(),
    description: description || undefined,
  };
}

/** Reject plans that don't cover all 6 categories once, or don't add up to the budget. */
function validate(plan: z.infer<typeof PlanSchema>, budget: number): string | null {
  const types = plan.allocations.map((a) => a.category_type);
  if (types.length !== CATEGORY_TYPES.length || new Set(types).size !== types.length) return "must include each category exactly once";
  if (plan.allocations.some((a) => a.allocated_amount < 0 || a.confidence < 0 || a.confidence > 1)) return "amounts must be ≥ 0 and confidence 0–1";
  const sum = plan.allocations.reduce((s, a) => s + a.allocated_amount, 0);
  if (Math.abs(sum - budget) > Math.max(1, budget * 0.01)) return `allocations sum to ${sum}, expected ${budget}`;
  return null;
}

async function claudePlan(trip: Trip, description: string): Promise<AllocationPlan | null> {
  const client = new Anthropic();
  const days = tripDays(trip, description);
  const prompt = [
    `Suggest how to split a travel budget across exactly these categories: ${CATEGORY_TYPES.join(", ")}.`,
    `Trip: "${trip.title}" to ${trip.destination}. ${days ? `${days} days.` : "Length unknown."} Total budget: ${trip.total_budget} ${trip.currency}.`,
    description ? `Traveller's notes: ${description}` : "",
    `Amounts are in ${trip.currency} and must sum to exactly ${trip.total_budget}. Give each a confidence from 0 to 1 reflecting how predictable that cost is for this destination; use a low value when you are guessing. Keep the rationale to one or two sentences.`,
  ].join("\n");

  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(PlanSchema) },
      messages: [{ role: "user", content: prompt + feedback }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return null;
    const problem = validate(response.parsed_output, trip.total_budget);
    if (!problem) {
      const allocations = response.parsed_output.allocations.map((a) => ({ ...a, allocated_amount: Math.round(a.allocated_amount * 100) / 100 }));
      return {
        allocations,
        rationale: response.parsed_output.rationale,
        source: "claude",
        confidence: Math.min(...allocations.map((a) => a.confidence)),
        generated_at: new Date().toISOString(),
        description: description || undefined,
      };
    }
    feedback = `\n\nYour previous answer was invalid: ${problem}. Fix it.`;
  }
  return null;
}

/** suggest_allocation: Claude when ANTHROPIC_API_KEY is set, else (or on failure) the rules planner. */
export async function suggestAllocation(trip: Trip, description = ""): Promise<AllocationPlan> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const plan = await claudePlan(trip, description);
      if (plan) return plan;
    } catch (e) {
      console.error("AI allocation failed, using rules:", (e as Error).message);
    }
  }
  return ruleBasedPlan(trip, description);
}

/** Parse a stored plan from trips.ai_suggested_allocation (untrusted JSON). */
export function readStoredPlan(value: unknown): AllocationPlan | null {
  const parsed = PlanSchema.extend({
    source: z.enum(["claude", "rules"]),
    confidence: z.number(),
    generated_at: z.string(),
    description: z.string().optional(),
  }).safeParse(value);
  return parsed.success ? parsed.data : null;
}
