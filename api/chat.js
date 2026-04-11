/**
 * Vercel Serverless Function: /api/chat
 * Proxies messages to Claude API for the T&M Hauling chatbot.
 *
 * Required environment variable in Vercel dashboard:
 *   ANTHROPIC_API_KEY = your Anthropic API key
 * Optional:
 *   ALLOWED_ORIGINS   = comma-separated allowlist for CORS
 */

import {
    applyCors,
    applySecurityHeaders,
    enforceRateLimit,
    ensureOrigin
} from './_lib/security.js';

export default async function handler(req, res) {
    applySecurityHeaders(res);
    applyCors(req, res, ['POST', 'OPTIONS']);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!ensureOrigin(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!enforceRateLimit(req, res, { prefix: 'chat', limit: 12, windowMs: 60_000 })) {
        return;
    }

    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Service unavailable' });
    }

    // Build limited conversation history for Claude.
    const messages = [];
    if (Array.isArray(history)) {
        for (const msg of history.slice(-6)) { // last 6 turns max
            if (
                msg &&
                (msg.role === 'user' || msg.role === 'assistant') &&
                typeof msg.content === 'string' &&
                msg.content.trim()
            ) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }
    }
    messages.push({ role: 'user', content: message.trim().slice(0, 500) });

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 300,
                system: `You are the T&M Hauling assistant for a local junk removal company in Bakersfield, CA.
You help customers get quotes and schedule pickups.

Key facts:
- Father-son operated, fully insured
- Phone: (661) 996-6950
- Email: tandmhaulingbak@gmail.com
- Services: garage clean ups, estate clean ups, junk removal, appliance hauling, construction debris, yard waste, storage unit cleanouts, hot tub removal, mattress disposal, scrap metal removal, hoarder house cleanouts, apartment cleanouts
- Service area: Bakersfield and all of Kern County, CA. Major areas: Seven Oaks, Rosedale, Stockdale, Oildale, East Bakersfield, Southwest, Northwest.
- Hours: Mon–Sun 9am–5pm
- Pricing: based on truck space and material type — always confirm price before starting
- Same-day service often available
- Do NOT handle hazardous materials (paint, chemicals, asbestos, biohazards)
- Best way to get a quote: text a photo to (661) 996-6950

Keep responses short (2-3 sentences max), helpful, and always include a clear next step (call, text photo, or book online). Be friendly and direct — avoid corporate jargon.`,
                messages
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Anthropic API error:', err);
            return res.status(502).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const reply = data.content?.[0]?.text || "Give us a call at (661) 996-6950 and we'll help you right away.";

        return res.status(200).json({ reply });

    } catch (err) {
        console.error('Chat handler error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
