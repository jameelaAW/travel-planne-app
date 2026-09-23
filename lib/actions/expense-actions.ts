"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/data/audit";
import { listCategories } from "@/lib/data/categories";
import { createExpense, deleteExpense, getExpense, updateExpense } from "@/lib/data/expenses";
import { getTrip } from "@/lib/data/trips";
import type { ActionResult, ExpenseInput } from "@/lib/data/types";
import { convert, getRates, preferredSource } from "@/lib/fx";
import { isRateSource } from "@/lib/fx/types";
import { parseAmount } from "@/lib/format";

/** Parses the form; foreign-currency amounts are converted to the trip currency using the chosen rate source (ECB or MAS). */
async function parseExpenseForm(
  form: FormData,
  tripCurrency: string,
): Promise<{ ok: true; input: ExpenseInput } | { ok: false; error?: string; fieldErrors: Record<string, string> }> {
  const fieldErrors: Record<string, string> = {};
  const title = String(form.get("title") ?? "").trim();
  const entered = parseAmount(form.get("amount"));
  const currency = (String(form.get("currency") ?? "").trim() || tripCurrency).toUpperCase();
  const category_id = String(form.get("category_id") ?? "") || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const is_estimated = form.get("is_estimated") === "on" || form.get("is_estimated") === "true";

  if (!title) fieldErrors.title = "Title is required.";
  if (entered === null) fieldErrors.amount = "Amount must be a number.";
  else if (entered < 0) fieldErrors.amount = "Amount can't be negative.";
  if (!/^[A-Z]{3}$/.test(currency)) fieldErrors.currency = "Pick a currency.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  if (currency === tripCurrency)
    return { ok: true, input: { title, amount: entered!, category_id, notes, is_estimated, fx: null } };

  const requested = String(form.get("rate_source") ?? "");
  const source = isRateSource(requested) ? requested : await preferredSource();
  try {
    const table = await getRates(source);
    const { amount, rate, date } = convert(table, entered!, currency, tripCurrency);
    return {
      ok: true,
      input: {
        title,
        amount,
        category_id,
        notes,
        is_estimated,
        fx: { original_amount: entered!, original_currency: currency, fx_rate: rate, fx_rate_date: date, fx_source: source },
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: `Could not convert ${currency} to ${tripCurrency} with ${source} rates: ${(e as Error).message}`,
      fieldErrors: { currency: "Conversion unavailable right now." },
    };
  }
}

async function save(tripId: string, form: FormData, write: (input: ExpenseInput, cur: string) => Promise<void>): Promise<ActionResult> {
  try {
    const trip = await getTrip(tripId);
    if (!trip) return { ok: false, error: "Trip not found." };
    const parsed = await parseExpenseForm(form, trip.currency);
    if (!parsed.ok) return { ok: false, error: parsed.error ?? "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
    // The category must belong to this trip (no attaching expenses to someone else's category).
    const categoryId = parsed.input.category_id;
    if (categoryId && !(await listCategories(tripId)).some((c) => c.id === categoryId))
      return { ok: false, error: "That category isn't part of this trip.", fieldErrors: { category_id: "Pick a category from this trip." } };
    await write(parsed.input, trip.currency);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not save the expense: ${(e as Error).message}` };
  }
}

export async function createExpenseAction(tripId: string, form: FormData): Promise<ActionResult> {
  return save(tripId, form, async (input, cur) => {
    await createExpense(tripId, input, cur);
    await logAudit({ action_type: "create", entity_type: "expense", entity_id: null, after_state: { trip_id: tripId, ...input } });
  });
}

export async function updateExpenseAction(tripId: string, expenseId: string, form: FormData): Promise<ActionResult> {
  return save(tripId, form, async (input, cur) => {
    const before = await getExpense(tripId, expenseId);
    if (!before) throw new Error("expense not found");
    await updateExpense(tripId, expenseId, input, cur);
    await logAudit({ action_type: "update", entity_type: "expense", entity_id: expenseId, before_state: before, after_state: input });
  });
}

export async function deleteExpenseAction(tripId: string, expenseId: string): Promise<ActionResult> {
  try {
    if (!(await getTrip(tripId))) return { ok: false, error: "Trip not found." };
    const before = await getExpense(tripId, expenseId);
    if (!before) return { ok: false, error: "Expense not found." };
    await deleteExpense(tripId, expenseId);
    await logAudit({ action_type: "delete", entity_type: "expense", entity_id: expenseId, before_state: before });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not delete the expense: ${(e as Error).message}` };
  }
}
