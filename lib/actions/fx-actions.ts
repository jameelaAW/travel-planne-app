"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { RATE_SOURCE_COOKIE } from "@/lib/fx";
import { masConfigured } from "@/lib/fx/mas";
import { isRateSource } from "@/lib/fx/types";
import type { ActionResult } from "@/lib/data/types";

export async function setRateSourceAction(source: string): Promise<ActionResult> {
  if (!isRateSource(source)) return { ok: false, error: "Unknown rate source." };
  if (source === "MAS" && !masConfigured()) return { ok: false, error: "MAS rates aren't set up yet (needs a MAS API key)." };
  (await cookies()).set(RATE_SOURCE_COOKIE, source, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}
