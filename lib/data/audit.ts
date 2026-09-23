import { currentUser } from "@/lib/auth";
import { db } from "./supabase";

export type AuditEntry = {
  action_type: "create" | "update" | "delete" | "apply_suggested_allocations" | "suggest_allocation";
  entity_type: "trip" | "category" | "expense";
  entity_id: string | null;
  before_state?: unknown;
  after_state?: unknown;
  actor?: "user" | "agent";
  /** For agent actions: the user who approved them. */
  approved_by?: string | null;
};

/**
 * Append-only audit log (docs/SECURITY.md). Best-effort: a missing table (migration 0003 not yet
 * applied) or a logging failure never blocks the user's write.
 */
export async function logAudit(entry: AuditEntry) {
  try {
    const [supabase, user] = await Promise.all([db(), currentUser()]);
    const { error } = await supabase.from("audit_log").insert({
      user_id: user?.id ?? null,
      actor: entry.actor ?? "user",
      action_type: entry.action_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      before_state: entry.before_state ?? null,
      after_state: entry.after_state ?? null,
      approved_by: entry.approved_by ?? null,
    });
    if (error && error.code !== "PGRST205" && error.code !== "42P01") console.warn("audit log write failed:", error.message);
  } catch (e) {
    console.warn("audit log write failed:", (e as Error).message);
  }
}
