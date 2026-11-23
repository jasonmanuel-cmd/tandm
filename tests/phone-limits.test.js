import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_PHONE_NUMBER = '+16615550199';
process.env.OWNER_PHONE = '(661) 555-0100';
process.env.PUBLIC_BASE_URL = 'https://tandmbak.com';
process.env.ADMIN_PASSWORD = 'correct horse battery staple';

const { normalizePhone } = await import('../api/_lib/twilio.js');
const { __setClient } = await import('../api/_lib/db.js');
const { default: smsIncoming } = await import('../api/sms-incoming.js');
const { default: voiceStatus, TEXT_BACK } = await import('../api/voice-status.js');
const { default: adminAuth } = await import('../api/admin-auth.js');

const realFetch = globalThis.fetch;

function sign(url, params) {
    const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
    return crypto.createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(data).digest('base64');
}
function makeRes() {
    return {
        statusCode: 200, headers: {}, body: null,
        setHeader(k, v) { this.headers[k] = v; },
        status(c) { this.statusCode = c; return this; },
        json(p) { this.body = p; return this; },
        send(p) { this.body = p; return this; },
        end() { return this; }
    };
}
const twilioReq = (path, params) => ({
    method: 'POST', url: path, headers: { host: 'tandmbak.com', 'x-twilio-signature': sign('https://tandmbak.com' + path, params) },
    body: params, socket: {}
});
const conv = (over = {}) => ({ id: 7, phone: '+16615550111', ai_enabled: true, opted_out: false, needs_human: false, owner_alerted_at: '2026-10-01T00:00:00Z', ...over });

