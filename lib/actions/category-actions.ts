"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  createDefaultCategories,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/data/categories";
import type { ActionResult } from "@/lib/data/types";
import { parseAmount } from "@/lib/format";

const fail = (verb: string, e: unknown): ActionResult => ({
  ok: false,
  error: `Could not ${verb}: ${(e as Error).message}`,
});

export async function setAllocationAction(tripId: string, categoryId: string, raw: string): Promise<ActionResult> {
  const amount = parseAmount(raw);
  if (amount === null || amount < 0)
    return { ok: false, error: "Allocation must be a positive number.", fieldErrors: { allocated_amount: "Allocation must be a positive number." } };
  try {
    await updateCategory(categoryId, { allocated_amount: amount });
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return fail("save the allocation", e);
  }
}

export async function renameCategoryAction(tripId: string, categoryId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required.", fieldErrors: { name: "Name is required." } };
  try {
    await updateCategory(categoryId, { name: trimmed });
    revalidatePath(`/trips/${tripId}`, "layout");
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
    await createCategory(tripId, name, categoryType, allocated!);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return fail("add the category", e);
  }
}

/** Expenses in the deleted category are kept and become "Uncategorized" (FK on delete set null). */
export async function deleteCategoryAction(tripId: string, categoryId: string): Promise<ActionResult> {
  try {
    await deleteCategory(categoryId);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return fail("delete the category", e);
  }
}

/** For trips that ended up with no categories (e.g. all deleted): restore the 6 defaults. */
export async function restoreDefaultCategoriesAction(tripId: string): Promise<ActionResult> {
  try {
    const existing = await listCategories(tripId);
    if (existing.length === 0) await createDefaultCategories(tripId);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return fail("create the default categories", e);
  }
}
