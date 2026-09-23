import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * DEMO_MODE=true keeps the v1 behaviour: no login wall, all rows shared. Only meaningful while the
 * permissive v1 RLS policies are in place — after migration 0003 the database itself hides rows
 * from anonymous visitors.
 */
export function demoMode() {
  return process.env.DEMO_MODE === "true";
}

export const currentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export class NotSignedInError extends Error {
  constructor() {
    super("Please sign in again.");
  }
}

/**
 * The user id every query is scoped to (defence in depth on top of RLS). null only in demo mode.
 * Throws when a signed-in user is required and there isn't one.
 */
export const ownerId = cache(async (): Promise<string | null> => {
  if (demoMode()) return null;
  const user = await currentUser();
  if (!user) throw new NotSignedInError();
  return user.id;
});
