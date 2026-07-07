-- Run this in Supabase SQL Editor if employee save fails with
-- "new row violates row-level security policy" or similar errors.

alter table settings enable row level security;
alter table employees enable row level security;

drop policy if exists "Allow public read settings" on settings;
drop policy if exists "Allow public insert settings" on settings;
drop policy if exists "Allow public update settings" on settings;
drop policy if exists "Allow public read employees" on employees;
drop policy if exists "Allow public insert employees" on employees;
drop policy if exists "Allow public update employees" on employees;
drop policy if exists "Allow public delete employees" on employees;

create policy "Allow public read settings"
  on settings for select
  using (true);

create policy "Allow public insert settings"
  on settings for insert
  with check (true);

create policy "Allow public update settings"
  on settings for update
  using (true);

create policy "Allow public read employees"
  on employees for select
  using (true);

create policy "Allow public insert employees"
  on employees for insert
  with check (true);

create policy "Allow public update employees"
  on employees for update
  using (true);

create policy "Allow public delete employees"
  on employees for delete
  using (true);
