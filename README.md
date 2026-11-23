# T&M Hauling site (Astro)

Marketing site for tandmbak.com (Bakersfield junk removal). Astro static site + Vercel serverless functions in `api/`.
Status, decisions and next steps live in [docs/STATUS.md](docs/STATUS.md).

## Commands

- `npm install`
- `npm run dev` / `npm run build` / `npm run preview`
- `npm test` (node:test, `tests/`)

## Layout

- `src/pages/` — pages. `build.format: 'file'` keeps the old `.html` URLs (e.g. `/services/garage-clean-up.html`).
- `src/data/*.json` — service, neighborhood and FAQ content; `site.ts` holds business facts and the optional `rating`.
- `public/` — files copied as-is (admin `tmhq.html`, `sign.html`, `upload.html`, thank-you pages, gallery, optimized `before-after/` photos).
- `api/` — leads, chat, Stripe checkout, admin, plus the phone system (`voice-incoming`, `voice-status`, `sms-incoming`, `inbox`).
- Database: Neon Postgres (Vercel integration `tandm-hauling-db`, sets `DATABASE_URL`). Tables are created automatically on first use (`api/_lib/db.js`). Photos: Vercel Blob store `tandm-photos` (sets `BLOB_READ_WRITE_TOKEN`).

## Environment variables (Vercel project settings)

Existing: `ADMIN_PASSWORD`, `ADMIN_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `SITE_URL`, `ALLOWED_ORIGINS`.

Phone system (Phase 1): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `OWNER_PHONE`; optional `RING_SECONDS` (default 20), `SMS_AI_MODEL`, `PUBLIC_BASE_URL`.

Never commit secrets; `.env*` and `.vercel` are git-ignored.
