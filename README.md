# T&M Hauling Site

Static marketing site with Vercel serverless APIs for chatbot and deposit checkout handoff.

## Environment Variables

Copy `.env.example` and configure in Vercel project settings:

- `ANTHROPIC_API_KEY`: required for `/api/chat`
- `STRIPE_SECRET_KEY`: required for `/api/create-checkout-session`
- `SITE_URL`: canonical site origin for success/cancel redirects
- `ALLOWED_ORIGINS`: comma-separated CORS allowlist

## Local Commands

- `npm ci`
- `npm test`

## Production Guardrails

- Strict security headers are set in `vercel.json`.
- API routes enforce:
  - origin allowlist
  - baseline rate limiting
  - no-store response policy
- `robots.txt` and `sitemap.xml` are included.
- CI runs automated tests on push and pull requests.

## Remaining Work (Intentionally Not Included Here)

Stripe webhook verification and payment-event reconciliation are not implemented in this repository yet.
