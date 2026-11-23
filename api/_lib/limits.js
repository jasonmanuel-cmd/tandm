import { countAutoOut } from './db.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function intFromEnv(name, fallback) {
    const n = parseInt(process.env[name], 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Spending guard for automated outbound texts (AI replies and missed-call text-backs).
 * Limits are per thread and across the whole account over the last 24 hours.
 * Human replies sent from the inbox are never counted or blocked.
 */
export async function canAutoSend(conversationId) {
    const perThread = intFromEnv('SMS_MAX_OUT_PER_THREAD_DAY', 20);
    const global = intFromEnv('SMS_MAX_OUT_GLOBAL_DAY', 300);
    const since = new Date(Date.now() - DAY_MS).toISOString();

    const [thread, total] = await Promise.all([countAutoOut(since, Number(conversationId)), countAutoOut(since)]);
    if (thread >= perThread) return { ok: false, reason: 'thread' };
    if (total >= global) return { ok: false, reason: 'global' };
    return { ok: true, reason: '' };
}
