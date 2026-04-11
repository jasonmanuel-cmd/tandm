import { applyCors, applySecurityHeaders, ensureOrigin } from './_lib/security.js';

export default function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['GET', 'OPTIONS']);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!ensureOrigin(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.status(200).json({
        ok: true,
        service: 'tandm-hauling-site',
        timestamp: new Date().toISOString()
    });
}
