-- Run this in Supabase: SQL Editor -> New Query -> Run all
--
-- All writes go through the Vercel API using the service_role key.
-- No public-insert policies needed — rate limiting is enforced at the API layer.

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

-- Enable Row Level Security on both tables
alter table leads          enable row level security;
alter table tos_signatures enable row level security;

-- Only the service_role (your Vercel API) can read or write
create policy "service_role_leads"
  on leads for all to service_role using (true) with check (true);

create policy "service_role_tos"
  on tos_signatures for all to service_role using (true) with check (true);
