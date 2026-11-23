import { countAuthFailures, recordAuthFailureRow } from './db.js';

const WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 8;
const MAX_GLOBAL = 40;

const configured = () => Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const since = (ms) => new Date(Date.now() - ms).toISOString();

/**
 * Durable failed-login limiter (survives serverless cold starts, unlike the
 * in-memory limiter). Fails open when the database is unavailable so an outage
 * cannot lock the owner out; the in-memory limiter still applies.
 */
export async function tooManyAuthFailures(ip) {
    if (!configured()) return false;
    try {
        const [fromIp, overall] = await Promise.all([countAuthFailures(since(WINDOW_MS), ip), countAuthFailures(since(GLOBAL_WINDOW_MS))]);
        return fromIp >= MAX_PER_IP || overall >= MAX_GLOBAL;
    } catch (e) {
        console.error('auth limit check failed:', e.message);
        return false;
    }
}

export async function recordAuthFailure(ip) {
    if (!configured()) return;
    try {
        await recordAuthFailureRow(ip);
    } catch (e) {
        console.error('auth failure record failed:', e.message);
    }
}
