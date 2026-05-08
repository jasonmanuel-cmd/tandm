/**
 * GET /api/admin-data?type=leads|bookings|signatures
 * Requires Authorization: Bearer <token> from /api/admin-auth
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, STRIPE_SECRET_KEY, ADMIN_SECRET/ADMIN_PASSWORD
 */
import crypto from 'crypto';
import { applySecurityHeaders } from './_lib/security.js';

function verifyToken(token) {
    if (!token || typeof token !== 'string') return false;
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const ts = token.slice(0, dot);
    const hmac = token.slice(dot + 1);
    const timestamp = parseInt(ts, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 8 * 60 * 60 * 1000) return false;
    const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(ts).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));
    } catch { return false; }
}

async function sbFetch(path) {
    const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
    const key = process.env.SUPABASE_SERVICE_KEY;
    const r = await fetch(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

export default async function handler(req, res) {
    applySecurityHeaders(res);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

    const { type } = req.query;

    try {
        if (type === 'leads') {
            const data = await sbFetch('leads?select=*&order=created_at.desc&limit=200');
            return res.status(200).json({ data });
        }
        if (type === 'signatures') {
            const data = await sbFetch('tos_signatures?select=*&order=signed_at.desc&limit=200');
            return res.status(200).json({ data });
        }
        if (type === 'bookings') {
            if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ data: [] });
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const sessions = await stripe.checkout.sessions.list({ limit: 100 });
            const data = sessions.data
                .filter(s => s.metadata?.funnel === 'job_booking_deposit')
                .map(s => ({
                    id: s.id,
                    created: new Date(s.created * 1000).toISOString(),
                    customer_email: s.customer_email,
                    customer_name: s.metadata?.customer_name || '',
                    customer_phone: s.metadata?.customer_phone || '',
                    status: s.payment_status,
                    amount_usd: (s.amount_total / 100).toFixed(2)
                }));
            return res.status(200).json({ data });
        }
        return res.status(400).json({ error: 'Invalid type' });
    } catch (err) {
        console.error('admin-data error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
}
