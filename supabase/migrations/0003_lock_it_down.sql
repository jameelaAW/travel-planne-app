-- Sprint 5 — Lock it down (docs/SECURITY.md).
-- Replaces the permissive v1 policies with owner-only access: auth.uid() = user_id on every table.
-- Rows with a null user_id (the v1 seed/demo trips) become invisible; see the optional claim step at the end.

-- ── Owner defaults: rows inserted by a signed-in user belong to them ────────────────────────────
alter table trips      alter column user_id set default auth.uid();
alter table categories alter column user_id set default auth.uid();
alter table expenses   alter column user_id set default auth.uid();

create index if not exists trips_user_id_idx      on trips (user_id);
create index if not exists categories_trip_id_idx on categories (trip_id);
create index if not exists expenses_trip_id_idx   on expenses (trip_id);

-- ── trips ───────────────────────────────────────────────────────────────────────────────────────
drop policy if exists "trips_v1_read"  on trips;
drop policy if exists "trips_v1_write" on trips;
drop policy if exists "trips_owner" on trips;
create policy "trips_owner" on trips for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── categories: own the row AND the parent trip ────────────────────────────────────────────────
drop policy if exists "categories_v1_read"  on categories;
drop policy if exists "categories_v1_write" on categories;
drop policy if exists "categories_owner" on categories;
create policy "categories_owner" on categories for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- ── expenses: own the row, the parent trip, and (if set) the category ──────────────────────────
drop policy if exists "expenses_v1_read"  on expenses;
drop policy if exists "expenses_v1_write" on expenses;
drop policy if exists "expenses_owner" on expenses;
create policy "expenses_owner" on expenses for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
    and (category_id is null or exists (
      select 1 from categories c where c.id = category_id and c.trip_id = expenses.trip_id and c.user_id = auth.uid()
    ))
  );

-- ── Audit log: append-only (insert + read own; no update/delete policy exists) ─────────────────
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid(),
  actor text not null default 'user' check (actor in ('user', 'agent')),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  approved_by text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_user_idx on audit_log (user_id, created_at desc);

alter table audit_log enable row level security;
drop policy if exists "audit_insert_own" on audit_log;
create policy "audit_insert_own" on audit_log for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "audit_read_own" on audit_log;
create policy "audit_read_own" on audit_log for select to authenticated using (auth.uid() = user_id);
revoke update, delete, truncate on audit_log from anon, authenticated;

notify pgrst, 'reload schema';

-- ── Optional: claim the existing demo trips for one account (run separately, edit the email) ──
-- with me as (select id from auth.users where email = 'you@example.com')
-- update trips      set user_id = (select id from me) where user_id is null;
-- with me as (select id from auth.users where email = 'you@example.com')
-- update categories set user_id = (select id from me) where user_id is null;
-- with me as (select id from auth.users where email = 'you@example.com')
-- update expenses   set user_id = (select id from me) where user_id is null;
