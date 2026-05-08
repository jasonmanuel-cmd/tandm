-- Run this in Supabase: SQL Editor -> New Query -> Run all

-- Leads table (contact form submissions)
create table if not exists leads (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name       text        not null,
  email      text,
  phone      text,
  message    text,
  service    text,
  source     text        default 'contact_form'
);

-- ToS Signatures
create table if not exists tos_signatures (
  id         uuid        default gen_random_uuid() primary key,
  signed_at  timestamptz default now(),
  full_name  text        not null,
  ip_address text,
  user_agent text
);

-- Enable Row Level Security
alter table leads          enable row level security;
alter table tos_signatures enable row level security;

-- Service role (your API) can do everything
create policy "service_role_leads"
  on leads for all to service_role using (true) with check (true);

create policy "service_role_tos"
  on tos_signatures for all to service_role using (true) with check (true);

-- Public can insert (API handles rate limiting)
create policy "public_insert_leads"
  on leads for insert with check (true);

create policy "public_insert_tos"
  on tos_signatures for insert with check (true);
