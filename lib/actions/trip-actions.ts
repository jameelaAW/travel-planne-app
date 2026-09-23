"use server";

import { revalidatePath } from "next/cache";
import { scaleTripAllocations } from "@/lib/data/categories";
import { scaleTripExpenses } from "@/lib/data/expenses";
import { createTrip, deleteTrip, getTrip, updateTrip } from "@/lib/data/trips";
import type { ActionResult, TripInput } from "@/lib/data/types";
import { convert, getEcbRates, type EcbRates } from "@/lib/fx/ecb";
import { parseAmount } from "@/lib/format";

async function ratesOrNull(): Promise<EcbRates | null> {
  try {
    return await getEcbRates();
  } catch {
    return null;
  }
}

function parseTripForm(form: FormData, rates: EcbRates | null):
  | { ok: true; input: TripInput }
  | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const title = String(form.get("title") ?? "").trim();
  const destination = String(form.get("destination") ?? "").trim();
  const start_date = String(form.get("start_date") ?? "") || null;
  const end_date = String(form.get("end_date") ?? "") || null;
  const currency = (String(form.get("currency") ?? "USD").trim() || "USD").toUpperCase();
  const total_budget = parseAmount(form.get("total_budget"));

  if (!title) fieldErrors.title = "Title is required.";
  if (!destination) fieldErrors.destination = "Destination is required.";
  if (total_budget === null || total_budget < 0) fieldErrors.total_budget = "Budget must be a positive number.";
  if (start_date && end_date && end_date < start_date) fieldErrors.end_date = "End date must be after the start date.";
  if (!/^[A-Z]{3}$/.test(currency)) fieldErrors.currency = "Use a 3-letter currency code.";
  else if (rates && !rates.rates[currency]) fieldErrors.currency = "Pick a currency with an ECB reference rate.";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, input: { title, destination, start_date, end_date, total_budget: total_budget!, currency } };
}

export async function createTripAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseTripForm(form, await ratesOrNull());
  if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  try {
    const trip = await createTrip(parsed.input);
    revalidatePath("/", "layout");
    return { ok: true, data: { id: trip.id } };
  } catch (e) {
    return { ok: false, error: `Could not save the trip: ${(e as Error).message}` };
  }
}

/**
 * When the currency changes and "convert" is ticked, the budget typed in the form (still in the old
 * currency) plus every allocation and expense are converted at the ECB reference rate.
 */
export async function updateTripAction(id: string, form: FormData): Promise<ActionResult> {
  const rates = await ratesOrNull();
  const parsed = parseTripForm(form, rates);
  if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  try {
    const before = await getTrip(id);
    if (!before) return { ok: false, error: "Trip not found." };
    const input = parsed.input;
    const convertAll = form.get("convert_existing") === "on" && before.currency !== input.currency;
    if (convertAll) {
      if (!rates) return { ok: false, error: "ECB rates are unavailable right now, so amounts can't be converted. Try again later." };
      const { rate, amount } = convert(rates, input.total_budget, before.currency, input.currency);
      input.total_budget = amount;
      await scaleTripAllocations(id, rate);
      await scaleTripExpenses(id, rate);
    }
    await updateTrip(id, input);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not save the trip: ${(e as Error).message}` };
  }
}

export async function deleteTripAction(id: string): Promise<ActionResult> {
  try {
    await deleteTrip(id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not delete the trip: ${(e as Error).message}` };
  }
}
