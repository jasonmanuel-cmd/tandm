/**
 * POST /api/leads
 * Saves a contact form lead to Supabase.
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */
import { applySecurityHeaders, applyCors, enforceRateLimit, ensureOrigin } from './_lib/security.js';

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

    const name    = (body.name    || '').trim().slice(0, 200);
    const email   = (body.email   || '').trim().slice(0, 200);
    const phone   = (body.phone   || '').trim().slice(0, 40);
    const message = (body.message || '').trim().slice(0, 2000);
    const service = (body.service || '').trim().slice(0, 100);

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const sbUrl = process.env.SUPABASE_URL;
    const key   = process.env.SUPABASE_SERVICE_KEY;
    if (!sbUrl || !key) return res.status(503).json({ error: 'Storage not configured' });

    try {
        const r = await fetch(`${sbUrl}/rest/v1/leads`, {
            method: 'POST',
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ name, email, phone, message, service, source: 'contact_form' })
        });
        if (!r.ok) throw new Error(await r.text());
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('leads save error:', err.message);
        return res.status(500).json({ error: 'Could not save lead' });
    }
}
