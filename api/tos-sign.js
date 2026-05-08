/**
 * POST /api/tos-sign
 * Saves a signed ToS record to Supabase.
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */
import { applySecurityHeaders, applyCors, enforceRateLimit, getClientIp } from './_lib/security.js';

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!enforceRateLimit(req, res, { prefix: 'tos-sign', limit: 5, windowMs: 60_000 })) return;

    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return res.status(400).json({ error: 'Invalid body' }); }

    const fullName = (body.fullName || '').trim().slice(0, 200);
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });

    const sbUrl = process.env.SUPABASE_URL;
    const key   = process.env.SUPABASE_SERVICE_KEY;
    if (!sbUrl || !key) return res.status(503).json({ error: 'Storage not configured' });

    const ip        = getClientIp(req);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 300);

    try {
        const r = await fetch(`${sbUrl}/rest/v1/tos_signatures`, {
            method: 'POST',
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            body: JSON.stringify({ full_name: fullName, ip_address: ip, user_agent: userAgent })
        });
        if (!r.ok) throw new Error(await r.text());
        const [record] = await r.json();
        return res.status(200).json({ ok: true, id: record.id, signed_at: record.signed_at });
    } catch (err) {
        console.error('tos-sign error:', err.message);
        return res.status(500).json({ error: 'Could not save signature' });
    }
}
