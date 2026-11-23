/**
 * POST /api/voice-incoming  (Twilio Voice webhook)
 * Rings the owner's cell; if unanswered, Twilio calls /api/voice-status.
 * Env: TWILIO_AUTH_TOKEN, OWNER_PHONE, optional RING_SECONDS (default 20), PUBLIC_BASE_URL
 */
import { validateSignature, sendTwiml, escapeXml, baseUrl, normalizePhone } from './_lib/twilio.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!validateSignature(req)) return res.status(403).json({ error: 'Invalid signature' });

    const owner = normalizePhone(process.env.OWNER_PHONE || '');
    if (!owner) {
        return sendTwiml(res, '<Say>Thanks for calling T&amp;M Hauling. Please text this number a photo of your job and we will reply shortly.</Say><Hangup/>');
    }
    const ring = Math.min(40, Math.max(10, Number(process.env.RING_SECONDS) || 20));
    const action = `${baseUrl(req)}/api/voice-status`;
    return sendTwiml(
        res,
        `<Dial timeout="${ring}" answerOnBridge="true" action="${escapeXml(action)}" method="POST"><Number>${escapeXml(owner)}</Number></Dial>`
    );
}
