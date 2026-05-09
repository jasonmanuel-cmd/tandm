/**
 * POST /api/admin-auth
 * Verifies ADMIN_PASSWORD and returns a short-lived signed token.
 * Env vars: ADMIN_PASSWORD, ADMIN_SECRET (optional, falls back to password)
 */
import crypto from 'crypto';
import { applySecurityHeaders, applyCors, ensureOrigin, enforceRateLimit } from './_lib/security.js';

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!ensureOrigin(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!enforceRateLimit(req, res, { prefix: 'admin-auth', limit: 5, windowMs: 60_000 })) return;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return res.status(503).json({ error: 'Admin not configured' });

    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
    catch { return res.status(400).json({ error: 'Invalid body' }); }

    const { password } = body;
    if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Password required' });

    // Timing-safe compare
    const a = Buffer.alloc(256); Buffer.from(password).copy(a);
    const b = Buffer.alloc(256); Buffer.from(adminPassword).copy(b);
    const match = crypto.timingSafeEqual(a, b) && password.length === adminPassword.length;
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    // Token: timestamp.hmac — valid 8 hours
    const ts = Date.now().toString();
    const secret = process.env.ADMIN_SECRET || adminPassword;
    const hmac = crypto.createHmac('sha256', secret).update(ts).digest('hex');
    return res.status(200).json({ token: `${ts}.${hmac}` });
}
