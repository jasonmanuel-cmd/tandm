/**
 * Database layer (Neon Postgres via @neondatabase/serverless).
 * Tables are created on first use (idempotent), so there is no separate setup step.
 * Env: DATABASE_URL (set by the Vercel Neon integration; POSTGRES_URL also accepted).
 */
import { neon } from '@neondatabase/serverless';

let runQuery = null;      // (text, params) => Promise<rows[]>
let schemaReady = null;

/** Test hook: inject a query runner. Schema creation is skipped unless { schema: true } (real-SQL tests). */
export function __setClient(fn, opts = {}) {
    runQuery = fn;
    schemaReady = fn && !opts.schema ? Promise.resolve() : null;
}

function client() {
    if (runQuery) return runQuery;
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DB_UNCONFIGURED');
    const sql = neon(url);
    runQuery = (text, params = []) => sql.query(text, params);
    return runQuery;
}

const SCHEMA = [
    `create table if not exists leads (
        id bigserial primary key,
        created_at timestamptz not null default now(),
        name text not null,
        email text,
        phone text,
        message text,
        service text,
        source text default 'contact_form',
        signature text,
        signature_date date,
        accept_terms boolean
    )`,
    `create index if not exists leads_created_at_idx on leads (created_at desc)`,
    `create table if not exists tos_signatures (
        id bigserial primary key,
        signed_at timestamptz not null default now(),
        full_name text not null,
        email text,
        ip_address text,
        user_agent text
    )`,
    `create index if not exists tos_signatures_signed_at_idx on tos_signatures (signed_at desc)`,
    `create table if not exists photo_uploads (
        id bigserial primary key,
        created_at timestamptz not null default now(),
        label text not null,
        description text default '',
        filename text,
        storage_path text,
        public_url text,
        mime_type text,
        file_size integer,
        status text default 'pending'
    )`,
    `create table if not exists conversations (
        id bigserial primary key,
        phone text not null unique,
        name text,
        status text not null default 'new',
        ai_enabled boolean not null default true,
        needs_human boolean not null default false,
        opted_out boolean not null default false,
        source text default 'sms',
        owner_alerted_at timestamptz,
        last_message_at timestamptz default now(),
        created_at timestamptz default now()
    )`,
    `create index if not exists conversations_last_idx on conversations (last_message_at desc)`,
    `create table if not exists messages (
        id bigserial primary key,
        conversation_id bigint not null references conversations(id) on delete cascade,
        direction text not null,
        sender text not null,
        body text not null,
        media_urls text[] default '{}',
        twilio_sid text,
        created_at timestamptz default now()
    )`,
    `create unique index if not exists messages_twilio_sid_key on messages (twilio_sid)`,
    `create index if not exists messages_conv_idx on messages (conversation_id, created_at)`,
    `create table if not exists calls (
        id bigserial primary key,
        call_sid text unique,
        from_number text,
        status text,
        missed boolean not null default false,
        duration_sec integer,
        conversation_id bigint references conversations(id) on delete set null,
        created_at timestamptz default now()
    )`,
    `create index if not exists calls_created_idx on calls (created_at desc)`,
    `create table if not exists auth_failures (
        id bigserial primary key,
        ip text not null,
        created_at timestamptz default now()
    )`,
    `create index if not exists auth_failures_ip_idx on auth_failures (ip, created_at desc)`,
    `create index if not exists auth_failures_created_idx on auth_failures (created_at desc)`
];

async function ensureSchema() {
    if (!schemaReady) {
        const run = client();
        schemaReady = (async () => { for (const stmt of SCHEMA) await run(stmt, []); })().catch((e) => { schemaReady = null; throw e; });
    }
    return schemaReady;
}

/** Runs a parameterised query and returns the rows. */
export async function query(text, params = []) {
    const run = client();
    await ensureSchema();
    return run(text, params);
}

const first = (rows) => (rows && rows[0]) || null;
const count = (rows) => Number(first(rows)?.n) || 0;

/* ---------- leads, signatures, photos ---------- */
export async function insertLead(l) {
    return first(await query(
        `insert into leads (name, email, phone, message, service, source, signature, signature_date, accept_terms)
         values ($1,$2,$3,$4,$5,$6,$7,nullif($8,'')::date,$9) returning id`,
        [l.name, l.email || null, l.phone || null, l.message || null, l.service || null, l.source || 'contact_form', l.signature || null, l.signature_date || '', !!l.accept_terms]
    ));
}
export const listLeads = (limit = 200) => query('select * from leads order by created_at desc limit $1', [limit]);

export async function insertSignature(s) {
    return first(await query(
        'insert into tos_signatures (full_name, email, ip_address, user_agent) values ($1,$2,$3,$4) returning id, signed_at',
        [s.fullName, s.email || null, s.ip || null, s.userAgent || null]
    ));
}
export const listSignatures = (limit = 200) => query('select * from tos_signatures order by signed_at desc limit $1', [limit]);

