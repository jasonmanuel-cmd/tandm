const DEFAULT_ALLOWED_ORIGINS = [
    'https://tandmbak.com',
    'https://www.tandmbak.com'
];

const rateBucket = new Map();

function nowMs() {
    return Date.now();
}

function cleanupBucket(bucket, windowMs) {
    const cutoff = nowMs() - windowMs;
    while (bucket.length && bucket[0] <= cutoff) {
        bucket.shift();
    }
}

export function getAllowedOrigins() {
    const fromEnv = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

export function resolveRequestOrigin(req) {
    return req.headers.origin || '';
}

export function isOriginAllowed(req, allowedOrigins = getAllowedOrigins()) {
    const origin = resolveRequestOrigin(req);
    if (!origin) return true;
    return allowedOrigins.includes(origin);
}

export function getClientIp(req) {
    const header = req.headers['x-forwarded-for'];
    if (typeof header === 'string' && header.trim()) {
        return header.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

export function applySecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cache-Control', 'no-store');
}

export function applyCors(req, res, methods = ['POST', 'OPTIONS']) {
    const allowedOrigins = getAllowedOrigins();
    const origin = resolveRequestOrigin(req);
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function ensureOrigin(req, res) {
    if (!isOriginAllowed(req)) {
        res.status(403).json({ error: 'Origin not allowed' });
        return false;
    }
    return true;
}

export function enforceRateLimit(req, res, opts = {}) {
    const limit = Number(opts.limit || 12);
    const windowMs = Number(opts.windowMs || 60_000);
    const key = `${opts.prefix || 'default'}:${getClientIp(req)}`;
    const bucket = rateBucket.get(key) || [];
    cleanupBucket(bucket, windowMs);
    if (bucket.length >= limit) {
        const retryAfterSec = Math.ceil((bucket[0] + windowMs - nowMs()) / 1000);
        res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
        res.status(429).json({ error: 'Too many requests' });
        return false;
    }
    bucket.push(nowMs());
    rateBucket.set(key, bucket);
    return true;
}
