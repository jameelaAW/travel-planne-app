-- Foreign-currency expenses: keep what the user entered and the rate (ECB or MAS) used to convert it
-- into the trip currency. `expenses.amount` stays in the trip currency (all budget math uses it).
alter table expenses add column if not exists original_amount numeric;
alter table expenses add column if not exists original_currency text;
alter table expenses add column if not exists fx_rate numeric;
alter table expenses add column if not exists fx_rate_date date;
alter table expenses add column if not exists fx_source text;

-- PostgREST must reload its schema cache to see the new columns.
notify pgrst, 'reload schema';
