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
- `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` = `rebuild` — routes all Firestore reads/writes to the
  rebuild's **isolated** database (see step 1b). Without it the app hits the legacy `(default)`
  database and would mingle with `main`'s live data.
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` — for the rebuild, set this to the **rebuild RTDB
  instance** URL (step 1b), **not** the legacy default instance. This keeps multiplayer isolated.

Server-only (never prefix with `NEXT_PUBLIC_`):
- `FIREBASE_SERVICE_ACCOUNT_KEY` — full service-account JSON on one line. Required by the
  Admin SDK: without it `/api/leaderboard` **and the new `/stats` page** fail (leaderboard
  returns 500; `/stats` falls back to its "warming up" message instead of showing numbers).
- `GEMINI_API_KEY` — see step 2.

## 1b. Provision the rebuild's isolated database + RTDB instance (one-time)
The rebuild lives in its **own** Firestore database and RTDB instance inside the *same* project
(`csmidterm-5f652`), so migration/testing never touches legacy `main`, and the hardened rules
deploy only to the rebuild's resources.
1. **Enable Blaze** (console → Usage and billing → modify plan → Blaze; attach a billing
   account). Named Firestore databases and extra RTDB instances are Blaze-only; free-tier
   quotas still apply, so this workload stays ~$0.
2. **Create the `rebuild` Firestore database** (console → Firestore → add database → database ID
   `rebuild`, **same region** as the default DB).
3. **Create the rebuild RTDB instance** (console → Realtime Database → add database → note its
   instance **name** and **URL**).
4. Put the instance **name** into `firebase.json` (replace `REPLACE_WITH_REBUILD_RTDB_INSTANCE`)
   and commit; use the instance **URL** as `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (step 1).

## 2. Rotate the Gemini key
The old key was inlined into previously-shipped client bundles, so rotation is mandatory:
1. Google AI Studio → API keys → revoke the existing key; generate a fresh one.
2. Vercel: add `GEMINI_API_KEY` = `<fresh key>` (Production + Preview); **delete** any
   `NEXT_PUBLIC_GEMINI_API_KEY`.
3. `.env.local`: set `GEMINI_API_KEY=<fresh key>`; remove `NEXT_PUBLIC_GEMINI_API_KEY`.

## 3. Preview smoke-test (before flipping — needs a real browser + Gemini key)
Push `entirelyNew`, open the Vercel preview at both desktop and phone widths, and manually
verify the surfaces that can't be automated here:
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

## 4. Copy legacy data into the rebuild database (refreshes drift from legacy writes)
```sh
NODE_OPTIONS=--use-system-ca corepack pnpm exec tsx --env-file=.env.local \
  scripts/migrate-data-to-rebuild.mjs --apply
```
Reads the legacy `(default)` database and **writes into the `rebuild` database** (override with
`MIGRATION_DEST_DATABASE_ID`). The source is only read — legacy `main` stays untouched, so this
is safe to re-run any time to pull in drift. Idempotent — already-migrated docs are skipped.
Run `--dry-run` first to preview counts.

## 5. Deploy the hardened rules (now safe to run any time)
```sh
NODE_OPTIONS=--use-system-ca firebase deploy --only firestore,database
```
`firebase.json` targets **only** the rebuild Firestore database + rebuild RTDB instance, so this
deploys the hardened rules there and **leaves the legacy `(default)` DB / default RTDB instance
untouched**. Legacy `main` multiplayer keeps working, so — unlike the old shared-rules plan —
this no longer has to wait until immediately before the flip. Afterward, confirm in the console
that the `(default)` database rules and the default RTDB instance rules are unchanged. Requires
firebase-tools 13+ (multi-database config).

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

## 8. Wipe the legacy data (only once fully satisfied — permanent)
The rebuild is a permanent move to the `rebuild` database, so after the cutover is validated in
production you can reclaim the legacy `(default)` database and default RTDB instance. This is
irreversible — take an export first if you want a safety copy. Delete the legacy `(default)`
Firestore data and retire the default RTDB instance in the console.

## Rollback
Because the rebuild wrote to a **separate** database and its rules deployed only to the rebuild
resources, the legacy `(default)` database, default RTDB instance, and their rules are **pristine
and untouched** — so rollback is clean and legacy multiplayer keeps working:
1. Flip the Vercel Production Branch back to `main`.
2. (If the rebuild had also been serving prod) unset `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` and
   restore `NEXT_PUBLIC_FIREBASE_DATABASE_URL` to the default instance so any rebuild deploy
   points back at legacy. Do **not** run step 8 until you're certain you won't roll back.
