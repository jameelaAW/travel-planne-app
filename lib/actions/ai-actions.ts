"use server";

import { revalidatePath } from "next/cache";
import { readStoredPlan, suggestAllocation } from "@/lib/ai/allocation";
import { createCategory, listCategories, updateCategory } from "@/lib/data/categories";
import { getTrip, updateTripAi } from "@/lib/data/trips";
import { DEFAULT_CATEGORY_NAMES, type ActionResult } from "@/lib/data/types";

/** suggest_allocation(trip_id): drafts a plan and stores it for review. Writes no allocations. */
export async function suggestAllocationAction(tripId: string, description: string): Promise<ActionResult> {
  try {
    const trip = await getTrip(tripId);
    if (!trip) return { ok: false, error: "Trip not found." };
    if (trip.total_budget <= 0) return { ok: false, error: "Set a total budget above $0 first." };
    const plan = await suggestAllocation(trip, description.trim().slice(0, 1000));
    await updateTripAi(tripId, {
      ai_suggested_allocation: plan,
      ai_source: plan.source === "claude" ? "claude-opus-5" : "rules-v1",
      ai_confidence: plan.confidence,
      ai_review_status: "pending",
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not suggest an allocation: ${(e as Error).message}` };
  }
}

/** apply_suggested_allocations(trip_id, plan): runs only after the user clicks Apply. */
export async function applySuggestedAllocationsAction(tripId: string): Promise<ActionResult> {
  try {
    const trip = await getTrip(tripId);
    const plan = readStoredPlan(trip?.ai_suggested_allocation);
    if (!trip || !plan || trip.ai_review_status !== "pending") return { ok: false, error: "No pending suggestion to apply." };
    const categories = await listCategories(tripId);
    for (const item of plan.allocations) {
      const existing = categories.find((c) => c.category_type === item.category_type);
      if (existing) await updateCategory(existing.id, { allocated_amount: item.allocated_amount });
      else await createCategory(tripId, DEFAULT_CATEGORY_NAMES[item.category_type], item.category_type, item.allocated_amount);
    }
    await updateTripAi(tripId, { ai_review_status: "applied" });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not apply the suggestion: ${(e as Error).message}` };
  }
}

export async function dismissSuggestionAction(tripId: string): Promise<ActionResult> {
  try {
    await updateTripAi(tripId, { ai_review_status: "dismissed" });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not dismiss: ${(e as Error).message}` };
  }
}
