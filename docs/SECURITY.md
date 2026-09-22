## Secret Handling
- Supabase URL + anon key: public-safe (browser-exposed). Service role key: server-only, never in frontend code or client env vars.
- AI API keys: server-side only via `lib/ai/`.

## Permission Model
- **v1 (demo):** All tables have permissive RLS policies — anonymous reads/writes work so the app renders without login.
- **Lock-down (later):** Replace permissive policies with `auth.uid() = user_id` on every table. Users see only their own trips, categories, and expenses. Seed rows carry null `user_id` and become invisible after lock-down.
- Agent inherits the logged-in user's permissions — never broader.

## Approved-Tools Rule
- Only named, parameterized functions: `suggest_allocation`, `categorize_expense`, `apply_suggested_allocations`. No raw `run_query` or `send_message`.
- Every tool call logs to audit: who called, what entity, before/after state.

## Audit Principle
- Every meaningful write (create / update / delete trip, category, expense) and every agent action is logged with actor, entity, before/after, and timestamp.
- Audit logs are append-only; no deletion path.