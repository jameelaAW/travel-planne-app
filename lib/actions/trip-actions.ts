"use server";

import { revalidatePath } from "next/cache";
import { scaleTripAllocations } from "@/lib/data/categories";
import { scaleTripExpenses } from "@/lib/data/expenses";
import { createTrip, deleteTrip, getTrip, updateTrip } from "@/lib/data/trips";
import type { ActionResult, TripInput } from "@/lib/data/types";
import { allRateTables, convert, getRates, preferredSource } from "@/lib/fx";
import { isRateSource, type RateTable } from "@/lib/fx/types";
import { parseAmount } from "@/lib/format";

/** Currencies any configured source publishes; null when no source is reachable (then any 3-letter code is accepted). */
async function knownCurrencies(): Promise<Set<string> | null> {
  const tables = Object.values(await allRateTables()).filter((t): t is RateTable => "rates" in t);
  return tables.length ? new Set(tables.flatMap((t) => Object.keys(t.rates))) : null;
}

function parseTripForm(form: FormData, known: Set<string> | null):
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
  else if (known && !known.has(currency)) fieldErrors.currency = "Pick a currency with a published ECB or MAS rate.";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, input: { title, destination, start_date, end_date, total_budget: total_budget!, currency } };
}

export async function createTripAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseTripForm(form, await knownCurrencies());
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
 * currency) plus every allocation and expense are converted using the chosen rate source (ECB or MAS).
 */
export async function updateTripAction(id: string, form: FormData): Promise<ActionResult> {
  const parsed = parseTripForm(form, await knownCurrencies());
  if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  try {
    const before = await getTrip(id);
    if (!before) return { ok: false, error: "Trip not found." };
    const input = parsed.input;
    const convertAll = form.get("convert_existing") === "on" && before.currency !== input.currency;
    if (convertAll) {
      const requested = String(form.get("rate_source") ?? "");
      const source = isRateSource(requested) ? requested : await preferredSource();
      let table: RateTable;
      try {
        table = await getRates(source);
      } catch (e) {
        return { ok: false, error: `${source} rates are unavailable (${(e as Error).message}), so amounts can't be converted.` };
      }
      const { rate, amount } = convert(table, input.total_budget, before.currency, input.currency);
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
