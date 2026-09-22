create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  total_budget numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'planning',
  ai_suggested_allocation jsonb,
  ai_source text,
  ai_confidence numeric,
  ai_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table trips enable row level security;
drop policy if exists "trips_v1_read" on trips;
create policy "trips_v1_read" on trips for select using (true);
drop policy if exists "trips_v1_write" on trips;
create policy "trips_v1_write" on trips for all using (true) with check (true);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid,
  name text not null,
  category_type text not null,
  allocated_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
drop policy if exists "categories_v1_read" on categories;
create policy "categories_v1_read" on categories for select using (true);
drop policy if exists "categories_v1_write" on categories;
create policy "categories_v1_write" on categories for all using (true) with check (true);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  category_id uuid references categories on delete set null,
  user_id uuid,
  title text not null,
  amount numeric not null default 0,
  is_estimated boolean not null default true,
  notes text,
  ai_categorized text,
  ai_source text,
  ai_confidence numeric,
  ai_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
drop policy if exists "expenses_v1_read" on expenses;
create policy "expenses_v1_read" on expenses for select using (true);
drop policy if exists "expenses_v1_write" on expenses;
create policy "expenses_v1_write" on expenses for all using (true) with check (true);

insert into trips (title, destination, start_date, end_date, total_budget, currency, status)
select 'Japan Week in Tokyo', 'Tokyo, Japan', '2025-04-10', '2025-04-17', 3500, 'USD', 'planning'
where not exists (select 1 from trips where title = 'Japan Week in Tokyo');

insert into categories (trip_id, name, category_type, allocated_amount)
select t.id, v.name, v.category_type, v.allocated_amount
from trips t
cross join (values
  ('Air Tickets', 'air', 1200),
  ('Land Travel', 'land_travel', 200),
  ('Local Travel', 'local_travel', 150),
  ('Food', 'food', 500),
  ('Lodging', 'lodging', 800),
  ('Shopping', 'shopping', 650)
) as v(name, category_type, allocated_amount)
where t.title = 'Japan Week in Tokyo'
and not exists (select 1 from categories c where c.trip_id = t.id and c.name = v.name);

insert into expenses (trip_id, category_id, title, amount, is_estimated, notes)
select t.id, c.id, v.title, v.amount, v.is_estimated, v.notes
from trips t
join categories c on c.trip_id = t.id
cross join (values
  ('Air Tickets', 'Round-trip LAX-NRT economy', 1150, true, 'Booking via Skyscanner'),
  ('Lodging', 'Capsule hotel 6 nights', 780, true, 'Shinjuku area'),
  ('Food', 'Daily meals estimate', 350, true, 'Ramen and convenience stores'),
  ('Shopping', 'Souvenirs budget', 200, true, '')
) as v(cat_name, title, amount, is_estimated, notes)
where t.title = 'Japan Week in Tokyo' and c.name = v.cat_name
and not exists (select 1 from expenses e where e.trip_id = t.id and e.title = v.title);

insert into trips (title, destination, start_date, end_date, total_budget, currency, status)
select 'Bali Weekend Getaway', 'Bali, Indonesia', '2025-06-20', '2025-06-23', 1200, 'USD', 'planning'
where not exists (select 1 from trips where title = 'Bali Weekend Getaway');

insert into categories (trip_id, name, category_type, allocated_amount)
select t.id, v.name, v.category_type, v.allocated_amount
from trips t
cross join (values
  ('Air Tickets', 'air', 450),
  ('Land Travel', 'land_travel', 80),
  ('Local Travel', 'local_travel', 60),
  ('Food', 'food', 150),
  ('Lodging', 'lodging', 300),
  ('Shopping', 'shopping', 160)
) as v(name, category_type, allocated_amount)
where t.title = 'Bali Weekend Getaway'
and not exists (select 1 from categories c where c.trip_id = t.id and c.name = v.name);

insert into expenses (trip_id, category_id, title, amount, is_estimated, notes)
select t.id, c.id, v.title, v.amount, v.is_estimated, v.notes
from trips t
join categories c on c.trip_id = t.id
cross join (values
  ('Air Tickets', 'Budget airline round-trip', 430, true, ''),
  ('Food', 'Street food 3 days', 45, true, '')
) as v(cat_name, title, amount, is_estimated, notes)
where t.title = 'Bali Weekend Getaway' and c.name = v.cat_name
and not exists (select 1 from expenses e where e.trip_id = t.id and e.title = v.title);