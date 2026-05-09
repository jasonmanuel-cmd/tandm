import test from 'node:test';
import assert from 'node:assert/strict';

import chatHandler from '../api/chat.js';
import checkoutHandler from '../api/create-checkout-session.js';
import healthHandler from '../api/health.js';

function makeRes() {
    return {
        statusCode: 200,
        headers: {},
        body: null,
        ended: false,
        setHeader(key, value) {
            this.headers[key] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        end() {
            this.ended = true;
            return this;
        }
    };
}

test('health endpoint returns ok payload', async () => {
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com' }, socket: {} };
    const res = makeRes();
    await healthHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
});

test('chat rejects disallowed origin', async () => {
    const req = {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
        socket: {},
        body: { message: 'hello', history: [] }
    };
    const res = makeRes();
    await chatHandler(req, res);
    assert.equal(res.statusCode, 403);
});

test('chat validates missing message', async () => {
    const req = {
        method: 'POST',
        headers: { origin: 'https://tandmbak.com' },
        socket: {},
        body: { message: '', history: [] }
    };
    const res = makeRes();
    await chatHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Message is required');
});

test('checkout returns unavailable when Stripe is unconfigured', async () => {
    const req = {
        method: 'POST',
        headers: { origin: 'https://tandmbak.com' },
        socket: {},
        body: { email: 'not-an-email' }
    };
    const res = makeRes();
    await checkoutHandler(req, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'STRIPE_MISSING');
});

// ── admin-auth ────────────────────────────────────────────────────────────────
import adminAuthHandler from '../api/admin-auth.js';

test('admin-auth: 503 when ADMIN_PASSWORD not set', async () => {
    delete process.env.ADMIN_PASSWORD;
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { password: 'any' } };
    const res = makeRes();
    await adminAuthHandler(req, res);
    assert.equal(res.statusCode, 503);
});

test('admin-auth: 403 for disallowed origin', async () => {
    process.env.ADMIN_PASSWORD = 'secret';
    const req = { method: 'POST', headers: { origin: 'https://evil.example' }, socket: {}, body: { password: 'secret' } };
    const res = makeRes();
    await adminAuthHandler(req, res);
    assert.equal(res.statusCode, 403);
});

test('admin-auth: 401 for wrong password', async () => {
    process.env.ADMIN_PASSWORD = 'correct';
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { password: 'wrong' } };
    const res = makeRes();
    await adminAuthHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Invalid password');
});

test('admin-auth: 400 when password field missing', async () => {
    process.env.ADMIN_PASSWORD = 'correct';
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: {} };
    const res = makeRes();
    await adminAuthHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Password required');
});

test('admin-auth: 200 with token on correct password', async () => {
    process.env.ADMIN_PASSWORD = 'correct';
    process.env.ADMIN_SECRET = 'test-signing-secret';
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { password: 'correct' } };
    const res = makeRes();
    await adminAuthHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(typeof res.body.token === 'string');
    assert.ok(res.body.token.includes('.'));
});

// ── admin-data ────────────────────────────────────────────────────────────────
import adminDataHandler from '../api/admin-data.js';
import crypto from 'node:crypto';

function makeAdminToken() {
    const ts = Date.now().toString();
    const hmac = crypto.createHmac('sha256', 'test-signing-secret').update(ts).digest('hex');
    return `${ts}.${hmac}`;
}

test('admin-data: 401 with no token', async () => {
    process.env.ADMIN_SECRET = 'test-signing-secret';
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com' }, socket: {}, query: { type: 'leads' } };
    const res = makeRes();
    await adminDataHandler(req, res);
    assert.equal(res.statusCode, 401);
});

test('admin-data: 401 with invalid token', async () => {
    process.env.ADMIN_SECRET = 'test-signing-secret';
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com', authorization: 'Bearer bad.token' }, socket: {}, query: { type: 'leads' } };
    const res = makeRes();
    await adminDataHandler(req, res);
    assert.equal(res.statusCode, 401);
});

test('admin-data: 400 for invalid type', async () => {
    process.env.ADMIN_SECRET = 'test-signing-secret';
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com', authorization: `Bearer ${makeAdminToken()}` }, socket: {}, query: { type: 'nope' } };
    const res = makeRes();
    await adminDataHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid type');
});

test('admin-data: 503 when Supabase unconfigured', async () => {
    process.env.ADMIN_SECRET = 'test-signing-secret';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com', authorization: `Bearer ${makeAdminToken()}` }, socket: {}, query: { type: 'leads' } };
    const res = makeRes();
    await adminDataHandler(req, res);
    assert.equal(res.statusCode, 503);
});

test('admin-data: bookings returns empty array when Stripe not configured', async () => {
    process.env.ADMIN_SECRET = 'test-signing-secret';
    delete process.env.STRIPE_SECRET_KEY;
    const req = { method: 'GET', headers: { origin: 'https://tandmbak.com', authorization: `Bearer ${makeAdminToken()}` }, socket: {}, query: { type: 'bookings' } };
    const res = makeRes();
    await adminDataHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, []);
});

// ── leads ─────────────────────────────────────────────────────────────────────
import leadsHandler from '../api/leads.js';

test('leads: 403 for disallowed origin', async () => {
    const req = { method: 'POST', headers: { origin: 'https://evil.example' }, socket: {}, body: { name: 'Test' } };
    const res = makeRes();
    await leadsHandler(req, res);
    assert.equal(res.statusCode, 403);
});

test('leads: 400 when name missing', async () => {
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { email: 'x@x.com' } };
    const res = makeRes();
    await leadsHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Name is required');
});

test('leads: 503 when Supabase unconfigured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { name: 'Jane Doe' } };
    const res = makeRes();
    await leadsHandler(req, res);
    assert.equal(res.statusCode, 503);
});

// ── tos-sign ──────────────────────────────────────────────────────────────────
import tosSignHandler from '../api/tos-sign.js';

test('tos-sign: 403 for disallowed origin', async () => {
    const req = { method: 'POST', headers: { origin: 'https://evil.example' }, socket: {}, body: { fullName: 'Jane Doe' } };
    const res = makeRes();
    await tosSignHandler(req, res);
    assert.equal(res.statusCode, 403);
});

test('tos-sign: 400 when fullName missing', async () => {
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: {} };
    const res = makeRes();
    await tosSignHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Full name is required');
});

test('tos-sign: 503 when Supabase unconfigured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    const req = { method: 'POST', headers: { origin: 'https://tandmbak.com' }, socket: {}, body: { fullName: 'Jane Doe' } };
    const res = makeRes();
    await tosSignHandler(req, res);
    assert.equal(res.statusCode, 503);
});
