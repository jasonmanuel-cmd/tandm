/**
 * GET /api/test-supabase
 * Debug endpoint to verify Supabase connection and env vars
 */
import { applySecurityHeaders, applyCors, ensureOrigin } from './_lib/security.js';

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['GET', 'OPTIONS']);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!ensureOrigin(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const sbUrl = process.env.SUPABASE_URL;
    const key   = process.env.SUPABASE_SERVICE_KEY;
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);

    if (!sbUrl || !key) {
        return res.status(200).json({ 
            ok: false, 
            error: 'Supabase not configured',
            env: { hasUrl: !!sbUrl, hasKey: !!key },
            allowedOrigins
        });
    }

    try {
        const r = await fetch(`${sbUrl}/rest/v1/leads?select=count&limit=1`, {
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
        });
        const text = await r.text();
        return res.status(200).json({ 
            ok: r.ok, 
            status: r.status,
            supabaseResponse: text,
            allowedOrigins
        });
    } catch (err) {
        return res.status(200).json({ 
            ok: false, 
            error: err.message,
            allowedOrigins
        });
    }
}