/** A fake database: routes are [regex, handler(params) → rows]; every query is recorded. */
function fakeDb(routes) {
    const calls = [];
    __setClient(async (text, params = []) => {
        calls.push({ text: text.replace(/\s+/g, ' ').trim(), params });
        for (const [re, fn] of routes) if (re.test(text)) return fn(params, text);
        return [];
    });
    return calls;
}
/** Records outbound HTTP (Twilio SMS, Anthropic) and answers 200. */
function mockHttp() {
    const calls = [];
    globalThis.fetch = async (url, init = {}) => {
        calls.push({ url: String(url), body: String(init.body || '') });
        return new Response(JSON.stringify({ sid: 'SMfake' }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    return calls;
}
function reset() {
    globalThis.fetch = realFetch;
    __setClient(null);
    delete process.env.DATABASE_URL;
}

test('normalizePhone only accepts US numbers', () => {
    assert.equal(normalizePhone('+447700900123'), '', 'UK number rejected');
    assert.equal(normalizePhone('+5215512345678'), '', 'Mexico number rejected');
    assert.equal(normalizePhone('(900) 555-0100'), '', 'premium 900 rejected');
    assert.equal(normalizePhone('(661) 555-0100'), '+16615550100');
    assert.equal(normalizePhone('+1 661 555 0100'), '+16615550100');
    assert.equal(normalizePhone('1234567890'), '', 'area code cannot start with 1');
});

test('inbound text from a non-US number is ignored with no database or SMS calls', async () => {
    const db = fakeDb([]); const http = mockHttp();
    try {
        const res = makeRes();
        await smsIncoming(twilioReq('/api/sms-incoming', { From: '+447700900123', Body: 'hi', MessageSid: 'SM1' }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(db.length, 0);
        assert.equal(http.length, 0);
    } finally { reset(); }
});

test('a retried Twilio webhook (duplicate MessageSid) does not trigger a second reply', async () => {
    const db = fakeDb([
        [/insert into conversations/, () => [conv()]],
        [/insert into messages/, () => []]            // conflict → nothing inserted → already handled
    ]);
    const http = mockHttp();
    try {
        const res = makeRes();
        await smsIncoming(twilioReq('/api/sms-incoming', { From: '+16615550111', Body: 'hello', MessageSid: 'SMdup' }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(http.length, 0, 'no SMS or AI call');
        assert.equal(db.some((c) => /count\(\*\)/.test(c.text)), false, 'stopped before the spending check');
    } finally { reset(); }
});

test('AI replies pause and the owner is alerted once when a thread hits its daily cap', async () => {
    const db = fakeDb([
        [/insert into conversations/, () => [conv()]],
        [/insert into messages/, () => [{ id: 1 }]],
        [/count\(\*\) as n from messages/, () => [{ n: 20 }]]   // at the per-thread limit
    ]);
    const http = mockHttp();
    try {
        const res = makeRes();
        await smsIncoming(twilioReq('/api/sms-incoming', { From: '+16615550111', Body: 'again', MessageSid: 'SM2' }), res);
        assert.equal(http.some((c) => c.url.includes('api.anthropic.com')), false, 'no AI call');
        const sms = http.filter((c) => c.url.includes('api.twilio.com'));
        assert.equal(sms.length, 1, 'only the owner alert is sent');
        assert.match(sms[0].body, /%2B16615550100|\+16615550100/);
        assert.ok(db.some((c) => /update conversations set needs_human/.test(c.text)), 'thread flagged for a human');
    } finally { reset(); }
});

test('missed-call text-back is skipped once the account-wide daily cap is reached', async () => {
    fakeDb([
        [/insert into conversations/, () => [conv()]],
        [/select 1 as n from messages/, () => []],              // nothing sent in the last 10 minutes
        [/count\(\*\) as n from messages/, () => [{ n: 300 }]]  // at the global limit
    ]);
    const http = mockHttp();
    try {
        const res = makeRes();
        await voiceStatus(twilioReq('/api/voice-status', { From: '+16615550111', DialCallStatus: 'no-answer', CallSid: 'CA9' }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(http.length, 0, 'no text-back sent');
    } finally { reset(); }
});

test('missed-call text-back is sent and logged when under the caps', async () => {
    const db = fakeDb([
        [/insert into conversations/, () => [conv()]],
        [/select 1 as n from messages/, () => []],
        [/count\(\*\) as n from messages/, () => [{ n: 0 }]]
    ]);
    const http = mockHttp();
    try {
        const res = makeRes();
        await voiceStatus(twilioReq('/api/voice-status', { From: '+16615550111', DialCallStatus: 'no-answer', CallSid: 'CA10' }), res);
        const sms = http.filter((c) => c.url.includes('api.twilio.com'));
        assert.equal(sms.length, 1);
        assert.ok(db.some((c) => /insert into calls/.test(c.text)), 'call logged');
        assert.ok(db.some((c) => /insert into messages/.test(c.text) && c.params.includes('system')), 'text-back logged');
    } finally { reset(); }
});

test('missed-call text-back includes STOP opt-out language', () => {
    assert.match(TEXT_BACK, /Reply STOP to opt out/);
});

const loginReq = (password) => ({
    method: 'POST', headers: { origin: 'https://tandmbak.com', 'x-forwarded-for': '203.0.113.9' }, body: { password }, socket: {}
});

test('admin-auth returns 429 after repeated failures recorded in the database', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    const db = fakeDb([[/count\(\*\) as n from auth_failures/, () => [{ n: 8 }]]]);
    try {
        const res = makeRes();
        await adminAuth(loginReq('anything'), res);
        assert.equal(res.statusCode, 429);
        assert.equal(res.headers['Retry-After'], '900');
        assert.equal(db.some((c) => /insert into auth_failures/.test(c.text)), false);
    } finally { reset(); }
});

test('admin-auth records a failed attempt and still returns 401 for a wrong password', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    const db = fakeDb([[/count\(\*\) as n from auth_failures/, () => [{ n: 0 }]]]);
    try {
        const res = makeRes();
        await adminAuth(loginReq('wrong'), res);
        assert.equal(res.statusCode, 401);
        assert.ok(db.some((c) => /insert into auth_failures/.test(c.text)), 'failure recorded');
    } finally { reset(); }
});

test('admin-auth fails open (normal login path) when the database is unreachable', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    __setClient(async () => { throw new Error('network down'); });
    try {
        const res = makeRes();
        await adminAuth(loginReq(process.env.ADMIN_PASSWORD), res);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body.token);
    } finally { reset(); }
});
