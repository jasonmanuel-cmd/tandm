import crypto from 'crypto';

/** Same token scheme as /api/admin-auth: "<timestamp>.<hmac>", valid 8 hours. */
export function verifyAdminToken(req) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
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
    } catch {
        return false;
    }
}
