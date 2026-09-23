import { ownerId } from "@/lib/auth";
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

/** Human-readable record of a conversion (source, rate, date), kept in notes when the fx columns don't exist yet. */
const FX_NOTE = /\s*\[(?:ECB|MAS) FX:[^\]]*\]/g;
export function fxNote(fx: FxDetails, tripCurrency: string) {
  return `[${fx.fx_source} FX: ${fx.original_amount} ${fx.original_currency} at 1 ${fx.original_currency} = ${Number(fx.fx_rate.toPrecision(6))} ${tripCurrency}, ${fx.fx_source} rate ${fx.fx_rate_date}]`;
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
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("expenses").select("*").eq("trip_id", tripId);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

export async function getExpense(tripId: string, id: string): Promise<Expense | null> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("expenses").select("*").eq("trip_id", tripId).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function createExpense(tripId: string, input: ExpenseInput, tripCurrency: string) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  const { withColumns, legacy } = rows(input, tripCurrency);
  const owner = { trip_id: tripId, user_id: uid };
  let { error } = await supabase.from("expenses").insert({ ...withColumns, ...owner });
  if (missingColumn(error)) ({ error } = await supabase.from("expenses").insert({ ...legacy, ...owner }));
  if (error) throw new Error(error.message);
}

export async function updateExpense(tripId: string, id: string, input: ExpenseInput, tripCurrency: string) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  const { withColumns, legacy } = rows(input, tripCurrency);
  const run = (row: Record<string, unknown>) => {
    let q = supabase.from("expenses").update(row).eq("trip_id", tripId).eq("id", id);
    if (uid) q = q.eq("user_id", uid);
    return q;
  };
  let { error } = await run(withColumns);
  if (missingColumn(error)) ({ error } = await run(legacy));
  if (error) throw new Error(error.message);
}

/** Bulk-convert every expense of a trip (used when the trip currency changes). */
export async function scaleTripExpenses(tripId: string, rate: number) {
  const supabase = await db();
  for (const e of await listExpenses(tripId)) {
    const { error } = await supabase
      .from("expenses")
      .update({ amount: Math.round(e.amount * rate * 100) / 100 })
      .eq("trip_id", tripId)
      .eq("id", e.id);
    if (error) throw new Error(error.message);
  }
}

export async function deleteExpense(tripId: string, id: string) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("expenses").delete().eq("trip_id", tripId).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
