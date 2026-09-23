import { createClient } from "@/lib/supabase/server";

/** Server-side Supabase client used by every data-layer module. */
export async function db() {
  return createClient();
}
