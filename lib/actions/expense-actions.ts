"use server";

import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense, updateExpense } from "@/lib/data/expenses";
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
    await write(parsed.input, trip.currency);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not save the expense: ${(e as Error).message}` };
  }
}

export async function createExpenseAction(tripId: string, form: FormData): Promise<ActionResult> {
  return save(tripId, form, (input, cur) => createExpense(tripId, input, cur));
}

export async function updateExpenseAction(tripId: string, expenseId: string, form: FormData): Promise<ActionResult> {
  return save(tripId, form, (input, cur) => updateExpense(expenseId, input, cur));
}

export async function deleteExpenseAction(tripId: string, expenseId: string): Promise<ActionResult> {
  try {
    await deleteExpense(expenseId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not delete the expense: ${(e as Error).message}` };
  }
}