export async function insertPhoto(p) {
    return first(await query(
        `insert into photo_uploads (label, description, filename, storage_path, public_url, mime_type, file_size, status)
         values ($1,$2,$3,$4,$5,$6,$7,'pending') returning id`,
        [p.label, p.description || '', p.filename, p.storage_path, p.public_url, p.mime_type, p.file_size]
    ));
}
export const listPhotos = (limit = 200) => query('select * from photo_uploads order by created_at desc limit $1', [limit]);

/* ---------- phone system ---------- */
export async function upsertConversation(phone, fields = {}) {
    return first(await query(
        `insert into conversations (phone, source, last_message_at) values ($1, coalesce($2,'sms'), now())
         on conflict (phone) do update set last_message_at = now() returning *`,
        [phone, fields.source || null]
    ));
}

const CONV_COLUMNS = new Set(['name', 'status', 'ai_enabled', 'needs_human', 'opted_out', 'owner_alerted_at', 'last_message_at']);
export async function updateConversation(id, patch) {
    const keys = Object.keys(patch).filter((k) => CONV_COLUMNS.has(k));
    if (!keys.length) return;
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    await query(`update conversations set ${sets} where id = $1`, [id, ...keys.map((k) => patch[k])]);
}
export const getConversation = async (id) => first(await query('select * from conversations where id = $1', [id]));
export const listConversations = (limit = 200) => query('select * from conversations order by last_message_at desc limit $1', [limit]);

export async function addMessage(conversation_id, direction, sender, body, extra = {}) {
    await query(
        'insert into messages (conversation_id, direction, sender, body, media_urls, twilio_sid) values ($1,$2,$3,$4,$5,$6)',
        [conversation_id, direction, sender, body, extra.media_urls || [], extra.twilio_sid || null]
    );
}
/** Inserts once per Twilio SID. Returns false when that SID was already stored (a webhook retry). */
export async function addMessageOnce(conversation_id, direction, sender, body, extra = {}) {
    const rows = await query(
        `insert into messages (conversation_id, direction, sender, body, media_urls, twilio_sid)
         values ($1,$2,$3,$4,$5,$6) on conflict (twilio_sid) do nothing returning id`,
        [conversation_id, direction, sender, body, extra.media_urls || [], extra.twilio_sid || null]
    );
    return rows.length > 0;
}
export const recentMessages = (conversation_id, limit = 20) =>
    query('select sender, body from (select sender, body, created_at from messages where conversation_id = $1 order by created_at desc limit $2) t order by created_at asc', [conversation_id, limit]);
export const listMessages = (conversation_id, limit = 500) =>
    query('select * from messages where conversation_id = $1 order by created_at asc limit $2', [conversation_id, limit]);
export async function hasRecentOutbound(conversation_id, minutes) {
    const rows = await query(
        `select 1 as n from messages where conversation_id = $1 and direction = 'out' and created_at >= now() - ($2 || ' minutes')::interval limit 1`,
        [conversation_id, String(minutes)]
    );
    return rows.length > 0;
}

export async function upsertCall(c) {
    await query(
        `insert into calls (call_sid, from_number, status, missed, duration_sec, conversation_id)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (call_sid) do update set status = excluded.status, missed = excluded.missed,
           duration_sec = excluded.duration_sec, conversation_id = coalesce(excluded.conversation_id, calls.conversation_id)`,
        [c.call_sid || null, c.from_number || null, c.status || null, !!c.missed, c.duration_sec || null, c.conversation_id || null]
    );
}
export const listCalls = (limit = 100) => query('select * from calls order by created_at desc limit $1', [limit]);

/* ---------- spending + login guards ---------- */
/** Automated outbound texts (AI replies and missed-call text-backs) since a time; one thread or all. */
export async function countAutoOut(sinceIso, conversationId = null) {
    const rows = conversationId
        ? await query(`select count(*) as n from messages where direction = 'out' and sender in ('ai','system') and created_at >= $1 and conversation_id = $2`, [sinceIso, conversationId])
        : await query(`select count(*) as n from messages where direction = 'out' and sender in ('ai','system') and created_at >= $1`, [sinceIso]);
    return count(rows);
}
export async function countAuthFailures(sinceIso, ip = null) {
    const rows = ip
        ? await query('select count(*) as n from auth_failures where created_at >= $1 and ip = $2', [sinceIso, ip])
        : await query('select count(*) as n from auth_failures where created_at >= $1', [sinceIso]);
    return count(rows);
}
export const recordAuthFailureRow = (ip) => query('insert into auth_failures (ip) values ($1)', [ip]);
