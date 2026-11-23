/**
 * POST /api/voice-status  (Twilio <Dial action> callback)
 * Logs the call; if nobody answered, texts the caller back and opens an AI conversation.
 */
import { validateSignature, getParams, sendTwiml, sendSms, normalizePhone } from './_lib/twilio.js';
import { upsertConversation, addMessage, upsertCall, hasRecentOutbound } from './_lib/db.js';
import { canAutoSend } from './_lib/limits.js';

export const TEXT_BACK =
    "Hi, this is T&M Hauling — sorry we missed your call! We're likely on a job. Text us a photo of what needs to go and your neighborhood for a fast quote. Reply STOP to opt out.";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!validateSignature(req)) return res.status(403).json({ error: 'Invalid signature' });

    const p = getParams(req);
    const from = normalizePhone(p.From || p.Caller || '');
    const status = p.DialCallStatus || 'unknown';
    const missed = status !== 'completed';

    try {
        let conversation = null;
        if (from && missed) {
            conversation = await upsertConversation(from, { source: 'missed_call' });
        }
        await upsertCall({
            call_sid: p.CallSid || null,
            from_number: from || p.From || null,
            status,
            missed,
            duration_sec: Number(p.DialCallDuration) || null,
            conversation_id: conversation?.id || null
        });

        if (conversation && !conversation.opted_out) {
            // Don't text-back repeatedly if they just got one
            const recent = await hasRecentOutbound(conversation.id, 10);
            if (!recent && (await canAutoSend(conversation.id)).ok) {
                const sid = await sendSms(from, TEXT_BACK);
                await addMessage(conversation.id, 'out', 'system', TEXT_BACK, { twilio_sid: sid });
            }
        }
    } catch (e) {
        console.error('voice-status error:', e.message);
    }

    if (missed) {
        return sendTwiml(res, '<Say>Sorry we missed you. We are texting you right now.</Say><Hangup/>');
    }
    return sendTwiml(res, '<Hangup/>');
}
