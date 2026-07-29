/**
 * GET /api/photos
 * Lists uploaded photos from photo_uploads table.
 * Requires admin auth. Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */
import crypto from 'crypto';
import { applySecurityHeaders, applyCors, ensureOrigin } from './_lib/security.js';

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
  try { return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex')); }
  catch { return false; }
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  applyCors(req, res, ['GET', 'OPTIONS']);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!ensureOrigin(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const sbUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!sbUrl || !key) return res.status(503).json({ error: 'DB not configured' });

  try {
    const r = await fetch(`${sbUrl}/rest/v1/photo_uploads?select=*&order=created_at.desc&limit=200`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return res.status(200).json({ data });
  } catch (err) {
    console.error('photos error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch' });
  }
}
