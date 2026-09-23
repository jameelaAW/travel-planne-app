import { db } from "./supabase";
import type { Expense, ExpenseInput } from "./types";

function normalize(row: Record<string, unknown>): Expense {
  return {
    ...(row as Expense),
    amount: Number(row.amount ?? 0),
    ai_confidence: row.ai_confidence == null ? null : Number(row.ai_confidence),
  };
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

export async function createExpense(tripId: string, input: ExpenseInput) {
  const supabase = await db();
  const { error } = await supabase.from("expenses").insert({ ...input, trip_id: tripId });
  if (error) throw new Error(error.message);
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const supabase = await db();
  const { error } = await supabase.from("expenses").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExpense(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
