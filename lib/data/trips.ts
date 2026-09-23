import { createDefaultCategories } from "./categories";
import { db } from "./supabase";
import type { Trip, TripInput } from "./types";

const num = (v: unknown) => Number(v ?? 0);

function normalize(row: Record<string, unknown>): Trip {
  return {
    ...(row as Trip),
    total_budget: num(row.total_budget),
    ai_confidence: row.ai_confidence == null ? null : num(row.ai_confidence),
  };
}

export async function listTrips(): Promise<Trip[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const supabase = await db();
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) {
    // Malformed uuid → treat as not found rather than a crash.
    if (error.code === "22P02") return null;
    throw new Error(error.message);
  }
  return data ? normalize(data) : null;
}

/** Creates the trip and its 6 default budget categories. */
export async function createTrip(input: TripInput): Promise<Trip> {
  const supabase = await db();
  const { data, error } = await supabase.from("trips").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  const trip = normalize(data);
  try {
    await createDefaultCategories(trip.id);
  } catch (e) {
    // Don't leave a half-created trip behind.
    await supabase.from("trips").delete().eq("id", trip.id);
    throw e;
  }
  return trip;
}

export async function updateTrip(id: string, input: Partial<TripInput>): Promise<Trip> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("trips")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
