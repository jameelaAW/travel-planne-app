import { ownerId } from "@/lib/auth";
import { db } from "./supabase";
import { CATEGORY_TYPES, DEFAULT_CATEGORY_NAMES, type Category } from "./types";

// Every function is scoped by trip_id and, when signed in, by user_id — callers must already
// have confirmed the trip belongs to the user (getTrip), and RLS enforces the same after 0003.

function normalize(row: Record<string, unknown>): Category {
  return { ...(row as Category), allocated_amount: Number(row.allocated_amount ?? 0) };
}

/** Canonical display order: the 6 default types first, then anything custom. */
function sortCategories(list: Category[]) {
  const rank = (c: Category) => {
    const i = CATEGORY_TYPES.indexOf(c.category_type as (typeof CATEGORY_TYPES)[number]);
    return i === -1 ? CATEGORY_TYPES.length : i;
  };
  return list.sort((a, b) => rank(a) - rank(b) || a.created_at.localeCompare(b.created_at));
}

export async function listCategories(tripId: string): Promise<Category[]> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("categories").select("*").eq("trip_id", tripId);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return sortCategories((data ?? []).map(normalize));
}

export async function getCategory(tripId: string, id: string): Promise<Category | null> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("categories").select("*").eq("trip_id", tripId).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function createDefaultCategories(tripId: string): Promise<void> {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  const rows = CATEGORY_TYPES.map((t) => ({
    trip_id: tripId,
    user_id: uid,
    name: DEFAULT_CATEGORY_NAMES[t],
    category_type: t,
    allocated_amount: 0,
  }));
  const { error } = await supabase.from("categories").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createCategory(tripId: string, name: string, categoryType: string, allocated = 0) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  const { data, error } = await supabase
    .from("categories")
    .insert({ trip_id: tripId, user_id: uid, name, category_type: categoryType, allocated_amount: allocated })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateCategory(tripId: string, id: string, patch: { name?: string; allocated_amount?: number }) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("categories").update(patch).eq("trip_id", tripId).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

/** Bulk-convert every allocation of a trip (used when the trip currency changes). */
export async function scaleTripAllocations(tripId: string, rate: number) {
  for (const c of await listCategories(tripId)) {
    await updateCategory(tripId, c.id, { allocated_amount: Math.round(c.allocated_amount * rate * 100) / 100 });
  }
}

export async function deleteCategory(tripId: string, id: string) {
  const [supabase, uid] = await Promise.all([db(), ownerId()]);
  let q = supabase.from("categories").delete().eq("trip_id", tripId).eq("id", id);
  if (uid) q = q.eq("user_id", uid);
  const { error } = await q;
  if (error) throw new Error(error.message);
}
