"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/data/types";

/** Only same-site relative paths, so ?next= can't bounce users to another site. */
function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "/");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

function parseCredentials(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  return { email, password, fieldErrors };
}

export async function signInAction(form: FormData): Promise<ActionResult<{ next: string }>> {
  const { email, password, fieldErrors: all } = parseCredentials(form);
  // Sign-in only needs a password to be present; the length rule is for new accounts.
  const fieldErrors: Record<string, string> = {};
  if (all.email) fieldErrors.email = all.email;
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Enter your email and password.", fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? "Please confirm your email first — check your inbox for the link."
      : "Email or password is incorrect.";
    return { ok: false, error: msg };
  }
  return { ok: true, data: { next: safeNext(form.get("next")) } };
}

export async function signUpAction(form: FormData): Promise<ActionResult<{ next: string | null }>> {
  const { email, password, fieldErrors } = parseCredentials(form);
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(form.get("next")))}` },
  });
  if (error) return { ok: false, error: error.message };
  // With email confirmation on (the default) there is no session until the link is clicked.
  return { ok: true, data: { next: data.session ? safeNext(form.get("next")) : null } };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
