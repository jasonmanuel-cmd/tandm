import crypto from 'crypto';

export function baseUrl(req) {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `https://${host}`;
}

function formParams(req) {
    if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));
    return req.body || {};
}

/** Verifies the X-Twilio-Signature header (HMAC-SHA1 of URL + sorted params). */
export function validateSignature(req) {
    const token = process.env.TWILIO_AUTH_TOKEN;
    const sig = req.headers['x-twilio-signature'];
    if (!token || !sig) return false;
    const params = formParams(req);
    const data = baseUrl(req) + req.url + Object.keys(params).sort().map((k) => k + params[k]).join('');
    const expected = crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf8')).digest('base64');
    const a = Buffer.from(String(sig));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function getParams(req) {
    return formParams(req);
}

export function escapeXml(s = '') {
    return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

export function sendTwiml(res, inner = '') {
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`);
}

// NANP only: area and exchange codes start 2-9; 900 is premium-rate.
const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;
const BLOCKED_AREA_CODES = new Set(['900']);

/**
 * Normalises a US number to E.164 (+1XXXXXXXXXX). Returns '' for anything else
 * (international, premium-rate, malformed) so we never text a number we shouldn't.
 */
export function normalizePhone(raw = '') {
    const digits = String(raw).replace(/\D/g, '');
    let e164 = '';
    if (digits.length === 10) e164 = `+1${digits}`;
    else if (digits.length === 11 && digits.startsWith('1')) e164 = `+${digits}`;
    if (!US_E164.test(e164)) return '';
    return BLOCKED_AREA_CODES.has(e164.slice(2, 5)) ? '' : e164;
}

export async function sendSms(to, body) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) throw new Error('TWILIO_UNCONFIGURED');
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1500) })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || `Twilio ${r.status}`);
    return j.sid;
}
