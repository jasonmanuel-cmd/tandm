/**
 * POST /api/upload-photo
 * Accepts base64 image + label, saves to Supabase Storage + photo_uploads table.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
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

function ensureStorageBucket(sbUrl, key) {
  const name = 'gallery-uploads';
  return fetch(`${sbUrl}/storage/v1/bucket/${name}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => {
    if (r.ok) return;
    return fetch(`${sbUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, public: true })
    });
  });
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  applyCors(req, res, ['POST', 'OPTIONS']);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!ensureOrigin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const sbUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!sbUrl || !key) return res.status(503).json({ error: 'Storage not configured' });

  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid body' }); }

  const label = (body.label || '').trim().slice(0, 200);
  const description = (body.description || '').trim().slice(0, 1000);
  const imageBase64 = (body.image || '').trim();
  const mimeType = body.mime_type || 'image/jpeg';

  if (!label) return res.status(400).json({ error: 'Label is required' });
  if (!imageBase64) return res.status(400).json({ error: 'Image data is required' });

  const buffer = Buffer.from(imageBase64, 'base64');
  if (buffer.length > 5 * 1024 * 1024)
    return res.status(400).json({ error: 'Image too large (max 5MB)' });

  const ext = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const safeLabel = label.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
  const filename = `${timestamp}_${safeLabel}.${ext}`;
  const storagePath = filename;

  try {
    await ensureStorageBucket(sbUrl, key);

    const uploadRes = await fetch(`${sbUrl}/storage/v1/object/gallery-uploads/${storagePath}`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': mimeType
      },
      body: buffer
    });
    if (!uploadRes.ok) throw new Error('Storage upload failed: ' + (await uploadRes.text()));

    const publicUrl = `${sbUrl}/storage/v1/object/public/gallery-uploads/${storagePath}`;

    const metaRes = await fetch(`${sbUrl}/rest/v1/photo_uploads`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json', Prefer: 'return=representation'
      },
      body: JSON.stringify({
        label, description, filename,
        storage_path: storagePath,
        public_url: publicUrl,
        mime_type: mimeType,
        file_size: buffer.length,
        status: 'pending'
      })
    });
    let metaPayload = {};
    try { const rows = await metaRes.json(); metaPayload = rows[0] || {}; } catch {}

    return res.status(200).json({ ok: true, url: publicUrl, id: metaPayload.id, label });
  } catch (err) {
    console.error('upload-photo error:', err.message);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
