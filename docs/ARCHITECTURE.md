## Stack
Next.js (App Router) + Supabase (Postgres) + Vercel. Tailwind CSS.

## Build Sequencing
- **Now:** Trip CRUD, budget category allocation, planned expense tracking, live budget health bars.
- **Next:** Budget health score, overspend alerts, AI-suggested category allocations.
- **Later:** Per-user accounts, shared trips, multi-currency, expense auto-categorization.

## Key User Flow
1. User creates a trip → row in `trips`
2. 6 default categories auto-created → rows in `categories`
3. User allocates amounts → updates `categories.allocated_amount`
4. User adds a planned expense → row in `expenses`
5. Budget bar recalculates from server truth (sum of expenses vs allocation)
6. Overspend shown in red inline

## Navigation Shell
Left sidebar on desktop (Trips list + active trip sections: Overview, Categories, Expenses). Collapses to hamburger on mobile. No login wall in v1.

## Layer Plan
1. **Data layer** (`lib/data/`) — all DB reads/writes via Supabase client; no inline UI queries.
2. **App logic** (`lib/actions/`) — server actions for create/update/delete.
3. **Smart features** (`lib/ai/`) — budget allocation suggestions (later).
4. **UI** (`app/`, `components/`) — render server-derived data only.

The core (trip + budget + expenses) runs entirely without AI. AI only enhances allocation suggestions later.

## Repo Structure
```
app/
  page.tsx                  (trip list = homepage)
  trips/[id]/page.tsx       (trip detail)
  trips/[id]/categories/
  trips/[id]/expenses/
components/
  ui/     (shared primitives)
  trip/   (cards, forms)
  budget/ (category list, expense list, budget bar)
lib/
  data/     (trips.ts, categories.ts, expenses.ts)
  actions/  (trip-actions.ts, expense-actions.ts)
  ai/       (allocation.ts)
tests/
  budget-flow.test.ts
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| **trips** | Trip CRUD + auto-create default categories | `trips` table | 1st |
| **budget** | Category allocation + expense CRUD + spend math | `categories`, `expenses` | 2nd |
| **dashboard** | Trip overview, budget health bars, summary | derived reads | 3rd |
| **ai** | Suggest allocations, categorize expenses | AI suggestion logic | 4th |
| **auth** | Login/signup, per-user RLS | user scoping | 5th |