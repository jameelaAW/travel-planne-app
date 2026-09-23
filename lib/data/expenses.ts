import { db } from "./supabase";
import type { Expense, ExpenseInput, FxDetails } from "./types";

function normalize(row: Record<string, unknown>): Expense {
  const n = (v: unknown) => (v == null ? null : Number(v));
  return {
    ...(row as Expense),
    amount: Number(row.amount ?? 0),
    ai_confidence: n(row.ai_confidence),
    original_amount: n(row.original_amount),
    fx_rate: n(row.fx_rate),
  };
}

/** Human-readable record of an ECB conversion, kept in notes when the fx columns don't exist yet. */
const FX_NOTE = /\s*\[ECB FX:[^\]]*\]/g;
export function fxNote(fx: FxDetails, tripCurrency: string) {
  return `[ECB FX: ${fx.original_amount} ${fx.original_currency} at 1 ${fx.original_currency} = ${Number(fx.fx_rate.toPrecision(6))} ${tripCurrency}, ECB reference rate ${fx.fx_rate_date}]`;
}
export function stripFxNote(notes: string | null) {
  return notes?.replace(FX_NOTE, "").trim() || null;
}

/** PostgREST "column not found in schema cache": migration 0002 isn't applied yet. */
const missingColumn = (e: { code?: string } | null) => e?.code === "PGRST204" || e?.code === "42703";

function rows(input: ExpenseInput, tripCurrency: string) {
  const { fx, ...base } = input;
  const notes = stripFxNote(base.notes);
  const withColumns = {
    ...base,
    notes,
    original_amount: fx?.original_amount ?? null,
    original_currency: fx?.original_currency ?? null,
    fx_rate: fx?.fx_rate ?? null,
    fx_rate_date: fx?.fx_rate_date ?? null,
    fx_source: fx?.fx_source ?? null,
  };
  const legacy = { ...base, notes: fx ? [notes, fxNote(fx, tripCurrency)].filter(Boolean).join(" ") : notes };
  return { withColumns, legacy };
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

export async function getExpense(id: string): Promise<Expense | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function createExpense(tripId: string, input: ExpenseInput, tripCurrency: string) {
  const supabase = await db();
  const { withColumns, legacy } = rows(input, tripCurrency);
  let { error } = await supabase.from("expenses").insert({ ...withColumns, trip_id: tripId });
  if (missingColumn(error)) ({ error } = await supabase.from("expenses").insert({ ...legacy, trip_id: tripId }));
  if (error) throw new Error(error.message);
}

export async function updateExpense(id: string, input: ExpenseInput, tripCurrency: string) {
  const supabase = await db();
  const { withColumns, legacy } = rows(input, tripCurrency);
  let { error } = await supabase.from("expenses").update(withColumns).eq("id", id);
  if (missingColumn(error)) ({ error } = await supabase.from("expenses").update(legacy).eq("id", id));
  if (error) throw new Error(error.message);
}

/** Bulk-convert every expense of a trip (used when the trip currency changes). */
export async function scaleTripExpenses(tripId: string, rate: number) {
  const supabase = await db();
  const { data, error } = await supabase.from("expenses").select("id, amount").eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  for (const e of data ?? []) {
    const { error: err } = await supabase
      .from("expenses")
      .update({ amount: Math.round(Number(e.amount) * rate * 100) / 100 })
      .eq("id", e.id);
    if (err) throw new Error(err.message);
  }
}

export async function deleteExpense(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
