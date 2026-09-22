## trips
| Field | Type | Notes |
|------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid | nullable; owner-scoping later |
| title | text | not null |
| destination | text | not null |
| start_date | date | nullable |
| end_date | date | nullable |
| total_budget | numeric | not null, default 0 |
| currency | text | default 'USD' |
| status | text | default 'planning' |
| ai_suggested_allocation | jsonb | nullable; AI field |
| ai_source | text | nullable; AI field |
| ai_confidence | numeric | nullable; AI field |
| ai_review_status | text | default 'unreviewed'; AI field |
| created_at | timestamptz | default now() |

**Relationships:** 1 trip → many categories, many expenses.
**RLS v1:** permissive read/write (demo). Later: `auth.uid() = user_id`.

## categories
| Field | Type | Notes |
|------|------|-------|
| id | uuid PK | |
| trip_id | uuid FK→trips | on delete cascade |
| user_id | uuid | nullable |
| name | text | not null |
| category_type | text | air / land_travel / local_travel / food / lodging / shopping |
| allocated_amount | numeric | default 0 |
| created_at | timestamptz | default now() |

**Relationships:** 1 category → many expenses.
**RLS v1:** permissive. Later: owner-scoped via trip's user_id.

## expenses
| Field | Type | Notes |
|------|------|-------|
| id | uuid PK | |
| trip_id | uuid FK→trips | on delete cascade |
| category_id | uuid FK→categories | on delete set null |
| user_id | uuid | nullable |
| title | text | not null |
| amount | numeric | not null, default 0 |
| is_estimated | boolean | default true |
| notes | text | nullable |
| ai_categorized | text | nullable; AI field |
| ai_source | text | nullable; AI field |
| ai_confidence | numeric | nullable; AI field |
| ai_review_status | text | default 'unreviewed'; AI field |
| created_at | timestamptz | default now() |

**Derived (not stored):** category spend = `sum(expenses.amount)`. Trip spend = sum across all categories. Remaining = `allocated − spend`.
**RLS v1:** permissive read/write. Later: `auth.uid() = user_id`.