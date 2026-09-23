import { db } from "./supabase";
import { CATEGORY_TYPES, DEFAULT_CATEGORY_NAMES, type Category } from "./types";

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
  const supabase = await db();
  const { data, error } = await supabase.from("categories").select("*").eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  return sortCategories((data ?? []).map(normalize));
}

export async function createDefaultCategories(tripId: string): Promise<void> {
  const supabase = await db();
  const rows = CATEGORY_TYPES.map((t) => ({
    trip_id: tripId,
    name: DEFAULT_CATEGORY_NAMES[t],
    category_type: t,
    allocated_amount: 0,
  }));
  const { error } = await supabase.from("categories").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createCategory(tripId: string, name: string, categoryType: string, allocated = 0) {
  const supabase = await db();
  const { error } = await supabase
    .from("categories")
    .insert({ trip_id: tripId, name, category_type: categoryType, allocated_amount: allocated });
  if (error) throw new Error(error.message);
}

export async function updateCategory(id: string, patch: { name?: string; allocated_amount?: number }) {
  const supabase = await db();
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
