"use server";

import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense, updateExpense } from "@/lib/data/expenses";
import type { ActionResult, ExpenseInput } from "@/lib/data/types";
import { parseAmount } from "@/lib/format";

function parseExpenseForm(form: FormData):
  | { ok: true; input: ExpenseInput }
  | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const title = String(form.get("title") ?? "").trim();
  const amount = parseAmount(form.get("amount"));
  const category_id = String(form.get("category_id") ?? "") || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const is_estimated = form.get("is_estimated") === "on" || form.get("is_estimated") === "true";

  if (!title) fieldErrors.title = "Title is required.";
  if (amount === null) fieldErrors.amount = "Amount must be a number.";
  else if (amount < 0) fieldErrors.amount = "Amount can't be negative.";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, input: { title, amount: amount!, category_id, notes, is_estimated } };
}

export async function createExpenseAction(tripId: string, form: FormData): Promise<ActionResult> {
  const parsed = parseExpenseForm(form);
  if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  try {
    await createExpense(tripId, parsed.input);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not save the expense: ${(e as Error).message}` };
  }
}

export async function updateExpenseAction(tripId: string, expenseId: string, form: FormData): Promise<ActionResult> {
  const parsed = parseExpenseForm(form);
  if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  try {
    await updateExpense(expenseId, parsed.input);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not save the expense: ${(e as Error).message}` };
  }
}

export async function deleteExpenseAction(tripId: string, expenseId: string): Promise<ActionResult> {
  try {
    await deleteExpense(expenseId);
    revalidatePath(`/trips/${tripId}`, "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not delete the expense: ${(e as Error).message}` };
  }
}
