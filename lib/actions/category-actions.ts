"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/data/audit";
import {
  createCategory,
  createDefaultCategories,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/lib/data/categories";
import { getTrip } from "@/lib/data/trips";
import type { ActionResult } from "@/lib/data/types";
import { parseAmount } from "@/lib/format";

const fail = (verb: string, e: unknown): ActionResult => ({
  ok: false,
  error: `Could not ${verb}: ${(e as Error).message}`,
});
const NOT_FOUND: ActionResult = { ok: false, error: "Trip not found." };

export async function setAllocationAction(tripId: string, categoryId: string, raw: string): Promise<ActionResult> {
  const amount = parseAmount(raw);
  if (amount === null || amount < 0)
    return { ok: false, error: "Allocation must be a positive number.", fieldErrors: { allocated_amount: "Allocation must be a positive number." } };
  try {
    if (!(await getTrip(tripId))) return NOT_FOUND;
    const before = await getCategory(tripId, categoryId);
    if (!before) return { ok: false, error: "Category not found." };
    await updateCategory(tripId, categoryId, { allocated_amount: amount });
    await logAudit({ action_type: "update", entity_type: "category", entity_id: categoryId, before_state: { allocated_amount: before.allocated_amount }, after_state: { allocated_amount: amount } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail("save the allocation", e);
  }
}

export async function renameCategoryAction(tripId: string, categoryId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required.", fieldErrors: { name: "Name is required." } };
  try {
    if (!(await getTrip(tripId))) return NOT_FOUND;
    const before = await getCategory(tripId, categoryId);
    if (!before) return { ok: false, error: "Category not found." };
    await updateCategory(tripId, categoryId, { name: trimmed });
    await logAudit({ action_type: "update", entity_type: "category", entity_id: categoryId, before_state: { name: before.name }, after_state: { name: trimmed } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail("rename the category", e);
  }
}

export async function addCategoryAction(tripId: string, form: FormData): Promise<ActionResult> {
  const name = String(form.get("name") ?? "").trim();
  const categoryType = String(form.get("category_type") ?? "").trim() || "other";
  const allocated = parseAmount(form.get("allocated_amount") || "0");
  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (allocated === null || allocated < 0) fieldErrors.allocated_amount = "Allocation must be a positive number.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  try {
    if (!(await getTrip(tripId))) return NOT_FOUND;
    const created = await createCategory(tripId, name, categoryType, allocated!);
    await logAudit({ action_type: "create", entity_type: "category", entity_id: created.id, after_state: created });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail("add the category", e);
  }
}

/** Expenses in the deleted category are kept and become "Uncategorized" (FK on delete set null). */
export async function deleteCategoryAction(tripId: string, categoryId: string): Promise<ActionResult> {
  try {
    if (!(await getTrip(tripId))) return NOT_FOUND;
    const before = await getCategory(tripId, categoryId);
    if (!before) return { ok: false, error: "Category not found." };
    await deleteCategory(tripId, categoryId);
    await logAudit({ action_type: "delete", entity_type: "category", entity_id: categoryId, before_state: before });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail("delete the category", e);
  }
}

/** For trips that ended up with no categories (e.g. all deleted): restore the 6 defaults. */
export async function restoreDefaultCategoriesAction(tripId: string): Promise<ActionResult> {
  try {
    if (!(await getTrip(tripId))) return NOT_FOUND;
    const existing = await listCategories(tripId);
    if (existing.length === 0) {
      await createDefaultCategories(tripId);
      await logAudit({ action_type: "create", entity_type: "category", entity_id: null, after_state: { trip_id: tripId, defaults: 6 } });
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail("create the default categories", e);
  }
}
