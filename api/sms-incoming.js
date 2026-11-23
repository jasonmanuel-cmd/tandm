/**
 * POST /api/sms-incoming  (Twilio Messaging webhook)
 * Stores the customer's text, lets Claude reply (unless a human took over),
 * and alerts the owner on new conversations or escalations.
 * Env: TWILIO_*, OWNER_PHONE, ANTHROPIC_API_KEY, DATABASE_URL
 */
import { validateSignature, getParams, sendTwiml, sendSms, normalizePhone } from './_lib/twilio.js';
import { upsertConversation, updateConversation, addMessage, addMessageOnce, recentMessages } from './_lib/db.js';
import { aiReply } from './_lib/ai.js';
import { canAutoSend } from './_lib/limits.js';

const STOP = /^\s*(stop|stopall|unsubscribe|cancel|end|quit)\s*$/i;
const START = /^\s*(start|unstop|yes)\s*$/i;
const FALLBACK = "Thanks for texting T&M Hauling! A team member will text you back shortly. Photos of the job help us quote fast.";

async function alertOwner(text) {
    const owner = normalizePhone(process.env.OWNER_PHONE || '');
    if (!owner) return;
    try { await sendSms(owner, text); } catch (e) { console.error('owner alert failed:', e.message); }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!validateSignature(req)) return res.status(403).json({ error: 'Invalid signature' });

    const p = getParams(req);
    const from = normalizePhone(p.From || '');
    const body = String(p.Body || '').trim().slice(0, 1600);
    const mediaCount = Number(p.NumMedia) || 0;
    const media = Array.from({ length: Math.min(mediaCount, 10) }, (_, i) => p[`MediaUrl${i}`]).filter(Boolean);
    if (!from) return sendTwiml(res);

    try {
        let conv = await upsertConversation(from);
        const text = body || (media.length ? '[photo]' : '');
        if (text) {
            const isNew = p.MessageSid
                ? await addMessageOnce(conv.id, 'in', 'customer', text, { media_urls: media, twilio_sid: p.MessageSid })
                : (await addMessage(conv.id, 'in', 'customer', text, { media_urls: media }), true);
            // Twilio retried a webhook we already handled: don't reply twice.
            if (!isNew) return sendTwiml(res);
        }

        // Opt-out / opt-in (Twilio also enforces STOP at the carrier level)
        if (STOP.test(body)) {
            await updateConversation(conv.id, { opted_out: true, ai_enabled: false, status: 'closed' });
            return sendTwiml(res);
        }
        if (START.test(body) && conv.opted_out) {
            await updateConversation(conv.id, { opted_out: false, ai_enabled: true, status: 'active' });
            conv = { ...conv, opted_out: false, ai_enabled: true };
        }
        if (conv.opted_out) return sendTwiml(res);

        const isFirst = !conv.owner_alerted_at;
        if (isFirst) {
            await updateConversation(conv.id, { owner_alerted_at: new Date().toISOString(), status: 'active' });
            await alertOwner(`New T&M text from ${from}: "${(body || '[photo]').slice(0, 120)}" — see inbox: https://tandmbak.com/inbox.html`);
        }

        if (!conv.ai_enabled) return sendTwiml(res);

        // Spending guard: stop auto-replying once a thread or the account hits its daily cap
        const cap = await canAutoSend(conv.id);
        if (!cap.ok) {
            if (!conv.needs_human) {
                await updateConversation(conv.id, { needs_human: true });
                await alertOwner(`T&M text auto-reply paused (${cap.reason} daily limit): ${from}. https://tandmbak.com/inbox.html`);
            }
            return sendTwiml(res);
        }

        // Generate + send the AI reply
        const history = await recentMessages(conv.id, 20);
        let reply = { text: FALLBACK, escalate: false };
        try {
            const r = await aiReply(history);
            if (r.text) reply = r;
        } catch (e) {
            console.error('AI reply failed:', e.message);
            reply = { text: FALLBACK, escalate: true };
        }

        const sid = await sendSms(from, reply.text);
        await addMessage(conv.id, 'out', 'ai', reply.text, { twilio_sid: sid });

        if (reply.escalate) {
            await updateConversation(conv.id, { needs_human: true });
            await alertOwner(`T&M text needs YOU: ${from} — "${(body || '[photo]').slice(0, 100)}". https://tandmbak.com/inbox.html`);
        }
    } catch (e) {
        console.error('sms-incoming error:', e.message);
    }
    return sendTwiml(res);
}
