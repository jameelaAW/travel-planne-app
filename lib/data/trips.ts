import { ownerId } from "@/lib/auth";
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
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("trips").select("*");
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

/** Allocated + planned spend per trip, for the trip list cards. */
export async function listTripTotals(): Promise<Map<string, { allocated: number; spent: number }>> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let cq = supabase.from("categories").select("trip_id, allocated_amount");
  let eq = supabase.from("expenses").select("trip_id, amount");
  if (uid) {
    cq = cq.eq("user_id", uid);
    eq = eq.eq("user_id", uid);
  }
  const [cats, exps] = await Promise.all([cq, eq]);
  if (cats.error) throw new Error(cats.error.message);
  if (exps.error) throw new Error(exps.error.message);
  const totals = new Map<string, { allocated: number; spent: number }>();
  const get = (id: string) => totals.get(id) ?? totals.set(id, { allocated: 0, spent: 0 }).get(id)!;
  for (const c of cats.data ?? []) get(c.trip_id).allocated += Number(c.allocated_amount);
  for (const e of exps.data ?? []) get(e.trip_id).spent += Number(e.amount);
  return totals;
}

/** Returns null for trips that don't exist *or* belong to someone else — callers can't tell them apart. */
export async function getTrip(id: string): Promise<Trip | null> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("trips").select("*").eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.maybeSingle();
  if (error) {
    // Malformed uuid → treat as not found rather than a crash.
    if (error.code === "22P02") return null;
    throw new Error(error.message);
  }
  return data ? normalize(data) : null;
}

/** Creates the trip and its 6 default budget categories, owned by the signed-in user. */
export async function createTrip(input: TripInput): Promise<Trip> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...input, user_id: uid })
    .select("*")
    .single();
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
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("trips").update(input).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.select("*").single();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateTripAi(
  id: string,
  patch: Pick<Partial<Trip>, "ai_suggested_allocation" | "ai_source" | "ai_confidence" | "ai_review_status">,
) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("trips").update(patch).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

export async function deleteTrip(id: string): Promise<void> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("trips").delete().eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
