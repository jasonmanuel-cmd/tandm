/**
 * Vercel Serverless: POST /api/create-checkout-session
 * Creates a Stripe Checkout Session for the $30 job booking deposit.
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   STRIPE_SECRET_KEY   = sk_live_... or sk_test_... (required for deposits)
 *   SITE_URL            = https://tandmbak.com  (optional; defaults below)
 */

import Stripe from 'stripe';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        return res.status(503).json({
            error: 'Payments not configured',
            code: 'STRIPE_MISSING'
        });
    }

    const site = (process.env.SITE_URL || 'https://tandmbak.com').replace(/\/$/, '');
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const email = (body.email || '').trim();
    const name = (body.name || '').trim().slice(0, 200);
    const phone = (body.phone || '').trim().slice(0, 40);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    const stripe = new Stripe(secret);

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'T&M Hauling — Job booking deposit (non-refundable)',
                            description:
                                'Non-refundable $30 deposit to hold your crew and date. Credited toward your final invoice. Job photos and details are emailed to T&M separately.'
                        },
                        unit_amount: 3000
                    },
                    quantity: 1
                }
            ],
            success_url: `${site}/thank-you-deposit.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${site}/book.html#book-job`,
            metadata: {
                funnel: 'job_booking_deposit',
                customer_name: name,
                customer_phone: phone
            },
            payment_intent_data: {
                metadata: {
                    funnel: 'job_booking_deposit',
                    customer_name: name,
                    customer_phone: phone
                }
            }
        });

        return res.status(200).json({ url: session.url });
    } catch (err) {
        console.error('Stripe checkout error:', err);
        return res.status(500).json({ error: 'Could not start checkout' });
    }
}
