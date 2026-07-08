-- Settings table (only ever 1 row)
create table settings (
  id uuid default gen_random_uuid() primary key,
  company_name text,
  address text,
  email text,
  phone text,
  website text,
  signatory_name text,
  signatory_designation text,
  logo_url text,
  signature_url text,
  document_font text default 'arial',
  document_font_size int default 100,
  payslip_custom_fields jsonb default '[]'::jsonb,
  created_at timestamp default now()
);

-- If settings already exists, run in Supabase SQL editor:
-- alter table settings add column if not exists payslip_custom_fields jsonb default '[]'::jsonb;
-- alter table settings add column if not exists document_font text default 'arial';
-- alter table settings add column if not exists document_font_size int default 100;

-- Employees table
create table employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  employee_id text unique not null,
  designation text,
  department text,
  joining_date date,
  email text,
  phone text,
  bank_name text,
  bank_account text,
  pan_number text,
  pf_number text,
  uan text,
  gross_salary numeric(12,2) not null default 0,
  payment_mode text default 'Bank Transfer',
  created_at timestamp default now()
);

-- Storage bucket: create "company-assets" as public in Supabase Dashboard
-- Policies: allow public read, authenticated/anon upload as per your project setup

-- Row Level Security (required for browser-side Supabase access)
alter table settings enable row level security;
alter table employees enable row level security;

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
