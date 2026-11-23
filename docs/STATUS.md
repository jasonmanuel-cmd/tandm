# Project status — T&M Hauling (updated 2026-10-12)

## Changes made and files affected

**Live (deployed 2026-10-11 to Vercel project `tandm-hauling-bakersfield`, www.tandmbak.com)**
- Old static site (`tandm-main`): moved `vercel-env-vars.txt` out of the deploy (placeholders only, but it was publicly served); added second phone + 5 social links to `index.html` schema; added `.vercelignore`.
- New Astro site (this folder) deployed to production: `astro.config.mjs`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/data/*`, pages (`index`, `services`, `services/[slug]`, `neighborhoods/[slug]`, `service-areas`, `about`, `faq`, `reviews`, `contact`, `404`, `sitemap.xml.ts`), components (`QuoteForm`, `BeforeAfter`), `vercel.json` (framework astro). All old `.html` URLs preserved. Before/after photos resized 531 MB → 46 MB (`public/before-after/`).

**Not deployed yet (Phase 1 phone system, code only)**
- `api/voice-incoming.js`, `api/voice-status.js`, `api/sms-incoming.js`, `api/inbox.js`, `api/_lib/{twilio,db,ai,adminAuth}.js`
- `src/pages/inbox.astro` (dashboard at `/inbox.html`), `supabase-phase1.sql`, `tests/phone.test.js`, `vercel.json` (4 new functions)
- `README.md`, `docs/STATUS.md` (this file)

## Checks performed and results (2026-10-12)
- `astro build`: 40 pages built, no errors.
- `npm test`: 27 tests, 27 pass, 0 fail (includes Twilio signature, TwiML, inbox auth tests).
- Secret scan of the tree (excluding node_modules/dist/.vercel/.astro): no matches; no `.env*` files present.
- Live site after deploy (2026-10-11): home, services, contact, FAQ, reviews, about, areas, gallery, sample service + neighborhood pages, admin and sign pages all HTTP 200; `/api/health` OK; `/vercel-env-vars.txt` 404; homepage schema has 2 phones and 7 `sameAs` links. Two curl calls failed with local DNS errors and passed on retry.
- URL parity: every `.html` file from the old site exists in the new build.
- Contact page (preview): load estimator works; empty submits show validation errors and make 0 network calls.
- **Not tested:** real form submissions, Stripe checkout, `/api/leads` email path, Twilio webhooks, AI replies (no Twilio account yet).

## Security review fixes (2026-10-21, not deployed)
- Outbound texts now go to US (+1) numbers only; premium 900 and international numbers are rejected (`api/_lib/twilio.js`).
- Daily spending caps on automated texts: 20 per thread, 300 account-wide (env `SMS_MAX_OUT_PER_THREAD_DAY`, `SMS_MAX_OUT_GLOBAL_DAY`); owner alerted once when a thread is paused (`api/_lib/limits.js`).
- `/api/admin-auth` now has a durable failed-login limit (8 per IP / 15 min, 40 overall / hour) backed by Supabase; fails open if the database is down (`api/_lib/authLimit.js`).
- Twilio webhook retries no longer double-reply: unique index on `messages.twilio_sid` + insert-once logic.
- Missed-call text-back includes "Reply STOP to opt out."
- `supabase-phase1.sql` updated (unique index, `auth_failures` table): **re-run it** in the T&M Supabase project.
- Tests: 36 pass (9 new in `tests/phone-limits.test.js`).
- Still open from the review: set `PUBLIC_BASE_URL=https://www.tandmbak.com`; only render `https://` photo links in the inbox; use a long admin password.

## Database move: Supabase → Neon (2026-10-27)
- The old Supabase database was unreachable (`fetch failed` on every call), so customers/signatures/photos could not load.
- Created Neon Postgres via the Vercel integration (`tandm-hauling-db`, `DATABASE_URL` set for all environments) and a Vercel Blob store (`tandm-photos`, `BLOB_READ_WRITE_TOKEN`).
- `api/_lib/db.js` rewritten for Neon (parameterised SQL, tables auto-created). Updated: leads, tos-sign, admin-data, photos, upload-photo (now Blob), inbox, sms-incoming, voice-status, limits, authLimit. Removed `api/test-supabase.js`.
- Tests: 41 pass, including `tests/db.test.js` which runs the real SQL on an in-memory Postgres (PGlite).
- Old Supabase env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) are now unused and can be deleted from Vercel.
- `supabase-*.sql` files are obsolete.

## Remaining problems
1. `SMTP_PASS` missing in Vercel → lead / ToS emails are silently skipped (leads still save).
2. (Resolved) Database now Neon; tables auto-create.
3. No Twilio account/number/A2P 10DLC registration; Twilio env vars not set.
4. GitHub Actions CI blocked by an account billing lock; `gh` account `jasonmanuel-cmd` has no push permission on `jasonmanuel-cmd/tandm`.
5. `aggregateRating` and 5-decimal `geo` not added (need real Google rating/count and Maps coordinates).
6. 15 neighborhood pages are thin (~230–290 words, ~40% phrase overlap); need real local content.
7. Old-style pages remain: gallery pages, `privacy`, `terms`, `tmhq`, `sign`, `upload`, thank-you pages.
8. `vercel-env-vars.txt` (placeholders) still exists in the public GitHub repo `jasonmanuel-cmd/tandm`.
9. Namecheap nameservers differ from Vercel's intended ones (site works via DNS records).

## Next concrete action
Run `supabase-phase1.sql` in the T&M Supabase project SQL Editor, then create the Twilio account and start A2P registration; after env vars are added, deploy and point the Twilio number at `/api/voice-incoming` and `/api/sms-incoming`.

## Decisions and corrections
- Redesign + rebuild in Astro approved; built in a new folder (`tandm-astro`), old project `tandm-main` left untouched.
- Deployed Astro site to production with `vercel deploy --prod` from this folder (no git remote involved).
- Correction: earlier claim that the env template exposed secrets was wrong — it contained placeholders only.
- Correction: the old sitemap listed `/services/furniture-removal.html` (404); the new sitemap does not.
- Skipped deleting the file from GitHub (no push access; harmless).
- Phone system design: Twilio + Claude (Haiku) SMS replies + Supabase tables + `/inbox.html` dashboard; voice AI agent is Phase 2.
- No git branch was agreed. This folder was not a git repo; a local branch `astro-migration` was created for the commit. Nothing has been pushed.
