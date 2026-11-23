import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.OWNER_PHONE = '(661) 555-0100';
process.env.PUBLIC_BASE_URL = 'https://tandmbak.com';

const { validateSignature, normalizePhone, escapeXml } = await import('../api/_lib/twilio.js');
const { default: voiceIncoming } = await import('../api/voice-incoming.js');
const { default: smsIncoming } = await import('../api/sms-incoming.js');
const { default: inbox } = await import('../api/inbox.js');

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
const twilioReq = (path, params, sig) => ({
    method: 'POST', url: path, headers: { host: 'tandmbak.com', 'x-twilio-signature': sig ?? sign('https://tandmbak.com' + path, params) },
    body: params, socket: {}
});

test('normalizePhone handles common US formats', () => {
    assert.equal(normalizePhone('(661) 996-6950'), '+16619966950');
    assert.equal(normalizePhone('1-661-996-6950'), '+16619966950');
    assert.equal(normalizePhone('+16619966950'), '+16619966950');
    assert.equal(normalizePhone('abc'), '');
});

test('escapeXml escapes TwiML-sensitive characters', () => {
    assert.equal(escapeXml('T&M <Hauling>'), 'T&amp;M &lt;Hauling&gt;');
});

test('validateSignature accepts a correct signature and rejects a bad one', () => {
    const params = { From: '+16615550111', Body: 'hi' };
    assert.equal(validateSignature(twilioReq('/api/sms-incoming', params)), true);
    assert.equal(validateSignature(twilioReq('/api/sms-incoming', params, 'bogus')), false);
});

test('voice-incoming returns a Dial to the owner for a valid request', async () => {
    const res = makeRes();
    await voiceIncoming(twilioReq('/api/voice-incoming', { From: '+16615550111', CallSid: 'CA1' }), res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body, /<Dial timeout="20"/);
    assert.match(res.body, /<Number>\+16615550100<\/Number>/);
    assert.match(res.body, /api\/voice-status/);
});

test('voice-incoming and sms-incoming reject unsigned requests', async () => {
    for (const h of [voiceIncoming, smsIncoming]) {
        const res = makeRes();
        await h(twilioReq('/api/x', { From: '+1' }, 'bad'), res);
        assert.equal(res.statusCode, 403);
    }
});

test('inbox requires an admin token', async () => {
    const res = makeRes();
    await inbox({ method: 'GET', headers: { origin: 'https://tandmbak.com' }, query: { type: 'conversations' }, socket: {} }, res);
    assert.equal(res.statusCode, 401);
});
