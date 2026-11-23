/**
 * Admin inbox API (Bearer token from /api/admin-auth)
 *   GET  /api/inbox?type=conversations        → list
 *   GET  /api/inbox?type=messages&id=<id>     → thread
 *   GET  /api/inbox?type=calls                → recent calls
 *   POST /api/inbox {action:'send',id,body}   → human SMS (turns AI off for that thread)
 *   POST /api/inbox {action:'ai',id,enabled}  → toggle AI
 *   POST /api/inbox {action:'status',id,status} → new|active|booked|closed|spam
 *   POST /api/inbox {action:'resolve',id}     → clear needs_human
 */
import { applySecurityHeaders, applyCors, ensureOrigin } from './_lib/security.js';
import { verifyAdminToken } from './_lib/adminAuth.js';
import { listConversations, listMessages, listCalls, getConversation, updateConversation, addMessage } from './_lib/db.js';
import { sendSms } from './_lib/twilio.js';

const STATUSES = ['new', 'active', 'booked', 'closed', 'spam'];

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['GET', 'POST', 'OPTIONS']);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!ensureOrigin(req, res)) return;
    if (!verifyAdminToken(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        if (req.method === 'GET') {
            const { type, id } = req.query || {};
            if (type === 'conversations') return res.status(200).json({ data: await listConversations(200) });
            if (type === 'messages') {
                const n = parseInt(id, 10);
                if (!n) return res.status(400).json({ error: 'id required' });
                return res.status(200).json({ data: await listMessages(n, 500) });
            }
            if (type === 'calls') return res.status(200).json({ data: await listCalls(100) });
            return res.status(400).json({ error: 'Unknown type' });
        }

        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        let body = {};
        try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
        catch { return res.status(400).json({ error: 'Invalid body' }); }
        const id = parseInt(body.id, 10);
        if (!id) return res.status(400).json({ error: 'id required' });

        if (body.action === 'send') {
            const text = String(body.body || '').trim().slice(0, 1500);
            if (!text) return res.status(400).json({ error: 'Message is empty' });
            const conv = await getConversation(id);
            if (!conv) return res.status(404).json({ error: 'Not found' });
            if (conv.opted_out) return res.status(409).json({ error: 'This contact opted out (STOP)' });
            const sid = await sendSms(conv.phone, text);
            await addMessage(id, 'out', 'human', text, { twilio_sid: sid });
            await updateConversation(id, { ai_enabled: false, needs_human: false, status: 'active', last_message_at: new Date().toISOString() });
            return res.status(200).json({ ok: true });
        }
        if (body.action === 'ai') { await updateConversation(id, { ai_enabled: !!body.enabled }); return res.status(200).json({ ok: true }); }
        if (body.action === 'resolve') { await updateConversation(id, { needs_human: false }); return res.status(200).json({ ok: true }); }
        if (body.action === 'status') {
            if (!STATUSES.includes(body.status)) return res.status(400).json({ error: 'Bad status' });
            await updateConversation(id, { status: body.status });
            return res.status(200).json({ ok: true });
        }
        return res.status(400).json({ error: 'Unknown action' });
    } catch (e) {
        console.error('inbox error:', e.message);
        return res.status(e.message === 'DB_UNCONFIGURED' ? 503 : 500).json({ error: 'Inbox error' });
    }
}
