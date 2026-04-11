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

