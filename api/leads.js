/**
 * POST /api/leads
 * Saves a contact form lead to Supabase and sends auto-reply to customer.
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 * For auto-reply: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (optional — skips if unset)
 */
import { createTransport } from 'nodemailer';
import { applySecurityHeaders, applyCors, enforceRateLimit, ensureOrigin } from './_lib/security.js';

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

function sendAutoReply(email, name) {
    const tx = getTransporter();
    if (!tx) return;
    const text = `Hi ${name},\n\nThank you for contacting T&M Hauling! We have received your inquiry and will get back to you shortly.\n\nIf this is urgent, please call or text us at (661) 996-6951.\n\n— The T&M Hauling Team`;
    tx.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'T&M Hauling — We received your inquiry',
        text
    }).catch(e => console.error('auto-reply error:', e.message));
}

function sendAdminLeadNotification(name, email, phone, service, signature, signature_date) {
    const tx = getTransporter();
    if (!tx) return;
    const hasSig = signature && signature.trim().length > 0;
    const text = `New Lead — ${service}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n${hasSig ? `Signature: ${signature}\nDate: ${signature_date}\n` : ''}View in admin panel: https://tandmbak.com/tmhq.html`;
    tx.sendMail({
        from: process.env.SMTP_USER,
        to: 'tandmhaulingbak@gmail.com',
        subject: `T&M Hauling — New ${service} Lead${hasSig ? ' (Signed)' : ''}`,
        text
    }).catch(e => console.error('admin lead notification error:', e.message));
}

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!ensureOrigin(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!enforceRateLimit(req, res, { prefix: 'leads', limit: 6, windowMs: 60_000 })) return;

    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return res.status(400).json({ error: 'Invalid body' }); }

    console.log('leads API received:', { origin: req.headers.origin, bodyKeys: Object.keys(body) });

    const name    = (body.name    || '').trim().slice(0, 200);
    const email   = (body.email   || '').trim().slice(0, 200);
    const phone   = (body.phone   || '').trim().slice(0, 40);
    const message = (body.message || '').trim().slice(0, 2000);
    const service = (body.service || '').trim().slice(0, 100);
    const signature = (body.signature || '').trim().slice(0, 200);
    const signature_date = (body.signature_date || '').trim().slice(0, 20);
    const accept_terms = !!body.accept_terms;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const sbUrl = process.env.SUPABASE_URL;
    const key   = process.env.SUPABASE_SERVICE_KEY;
    if (!sbUrl || !key) return res.status(503).json({ error: 'Storage not configured' });

    const basePayload = { name, email, phone, message, service, source: 'contact_form' };
    const fullPayload = { ...basePayload, signature, signature_date, accept_terms };

    try {
        let saved = false;
        try {
            const r = await fetch(`${sbUrl}/rest/v1/leads`, {
                method: 'POST',
                headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                body: JSON.stringify(fullPayload)
            });
            if (!r.ok) throw new Error(await r.text());
            saved = true;
        } catch (innerErr) {
            if (innerErr.message && innerErr.message.includes('column')) {
                const r2 = await fetch(`${sbUrl}/rest/v1/leads`, {
                    method: 'POST',
                    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                    body: JSON.stringify(basePayload)
                });
                if (!r2.ok) throw new Error(await r2.text());
                saved = true;
            } else throw innerErr;
        }

        if (saved && email) sendAutoReply(email, name);
        if (saved && signature) sendAdminLeadNotification(name, email, phone, service, signature, signature_date);

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('leads save error:', err.message);
        return res.status(500).json({ error: 'Could not save lead' });
    }
}
