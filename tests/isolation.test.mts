/**
 * Sprint 5: "user A cannot see user B's trips" — checked against the real database's RLS.
 *
 * Needs two confirmed accounts and migration 0003 applied:
 *   TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD / TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD
 * plus NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. from .env.local).
 *
 * Run: node --env-file=.env.local --env-file=.env.test tests/isolation.test.mts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const need = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.log(`SKIP isolation test — missing env: ${missing.join(", ")}`);
  process.exit(0);
}

async function signIn(prefix: "A" | "B"): Promise<{ client: SupabaseClient; id: string }> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env[`TEST_USER_${prefix}_EMAIL`]!,
    password: process.env[`TEST_USER_${prefix}_PASSWORD`]!,
  });
  if (error) throw new Error(`sign-in ${prefix}: ${error.message}`);
  return { client, id: data.user.id };
}

const a = await signIn("A");
const b = await signIn("B");
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const created = await a.client
  .from("trips")
  .insert({ title: "RLS isolation test", destination: "Nowhere", total_budget: 100, user_id: a.id })
  .select("id")
  .single();
assert.ifError(created.error);
const tripId = created.data!.id as string;

try {
  // A sees own trip.
  const own = await a.client.from("trips").select("id").eq("id", tripId);
  assert.equal(own.data?.length, 1, "owner should see their trip");

  // B can't read, update or delete it.
  const read = await b.client.from("trips").select("id").eq("id", tripId);
  assert.equal(read.data?.length, 0, "user B must not see user A's trip");
  const upd = await b.client.from("trips").update({ title: "hacked" }).eq("id", tripId).select("id");
  assert.equal(upd.data?.length ?? 0, 0, "user B must not update user A's trip");
  const del = await b.client.from("trips").delete().eq("id", tripId).select("id");
  assert.equal(del.data?.length ?? 0, 0, "user B must not delete user A's trip");

  // B can't attach an expense to A's trip.
  const inject = await b.client.from("expenses").insert({ trip_id: tripId, title: "inject", amount: 1, user_id: b.id });
  assert.ok(inject.error, "user B must not add expenses to user A's trip");

  // Anonymous visitors see nothing.
  const anonRead = await anon.from("trips").select("id").eq("id", tripId);
  assert.equal(anonRead.data?.length ?? 0, 0, "anonymous must not see any trips");

  // A's trip is unchanged.
  const after = await a.client.from("trips").select("title").eq("id", tripId).single();
  assert.equal(after.data?.title, "RLS isolation test");
  console.log("PASS isolation: B and anonymous cannot read, change, delete or attach to A's trip");
} finally {
  await a.client.from("trips").delete().eq("id", tripId);
}
