-- T&M Hauling — Phase 1: missed-call text-back + AI texting inbox
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists conversations (
    id bigserial primary key,
    phone text not null unique,
    name text,
    status text not null default 'new',            -- new | active | booked | closed | spam
    ai_enabled boolean not null default true,       -- false = human has taken over / opted out
    needs_human boolean not null default false,
    opted_out boolean not null default false,
    source text default 'sms',                      -- sms | missed_call
    owner_alerted_at timestamp with time zone,
    last_message_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

create table if not exists messages (
    id bigserial primary key,
    conversation_id bigint not null references conversations(id) on delete cascade,
    direction text not null,                        -- in | out
    sender text not null,                           -- customer | ai | human | system
    body text not null,
    media_urls text[] default '{}',
    twilio_sid text,
    created_at timestamp with time zone default now()
);

create table if not exists calls (
    id bigserial primary key,
    call_sid text unique,
    from_number text,
    status text,                                    -- Twilio DialCallStatus
    missed boolean not null default false,
    duration_sec integer,
    conversation_id bigint references conversations(id) on delete set null,
    created_at timestamp with time zone default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;
alter table calls enable row level security;

drop policy if exists "service_role_all_conversations" on conversations;
drop policy if exists "service_role_all_messages" on messages;
drop policy if exists "service_role_all_calls" on calls;
create policy "service_role_all_conversations" on conversations for all to service_role using (true) with check (true);
create policy "service_role_all_messages" on messages for all to service_role using (true) with check (true);
create policy "service_role_all_calls" on calls for all to service_role using (true) with check (true);

-- One row per Twilio SID so webhook retries can't double-process (NULLs stay allowed)
create unique index if not exists messages_twilio_sid_key on messages (twilio_sid);

-- Durable failed-login tracking for /api/admin-auth
create table if not exists auth_failures (
    id bigserial primary key,
    ip text not null,
    created_at timestamp with time zone default now()
);
alter table auth_failures enable row level security;
drop policy if exists "service_role_all_auth_failures" on auth_failures;
create policy "service_role_all_auth_failures" on auth_failures for all to service_role using (true) with check (true);
create index if not exists auth_failures_ip_idx on auth_failures (ip, created_at desc);
create index if not exists auth_failures_created_idx on auth_failures (created_at desc);

create index if not exists messages_conv_idx on messages (conversation_id, created_at);
create index if not exists conversations_last_idx on conversations (last_message_at desc);
create index if not exists calls_created_idx on calls (created_at desc);
