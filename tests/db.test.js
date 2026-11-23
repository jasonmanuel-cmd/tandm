import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

// Runs the real SQL in api/_lib/db.js against an in-memory Postgres (no network, no real data).
const pg = new PGlite();
const db = await import('../api/_lib/db.js');

before(() => db.__setClient(async (text, params = []) => (await pg.query(text, params)).rows, { schema: true }));
after(async () => { db.__setClient(null); await pg.close(); });

test('schema creates and leads round-trip, including a signature date', async () => {
    await db.insertLead({ name: 'Maria Lopez', email: 'm@example.com', phone: '(661) 555-0142', message: 'ADDRESS: 1 Main St', service: 'Free Estimate', source: 'contact_form', signature: 'Maria Lopez', signature_date: '2026-10-27', accept_terms: true });
    await db.insertLead({ name: 'No Date', signature_date: '' });
    const rows = await db.listLeads(10);
    assert.equal(rows.length, 2);
    const maria = rows.find((r) => r.name === 'Maria Lopez');
    assert.equal(maria.accept_terms, true);
    const [stored] = await db.query("select signature_date::text as d from leads where name = 'Maria Lopez'");
    assert.equal(stored.d, '2026-10-27');
    assert.equal(rows.find((r) => r.name === 'No Date').signature_date, null);
});

test('signatures and photos round-trip', async () => {
    const sig = await db.insertSignature({ fullName: 'Jane Doe', email: 'j@example.com', ip: '1.2.3.4', userAgent: 'test' });
    assert.ok(sig.id && sig.signed_at);
    assert.equal((await db.listSignatures(5))[0].full_name, 'Jane Doe');
    const photo = await db.insertPhoto({ label: 'Smith garage - Before', description: 'Before', filename: 'a.jpg', storage_path: 'a.jpg', public_url: 'https://blob.example/a.jpg', mime_type: 'image/jpeg', file_size: 1234 });
    assert.ok(photo.id);
    assert.equal((await db.listPhotos(5))[0].public_url, 'https://blob.example/a.jpg');
});

test('conversations: upsert is stable, patches apply, messages dedupe by Twilio SID', async () => {
    const a = await db.upsertConversation('+16615550111', { source: 'missed_call' });
    const b = await db.upsertConversation('+16615550111');
    assert.equal(a.id, b.id, 'same phone → same conversation');
    assert.equal(b.source, 'missed_call', 'source kept from first contact');

    await db.updateConversation(a.id, { needs_human: true, status: 'active', bogus: 'ignored' });
    const c = await db.getConversation(a.id);
    assert.equal(c.needs_human, true);
    assert.equal(c.status, 'active');

    assert.equal(await db.addMessageOnce(a.id, 'in', 'customer', 'hello', { twilio_sid: 'SM1', media_urls: ['https://x/1.jpg'] }), true);
    assert.equal(await db.addMessageOnce(a.id, 'in', 'customer', 'hello', { twilio_sid: 'SM1' }), false, 'retry ignored');
    await db.addMessage(a.id, 'out', 'ai', 'hi there', { twilio_sid: 'SM2' });
    await db.addMessage(a.id, 'out', 'system', 'text-back');

    const thread = await db.listMessages(a.id);
    assert.deepEqual(thread.map((m) => m.sender), ['customer', 'ai', 'system']);
    assert.deepEqual(thread[0].media_urls, ['https://x/1.jpg']);
    const recent = await db.recentMessages(a.id, 2);
    assert.deepEqual(recent.map((m) => m.sender), ['ai', 'system'], 'newest two, oldest first');
    assert.equal(await db.hasRecentOutbound(a.id, 10), true);
});

test('spending and login counters', async () => {
    const conv = await db.upsertConversation('+16615550222');
    await db.addMessage(conv.id, 'out', 'ai', 'one');
    await db.addMessage(conv.id, 'out', 'human', 'not counted');
    const since = new Date(Date.now() - 864e5).toISOString();
    assert.equal(await db.countAutoOut(since, conv.id), 1);
    assert.ok((await db.countAutoOut(since)) >= 3, 'account-wide count includes other threads');

    await db.recordAuthFailureRow('9.9.9.9'); await db.recordAuthFailureRow('9.9.9.9'); await db.recordAuthFailureRow('8.8.8.8');
    assert.equal(await db.countAuthFailures(since, '9.9.9.9'), 2);
    assert.equal(await db.countAuthFailures(since), 3);
});

test('calls upsert by call SID', async () => {
    const conv = await db.upsertConversation('+16615550333');
    await db.upsertCall({ call_sid: 'CA1', from_number: '+16615550333', status: 'no-answer', missed: true, conversation_id: conv.id });
    await db.upsertCall({ call_sid: 'CA1', from_number: '+16615550333', status: 'no-answer', missed: true, duration_sec: 0 });
    const calls = await db.listCalls(10);
    assert.equal(calls.filter((c) => c.call_sid === 'CA1').length, 1);
    assert.equal(calls.find((c) => c.call_sid === 'CA1').conversation_id, conv.id, 'conversation link kept');
});
