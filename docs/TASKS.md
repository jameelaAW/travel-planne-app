## Sprint 1 — Foundation + Trip CRUD
**Goal:** DB schema + trip create/edit/delete, viewable without login.

- [ ] Run migration SQL (trips, categories, expenses + permissive RLS + seed data)
- [ ] Set up Supabase client in `lib/data/supabase.ts`
- [ ] Build `lib/data/trips.ts` — CRUD functions
- [ ] Build `lib/actions/trip-actions.ts` — server actions
- [ ] Trip list page (homepage) — shows seeded trips + create form
- [ ] Trip detail page — edit title, destination, dates, total budget
- [ ] Delete trip with confirm dialog
- [ ] Loading / empty / error states for trip list

**Done:** User can create, view, edit, and delete a trip. Seeded trips visible without login.

---

## Sprint 2 — Budget Engine ⭐ v1 FUNCTIONAL
**Goal:** Category allocation + planned expenses + live budget health.

- [ ] Auto-create 6 default categories on trip creation (air, land_travel, local_travel, food, lodging, shopping)
- [ ] Build `lib/data/categories.ts` + `lib/data/expenses.ts`
- [ ] Category list with editable allocated_amount (inline edit)
- [ ] Expense create / edit / delete under each category
- [ ] Budget bar: per-category (spend vs allocation) and trip total (total spend vs total budget)
- [ ] Overspend shown in red; remaining shown in green
- [ ] 5 states: loading, empty (no expenses yet), partial, error, ready

**Done:** User creates a trip, allocates budget to categories, adds expenses, sees live remaining budget. Success scenario works end-to-end.

---

## Sprint 3 — Dashboard + Polish
**Goal:** Trip overview with budget health score + responsive nav shell.

- [ ] Left sidebar nav (trips list + active trip sections: Overview, Categories, Expenses)
- [ ] Collapse to hamburger on mobile
- [ ] Trip overview: total budget, total spend, remaining, budget fit score (rule-based)
- [ ] Category ranking (most over-budget first)
- [ ] Expense list sorted by amount (largest first)
- [ ] Keyboard accessible nav
- [ ] Error boundary for failed data fetches

**Done:** App has a polished, responsive nav + dashboard overview. All 5 states tested.

---

## Sprint 4 — Smart Allocation
**Goal:** AI-suggested budget allocations from trip description.

- [ ] `lib/ai/allocation.ts` — call AI with trip details, return structured allocation plan
- [ ] Strict output schema validation; null on low confidence; retry on invalid
- [ ] Store suggestion in `trips.ai_suggested_allocation` + source / confidence / review_status
- [ ] "Suggest allocation" button → drafts plan, user clicks "Apply" to write
- [ ] Low-confidence allocations flagged for review

**Done:** User gets AI-suggested allocations, reviews, and applies them. Low-confidence caught.

---

## Sprint 5 — Lock It Down
**Goal:** Auth + per-user data isolation.

- [ ] Add Supabase Auth (signup / login)
- [ ] Replace permissive RLS with `auth.uid() = user_id` on all tables
- [ ] Set user_id on create for trips, categories, expenses
- [ ] Redirect anonymous visitors to login (keep demo mode behind a flag)
- [ ] Audit logging for all writes
- [ ] Test: user A cannot see user B's trips

**Done:** Users log in, see only their own data, anonymous access gated.

---

## Gantt
```
Sprint 1: [====]              Foundation + Trip CRUD
Sprint 2:     [====]          Budget Engine (v1 functional) ⭐
Sprint 3:         [====]      Dashboard + Polish
Sprint 4:             [====]  Smart Allocation
Sprint 5:                 [====] Lock It Down
         |----|----|----|----|----|
         S1   S2   S3   S4   S5
```

⭐ = v1 functional milestone (success scenario usable end-to-end)