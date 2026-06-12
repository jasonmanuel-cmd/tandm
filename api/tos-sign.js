/**
 * POST /api/tos-sign
 * Saves a signed ToS record to Supabase, sends confirmation email.
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 * For confirmation email: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (optional — skips if unset)
 */
import { createTransport } from 'nodemailer';
import { applySecurityHeaders, applyCors, ensureOrigin, enforceRateLimit, getClientIp } from './_lib/security.js';

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;
    return createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user, pass }
    });
}

function sendConfirmation(email, fullName, signedAt) {
    const tx = getTransporter();
    if (!tx) return;
    const dateStr = new Date(signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const text = `Hi ${fullName},\n\nThis confirms that you have signed the T&M Hauling Service Agreement on ${dateStr}.\n\nYou can download a PDF copy of your signed agreement at:\nhttps://tandmbak.com/sign.html\n\nTerms you agreed to:\n• Payment is required in full immediately upon project completion.\n• Customer warrants all materials are free of hazardous substances.\n• Customer is liable for fees related to undisclosed hazardous waste.\n• Customer consents to electronic payment processing if necessary.\n• T&M shall not be held liable for items removed in error.\n\n— The T&M Hauling Team`;
    tx.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'T&M Hauling — Service Agreement Signed',
        text
    }).catch(e => console.error('confirmation email error:', e.message));
}

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!ensureOrigin(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!enforceRateLimit(req, res, { prefix: 'tos-sign', limit: 5, windowMs: 60_000 })) return;

    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return res.status(400).json({ error: 'Invalid body' }); }

    const fullName = (body.fullName || '').trim().slice(0, 200);
    const email    = (body.email    || '').trim().slice(0, 200);
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });

    const sbUrl = process.env.SUPABASE_URL;
    const key   = process.env.SUPABASE_SERVICE_KEY;
    if (!sbUrl || !key) return res.status(503).json({ error: 'Storage not configured' });

    const ip        = getClientIp(req);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 300);

    try {
        let record;
        try {
            const r = await fetch(`${sbUrl}/rest/v1/tos_signatures`, {
                method: 'POST',
                headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
                body: JSON.stringify({ full_name: fullName, email, ip_address: ip, user_agent: userAgent })
            });
            if (!r.ok) throw new Error(await r.text());
            [record] = await r.json();
        } catch (innerErr) {
            if (email && innerErr.message && innerErr.message.includes('column')) {
                const r2 = await fetch(`${sbUrl}/rest/v1/tos_signatures`, {
                    method: 'POST',
                    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
                    body: JSON.stringify({ full_name: fullName, ip_address: ip, user_agent: userAgent })
                });
                if (!r2.ok) throw new Error(await r2.text());
                [record] = await r2.json();
            } else throw innerErr;
        }

        if (email) sendConfirmation(email, fullName, record.signed_at);

        return res.status(200).json({ ok: true, id: record.id, signed_at: record.signed_at });
    } catch (err) {
        console.error('tos-sign error:', err.message);
        return res.status(500).json({ error: 'Could not save signature' });
    }
}
