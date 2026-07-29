-- Supabase schema for T&M Hauling
-- Run this in Supabase SQL Editor

-- 1. LEADS table (contact form submissions)
create table if not exists leads (
    id bigserial primary key,
    created_at timestamp with time zone default now(),
    name text not null,
    email text,
    phone text,
    message text,
    service text,
    source text default 'contact_form',
    -- signature fields (added later)
    signature text,
    signature_date date,
    accept_terms boolean
);

-- 2. TOS_SIGNATURES table (ToS signing page)
create table if not exists tos_signatures (
    id bigserial primary key,
    signed_at timestamp with time zone default now(),
    full_name text not null,
    ip_address text,
    user_agent text,
    -- email field (added later)
    email text
);

-- 3. Enable Row Level Security (optional but recommended)
alter table leads enable row level security;
alter table tos_signatures enable row level security;

-- 4. Policies: allow service role (serverless API) full access
create policy "service_role_all_leads" on leads
    for all to service_role using (true) with check (true);

create policy "service_role_all_tos_signatures" on tos_signatures
    for all to service_role using (true) with check (true);

-- 5. Indexes for admin panel queries
create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists tos_signatures_signed_at_idx on tos_signatures (signed_at desc);

-- 6. PHOTO_UPLOADS table (owner photo uploads for gallery)
create table if not exists photo_uploads (
    id bigserial primary key,
    created_at timestamp with time zone default now(),
    label text not null,
    description text default '',
    filename text,
    storage_path text not null,
    public_url text,
    mime_type text,
    file_size integer,
    status text default 'pending'
);

alter table photo_uploads enable row level security;

create policy "service_role_all_photo_uploads" on photo_uploads
    for all to service_role using (true) with check (true);

create index if not exists photo_uploads_created_at_idx on photo_uploads (created_at desc);

-- 7. Grants for service role
grant all on leads to service_role;
grant all on tos_signatures to service_role;
grant all on photo_uploads to service_role;
grant usage, select on all sequences in schema public to service_role;