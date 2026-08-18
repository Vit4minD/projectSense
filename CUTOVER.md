# Go-Live Runbook — `entirelyNew` → production

Everything here touches production and needs **your** Firebase/Vercel access; the code is
done. Run the steps in order on cutover day. Full background lives in `PROJECT_CONTEXT.md`
§18–§20 — where they disagree with this file, **this file wins** (it reflects the 2026-08
hardening pass: leaderboard reads now require auth, rules were tightened, rate limiting was
added, and `packageManager` now pins pnpm 11 for Vercel).

## 0. Build note (already handled in code)
`package.json` now pins `"packageManager": "pnpm@11.22.0"`, so Vercel's corepack uses pnpm 11
and no longer errors on the settings-only `pnpm-workspace.yaml`. No action needed — just be
aware the Vercel build uses pnpm 11.

## 1. Set Vercel env vars  (Project → Settings → Environment Variables, Production + Preview)
Public Firebase config (all envs):
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`,
  `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` — **enables GA4** (without it all custom analytics
  events, including the new page-view/game/multiplayer/settings events, silently no-op).
- `NEXT_PUBLIC_SITE_URL` — the real production origin (defaults to
  `https://project-sense.vercel.app`); drives canonical URLs, sitemap, robots, and og tags.

Server-only (never prefix with `NEXT_PUBLIC_`):
- `FIREBASE_SERVICE_ACCOUNT_KEY` — full service-account JSON on one line. Required by the
  Admin SDK: without it `/api/leaderboard` **and the new `/stats` page** fail (leaderboard
  returns 500; `/stats` falls back to its "warming up" message instead of showing numbers).
- `GEMINI_API_KEY` — see step 2.

## 2. Rotate the Gemini key
The old key was inlined into previously-shipped client bundles, so rotation is mandatory:
1. Google AI Studio → API keys → revoke the existing key; generate a fresh one.
2. Vercel: add `GEMINI_API_KEY` = `<fresh key>` (Production + Preview); **delete** any
   `NEXT_PUBLIC_GEMINI_API_KEY`.
3. `.env.local`: set `GEMINI_API_KEY=<fresh key>`; remove `NEXT_PUBLIC_GEMINI_API_KEY`.

## 3. Preview smoke-test (before flipping — needs a real browser + Gemini key)
Push `entirelyNew`, open the Vercel preview, and manually verify the surfaces that can't be
automated here:
- Sign in (email + Google) → run a 5/5 drill → confirm the leaderboard publishes.
- `/multiplayer` in **2 windows** → create + join → race to 5 → ended state; test
  host-closes-tab recovery and private-room confidentiality with a third account.
- `/test` → generate (real Gemini) → submit → results.
- `/games/twenty-four` and `/games/zetamac` → keyboard, timer, sound/haptics, end modal.
- Tweaks panel → toggle sound/haptics; switch sage / ink / mono / arcade themes.
- `/stats` → shows real aggregate numbers (not the fallback).
- View source on `/` → WebSite + Organization JSON-LD present; `/sitemap.xml` (includes
  `/stats` + all 52 `/trick/{id}`) and `/robots.txt` resolve.
- GA4 → DebugView → confirm `page_view`, `login`/`sign_up`, `drill_started`,
  `practice_session_completed`, `game_started`/`game_completed`, and the multiplayer events
  land. (Note: the `/_vercel/insights/*` scripts 404 anywhere except Vercel — that's normal;
  Vercel Analytics/Speed Insights only work on the Vercel deployment.)

## 4. Re-run the data migration (refreshes drift from legacy writes)
```sh
NODE_OPTIONS=--use-system-ca corepack pnpm exec tsx --env-file=.env.local \
  scripts/migrate-data-to-rebuild.mjs --apply
```
Idempotent — already-migrated docs are skipped.

## 5. Deploy the hardened rules — **immediately before** the branch flip
```sh
NODE_OPTIONS=--use-system-ca firebase deploy --only firestore:rules,database
```
⚠ Deploy **both** Firestore rules and RTDB rules (§0). This is the moment legacy `main`'s
multiplayer breaks (it never writes the `host` field the new RTDB rules require), so do it
right before step 6 — not earlier.

## 6. Flip the Vercel Production Branch
Vercel → Settings → Git → Production Branch: `main` → `entirelyNew`. The same domain serves
the rebuild on the next deploy (auto on push, or trigger manually).

## 7. Post-cutover (anytime after)
- **GA4 conversions**: Admin → Events → mark `login` and `sign_up` as conversions.
- **GA4 custom dimensions**: Admin → Custom definitions → register the event-scoped params:
  `trick_id`, `duration_ms`, `time_ms`, `number_correct`, `total`, `score`, `players_count`,
  `won`, `method`, `question_count`, and the params added this pass — `page_path`, `game`,
  `high_score`, `solved_count`, `duration_s`, `visibility`, `setting`, `value`; plus
  user-scoped `signup_date`.
- **Resubmit sitemap**: Google Search Console → submit `<NEXT_PUBLIC_SITE_URL>/sitemap.xml`.
- **(Optional)** Validate JSON-LD at <https://search.google.com/test/rich-results>.
- **(Optional)** Wire Sentry fully: `npx @sentry/wizard@latest -i nextjs`.

## Rollback
Flip the Production Branch back to `main`. The migration is additive (legacy fields
preserved), so single-player practice, leaderboard, and AI test keep working on legacy. Only
legacy multiplayer stays dark (the new RTDB rules require `host`); re-deploy the old
permissive rules if you need it back.
