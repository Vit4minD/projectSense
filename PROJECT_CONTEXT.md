# Project Sense — Source of Truth

A self-contained snapshot of the project. Replaces and consolidates the earlier
`PROJECT_CONTEXT.md`, `ANALYTICS_SEO_CONTEXT.md`, and
`FIREBASE_RULES_MIGRATION_CONTEXT.md` dumps. Includes the full session log so a
future agent (or you, returning cold) can resume without re-deriving anything.

Last updated: 2026-05-05.

---

## 1. What this is

A practice gym for **UIL Number Sense** — drill canonical math tricks, race friends in real time, sit AI-generated full-length papers. The codebase is a complete from-scratch rewrite of an older app, built off a Claude Design handoff bundle (`app v2.html` + JSX prototype).

- **Repo**: `henry-tran07/projectSense`
- **Active Firebase project**: `csmidterm-5f652` (intentionally shared between the legacy app and the rebuild — see §7)

---

## 2. Active branches

| Branch | Purpose | Status |
|---|---|---|
| `main` | Legacy app — currently deployed to Vercel production | Live; users hitting the existing URL get this |
| `entirelyNew` | From-scratch rebuild | Phase 2 complete + 52-trick catalog + migration tooling. **Not yet deployed.** |
| `worktree-analytics` | Side branch off `main` for analytics/SEO/Firebase-rules work | Merged into `main` |

The plan is for `entirelyNew` to eventually replace `main` as the production deployment. Until then both apps coexist on the same Firebase project, with the rebuild's migration tooling preserving the legacy field shapes so `main` keeps working.

---

## 3. Stack — locked

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 + CSS variables (1:1 design-token port) |
| UI primitives | shadcn-style utilities (clsx + tailwind-merge); shadcn CLI not yet initialized |
| Auth | Firebase Auth (email/password + Google SSO) |
| DB | Firestore |
| Realtime | Firebase RTDB (reserved for Phase 3 multiplayer) |
| AI test gen | Vercel AI SDK + Anthropic Claude (Phase 3) |
| Math eval | mathjs |
| Math render | KaTeX + react-katex (declared, not yet imported) |
| Animations | Pure CSS `@keyframes` ported from prototype + motion/react for route-level later |
| Forms | react-hook-form + Zod |
| Icons | lucide-react |
| Testing | Vitest (unit) + Playwright (e2e) against Firebase Local Emulator Suite |
| Hosting | Vercel |
| Package manager | **pnpm** (lockfile is `pnpm-lock.yaml` — do not run `npm install`) |
| Node engine | `>=20.18` (Vercel needs 20.x or 22.x in its dashboard) |

---

## 4. Session log

Most recent first.

### 2026-05-05 — Firebase data carry-over (Phase 2 + catalog port + migration tooling)

**Branch**: `entirelyNew`. Two commits pushed: `e1d4a11`, `7b0bfa1`.

**Phase 2 vertical slice** (commit `e1d4a11`):
- `/trick/[trickId]` — header stats, "How to" tips, your-history list, top-10 leaderboard inset, related tricks. Reads `users/{uid}/drills` + `users/{uid}/bests/{trickId}` + `leaderboards/{trickId}/entries`.
- `/profile` — 4-stat grid, weekly bar chart (hand-rolled SVG, no chart lib), strongest/weakest lists, achievements grid. Pure aggregator at `lib/firebase/profile.ts:aggregateProfile` is fully unit-tested.
- `/leaderboard` — two-pane trick list + top-50 table with the user's row highlighted.
- `/api/leaderboard` — Node-runtime POST with Bearer ID-token verify, **anti-fabrication drill-doc check** (server reloads `users/{uid}/drills/{drillId}` and asserts `score === "5/5"` + matching totalMs), transactional upsert that skips when an existing entry is faster.
- Discoverability: home recent-activity rows link to `/trick/[id]`; results page has a "Trick stats" button.

**52-trick catalog port** (in commit `e1d4a11`):
- Catalog rewritten from rebuild's 43 zero-padded IDs (`"01"`–`"43"`) to legacy production's 52 bare numeric IDs (`"1"`–`"52"`) so it matches live data in `csmidterm-5f652`.
- 26 generators reused with new keys, 26 ported from `main`'s `app/utils/problemGenerator.ts` (deterministic Mulberry32 instead of Math.random), 10 rebuild-only generators (Pythagorean triples, circle area, calendar day-of-week, clock angles, etc.) deleted.
- 52 tip entries in `lib/data/tips.ts`, all categorized.

**Migration tooling** (commit `7b0bfa1`):
- `lib/server/migration.ts` — pure transforms (`parseTimeToMs`, `formatMsToTime`, `deriveDisplayName`, `deriveAvatarInitials`) plus document-level `migrateUserProfile` / `migrateBest` / `migrateLeaderboardEntry` and the idempotent `migrateAll` runner. No firebase-admin imports — script-only.
- `scripts/migrate-data-to-rebuild.mjs` — `--dry-run`/`--apply`/`--verbose` CLI, Admin SDK init from `FIREBASE_SERVICE_ACCOUNT_KEY` or auto-detected `FIRESTORE_EMULATOR_HOST`. Requires `tsx` (or Node 22.6+ `--experimental-strip-types`) to load the `.ts` module from `.mjs`.
- `scripts/seed-emulator.mjs` — synthetic legacy dataset for local emulator testing (3 users, 5 bests each in legacy `{ time: "MM:SS.dd" }` shape, 5 leaderboard entries in legacy `{ uid, email, time, updatedAt }` shape).
- **Legacy-compat hardening**: `migrateBest` and `migrateLeaderboardEntry` spread the legacy input into their return value, so `time`, `email`, and any other legacy fields survive even without the runner's `set({ merge: true })`. Locked in by explicit tests.

**Other**:
- Composite Firestore index `(trickId asc, startedAt desc)` on `drills` for the new history query (in `firestore.indexes.json`, not yet deployed to prod).
- `.firebaserc` aligned to `csmidterm-5f652` (was `project-sense-dev`).
- `firebase-admin@13.8.0` added.
- Playwright config sets `FIRESTORE_EMULATOR_HOST` + `FIREBASE_AUTH_EMULATOR_HOST` so the Admin SDK auto-detects the emulator.

**Verified green**: `pnpm typecheck`, `pnpm test` (70/70 across 7 suites), `pnpm build` (9 routes).

### 2026-05-04 — Analytics + SEO + Firebase rules migration (on `main`)

Branch: `worktree-analytics` → merged to `main`. Project: `csmidterm-5f652`.

**Analytics** — Firebase Analytics SDK was dead code (only an import); now wired properly via `app/components/AnalyticsProvider.tsx` with a lazy `getAnalyticsClient()` (SSR-guarded by `isSupported()`) and a `trackEvent(name, params)` helper. Bound to user accounts via `setAnalyticsUser(uid)` on `onAuthStateChanged`. Vercel Analytics switched to the App-Router-aware `@vercel/analytics/next` import. Vercel Speed Insights v2 added.

Custom event taxonomy (all logged via `trackEvent`):
| Event | Where | Notes |
|---|---|---|
| `practice_session_completed` | end of `/home/practice/[id]` | only when `questions === 5 && questionLimited && !randomizer` |
| `leaderboard_submitted` | `app/components/updateLeaderboard.ts` after local `setDoc` | only on genuine new best |
| `multiplayer_game_completed` | `/multiplayer` `state === "ended"` | `won` = `players[uid].questionsSolved === 6` |
| `ai_test_generated` | `/testGen` after `setText(json)` | once per generated test |
| `ai_test_graded` | `/testGen` after `setResults(...)` | once per graded test |
| `login` | `/` and `/register` Google flow | GA4 reserved event; `method` = `password` or `google` |
| `sign_up` | `/register` and `/` Google flow (new users only) | GA4 reserved; new-user detection via Firestore `!snap.exists()` |

**SEO** — Replaced static `public/sitemap.xml` and `robots.txt` with Next.js conventions (`app/sitemap.ts` and `app/robots.ts`). Per-page metadata via `layout.tsx` server components for `/home`, `/leaderboard`, `/multiplayer`, `/register`, `/testGen`, `/twenty-four`, `/zetamac`. WebSite + Organization JSON-LD inlined in `app/layout.tsx` body. Expanded `openGraph` and `twitter` metadata fields.

**Firebase rules migration** — Rules in the Firebase Console were tightened. Old data layout was `users/{email}` + `leaderboard/{trickId}` map (client-writable). New layout requires `users/{uid}` (uid-keyed, owner-only), `users/{uid}/bests/{trickId}` subcollection, `users/{uid}/drills/{drillId}` (reserved, unused on `main`), `leaderboards/{trickId}/entries/{uid}` (world-readable, server-only writes), and RTDB `rooms/{code}` (auth-only).

Server-side writes added on `main`:
- `firebase/admin.ts` — lazy Admin SDK init from `FIREBASE_SERVICE_ACCOUNT_KEY`
- `app/api/leaderboard/route.ts` — POST handler verifies ID token, writes `leaderboards/{trickId}/entries/{uid}` only when faster
- `app/api/stats/route.ts` — POST handler increments `statistics/{kind}.total`

Migration script `scripts/migrate-firebase-data.mjs` ran: 3130 leaderboard entries copied. Email→uid mapped cleanly. Old `users/{email}` and `leaderboard/{trickId}` docs still present (`--delete-old` not yet run).

**Action items still pending on Vercel** (from that session):
- `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL` need adding (old non-`NEXT_PUBLIC_*` names won't resolve client-side).
- `FIREBASE_SERVICE_ACCOUNT_KEY` must be set Production-side or `/api/leaderboard` and `/api/stats` return 500.
- Mark `login` + `sign_up` as conversions in GA4. Register custom event params as custom dimensions: `trick_id`, `duration_ms`, `time_ms`, `players_count`, `won`, `score`, `number_correct`, `total`, `method`, `question_count`. Register `signup_date` as user-scoped custom dimension.
- Resubmit sitemap in Google Search Console.
- Optionally enable Vercel Speed Insights from the dashboard.

### 2026-05-04 — Phase 1 vertical slice (`entirelyNew`)

Login → Home → Drill → Results. 43 problem generators (deterministic Mulberry32). Answer validator (mathjs-based, fraction-aware). 16 Vitest specs incl. 430-problem round-trip. Playwright e2e for register → drill → results → home loop. Firebase config + rules + RTDB rules deployed. Commit `742c0de`.

Subsequent commit `c69c9dd` pinned the Node engine to `>=20.18` for Vercel.

---

## 5. Current state of `entirelyNew`

| Surface | Status |
|---|---|
| Theme port (`app/globals.css`) — tokens, animations, reduced-motion, responsive | ✅ |
| Three Google fonts via `next/font` (Space Grotesk + Instrument Serif + JetBrains Mono) | ✅ |
| App shell (`app/(app)/layout.tsx`) — collapsible sidebar persisted, topbar slot | ✅ |
| Tweaks panel — UI present, numerals + density wired live, theme switcher renders (sage default) | ✅ |
| Login (`app/(auth)/login/page.tsx`) — split-panel, Sign in / Create account, Zod validation, Google SSO | ✅ |
| Auth wiring (`hooks/useAuth.tsx`, `lib/firebase/auth.ts`, `lib/firebase/client.ts`) | ✅ |
| Home (`app/(app)/page.tsx`) — hero, stat cards, search/filter/density, 52-trick catalog, recent activity (links to `/trick/[id]`) | ✅ |
| Drill (`app/(app)/drill/[trickId]/page.tsx`) — rAF timer, generator, validator, save | ✅ |
| Results (`app/(app)/drill/[trickId]/results/page.tsx`) — per-question grid, "Trick stats" button | ✅ |
| **Trick Detail (`app/(app)/trick/[trickId]/page.tsx`)** | ✅ |
| **Profile (`app/(app)/profile/page.tsx`)** | ✅ |
| **Leaderboard (`app/(app)/leaderboard/page.tsx`)** | ✅ |
| **`/api/leaderboard` server route + Admin SDK init** | ✅ |
| 52 problem generators (deterministic, all ported from `main`'s legacy catalog) | ✅ |
| 52 tips, 8 achievement definitions | ✅ |
| Migration tooling (`lib/server/migration.ts` + `scripts/`) | ✅ |
| 70 Vitest specs across 7 suites | ✅ |
| Playwright e2e (`register-drill-flow`, `leaderboard-publish`) | ✅ written, needs emulator |
| Firebase config + rules + indexes | ✅ committed; rules same as live; new index NOT yet deployed |
| `firebase-admin@13.8.0` | ✅ |
| Phase 4 polish (analytics, SEO, Sentry) | ❌ — see §11 |
| Multiplayer / AI test / mini-games | ❌ — Phase 3 |
| Settings full wiring (sound, haptics, keypad orientation, theme variants beyond sage) | ❌ — Phase 4 |

**Verified green** at HEAD `7b0bfa1`: `pnpm typecheck`, `pnpm test` (70/70), `pnpm build` (9 routes).

---

## 6. Current state of `main` (legacy, deployed)

Still serving production traffic. All features functional given the post-rules-migration code. Reads `users/{uid}/bests/{trickId}.time` (string), `leaderboards/{trickId}/entries/{uid}.{email,time}`, queries `orderBy("time", "asc")`. Writes are non-merge `setDoc` calls — they overwrite the doc rather than merging, so post-migration legacy writes will drop the rebuild's new fields on those individual docs. Re-running the migration before final cutover refreshes any drift.

---

## 7. Firebase setup

### Project

- ID: `csmidterm-5f652`
- Auth methods enabled: Email/Password (Google SSO needs to be confirmed in console)
- Firestore + RTDB: production mode
- Shared between `main` and `entirelyNew` deliberately

### Firestore rules (deployed; identical across branches)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /drills/{drillId}   { allow read, write: if request.auth != null && request.auth.uid == uid; }
      match /bests/{trickId}    { allow read, write: if request.auth != null && request.auth.uid == uid; }
    }
    match /leaderboards/{trickId}/entries/{uid} {
      allow read: if true;
      allow write: if false;       // server-side only via Admin SDK (bypasses rules)
    }
  }
}
```

### RTDB rules

`rooms/{code}` requires auth for read/write. Reserved for Phase 3 multiplayer.

### Composite indexes

`firestore.indexes.json` declares:
- `drills` collection: `(trickId asc, startedAt desc)` — required by `getDrillsForTrick` on `entirelyNew`. **Not yet deployed.** Run `firebase deploy --only firestore:indexes` before promoting `entirelyNew` to production. Additive — doesn't affect `main` reads.

### Server routes (live on `main`, mirrored on `entirelyNew`)

| Route | Purpose | Verifies | Writes |
|---|---|---|---|
| `/api/leaderboard` | Publish a new best | Bearer ID token + drill-doc match (rebuild only — `main`'s version trusts the body) | `leaderboards/{trickId}/entries/{uid}` if faster |
| `/api/stats` (main only) | Increment global counters | Nothing (no token check) | `statistics/{questions_answered\|questions_generated}.total` |

`entirelyNew` does NOT yet have `/api/stats`. Decision: defer, since per-user `attempts` and `correct` already track the same information per drill in `users/{uid}/bests`.

---

## 8. Data model

The rebuild's schema is canonical going forward, but legacy fields are preserved during migration so `main` continues to work.

### `users/{uid}` (owner-only r/w)

| Field | Source | Used by |
|---|---|---|
| `email` | legacy + ongoing | both |
| `questionLimited`, `rightLeft`, `autoEnter` | legacy settings | `main` only (rebuild stores tweaks in localStorage) |
| `displayName` | rebuild + migrated from email local-part | rebuild |
| `school` | rebuild (default `""`) | rebuild |
| `avatarInitials` | rebuild (derived) | rebuild |
| `createdAt`, `lastActiveAt` | rebuild | rebuild |

### `users/{uid}/drills/{drillId}` (owner-only r/w)

Rebuild-only; `main` doesn't write here. Shape:
```
{ trickId, startedAt, totalMs, score: "5/5", perQuestion: PerQuestion[] }
```
Used by Trick Detail history query and the server-side anti-fabrication check on `/api/leaderboard`.

### `users/{uid}/bests/{trickId}` (owner-only r/w)

Trick IDs are bare numeric strings `"1"`–`"52"`.

| Field | Source | Used by |
|---|---|---|
| `time: "MM:SS.dd"` | legacy + preserved by migration | `main` |
| `bestMs: number` | rebuild | rebuild |
| `attempts: number` | rebuild (seed = 1 on migration) | rebuild |
| `correct: number` | rebuild (seed = 5 on migration) | rebuild |
| `lastAttemptAt: Timestamp` | rebuild | rebuild |

### `leaderboards/{trickId}/entries/{uid}` (world-readable, server-only writes)

| Field | Source | Used by |
|---|---|---|
| `uid` | both | both |
| `email` | legacy + preserved | `main` |
| `time: "MM:SS.dd"` | legacy + preserved | `main` (`orderBy("time", "asc")`) |
| `bestMs: number` | rebuild | rebuild (`orderBy("bestMs", "asc")`) |
| `displayName` | rebuild | rebuild |
| `school` | rebuild | rebuild |
| `updatedAt: Timestamp` | both | both |

### `statistics/{questions_answered|questions_generated}` (server-only)

Only `main` reads/writes. `entirelyNew` ignores this collection.

### `rooms/{code}` (RTDB, auth required)

Reserved for Phase 3 multiplayer.

---

## 9. Project layout (`entirelyNew`)

```
app/
  layout.tsx                                # root layout, fonts, providers
  globals.css                               # full design-token + animation port
  providers.tsx                             # Auth + Tweaks context (client)
  (auth)/
    layout.tsx                              # redirects authed users → /
    login/page.tsx                          # split-panel login + register
  (app)/
    layout.tsx                              # sidebar + topbar shell, auth gate
    page.tsx                                # home (52-trick catalog)
    drill/[trickId]/
      page.tsx                              # fullscreen drill
      results/page.tsx                      # per-question grid + retry + Trick stats button
    trick/[trickId]/page.tsx                # Trick Detail
    profile/page.tsx                        # Profile
    leaderboard/page.tsx                    # Leaderboard
  api/
    leaderboard/route.ts                    # Node-runtime POST, anti-fabrication

components/sense/
  Sidebar.tsx, TopBar.tsx, TrickCard.tsx, TweaksPanel.tsx, FloatingNumbers.tsx, DrillProblem.tsx

hooks/
  useAuth.tsx, useTweaks.tsx, useTimer.ts, useKeyboardNav.ts

lib/
  data/
    tricks.ts                               # 52 tricks, IDs "1"–"52"
    categories.ts
    tips.ts                                 # 52 entries
    achievements.ts                         # 8 thresholds
  drill/
    problemGenerator.ts                     # 52 generators + Mulberry32
    answerValidator.ts                      # mathjs-based, fraction-aware
    utils.ts                                # formatTime, randInt, makeRng
  firebase/
    client.ts                               # singleton init + emulator wiring
    auth.ts                                 # signIn/Up/Google, ensureUserDoc
    drills.ts                               # saveDrillResult (transactional), get*, publishToLeaderboard
    admin.ts                                # Admin SDK init (server-only)
    leaderboard.ts                          # getLeaderboardForTrick
    profile.ts                              # getProfileStats + aggregateProfile (pure)
  server/
    leaderboard.ts                          # publishLeaderboardEntry (pure-ish, deps injected)
    migration.ts                            # pure transforms + migrateAll runner
  types.ts
  utils.ts                                  # cn = twMerge(clsx())

scripts/
  migrate-data-to-rebuild.mjs               # legacy → rebuild migration runner
  seed-emulator.mjs                         # synthetic legacy data for emulator

__tests__/
  problemGenerator.test.ts                  # 52 × 10 × 5 = 2600-problem round-trip
  answerValidator.test.ts                   # 10 specs
  profile.test.ts                           # 10 specs (aggregateProfile)
  leaderboardClient.test.ts                 # 3 specs
  leaderboardRoute.test.ts                  # 11 specs
  migration.test.ts                         # 23 specs (pure transforms)
  migrationRunner.test.ts                   # 7 specs (migrateAll integration)

e2e/
  register-drill-flow.spec.ts
  leaderboard-publish.spec.ts

firebase.json, firestore.rules, database.rules.json, firestore.indexes.json, .firebaserc
next.config.ts                              # turbopack root pinned
playwright.config.ts                        # webServer + emulator host envs
vitest.config.ts, vitest.setup.ts
```

---

## 10. Environment

`.env.local` is **gitignored** (excluded by `.env*` rule with `!.env.local.example` exception). Required variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID         # optional, for Firebase Analytics → GA4
NEXT_PUBLIC_USE_EMULATOR                    # "true" → SDK connects to local emulators

# Server-only (do NOT prefix with NEXT_PUBLIC_)
FIREBASE_SERVICE_ACCOUNT_KEY                # JSON for Admin SDK; required by /api/leaderboard and migration script

# Phase-3 (not yet wired)
NEXT_PUBLIC_GEMINI_API_KEY
```

> **⚠ Security note:** `FIREBASE_SERVICE_ACCOUNT_KEY` is a private key with full project admin access. Never commit it (gitignored). In Vercel: paste as a server-only secret without the `NEXT_PUBLIC_` prefix.

---

## 11. Environment quirks (Windows + corporate network)

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` hangs forever, no progress | Corp SSL inspection (Zscaler-style) — Node doesn't trust the substituted root CA | Set `NODE_OPTIONS=--use-system-ca`. Permanently: `[System.Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--use-system-ca", "User")`, restart shell |
| `pnpm install` shows `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Same SSL issue | Same flag. Pnpm surfaces the error more clearly |
| `firebase login` fails with `auth.firebase.tools/attest` | Same SSL issue | Same flag. Use `firebase login --no-localhost` if needed |
| `firebase emulators:start` errors `Java version before 21` | Old/missing JDK | `winget install Microsoft.OpenJDK.21`, restart shell. JDK 21.0.10 is currently installed |
| `pnpm build` exits with code `3221225477` | Windows access violation in Turbopack worker — usually Defender/OneDrive locking files mid-build | Clear `.next/`, exclude project folder from Defender realtime scan, or pause OneDrive sync |
| Vercel: "invalid Node.js Version: '18.x'" | Vercel project pinned to retired Node 18 | Vercel dashboard → Settings → General → Node.js Version → switch to 22.x. `engines.node >=20.18` already declared |
| `next lint` plugin conflict from inside `.claude/worktrees/...` | Walking up to parent's `.eslintrc.json` | Lint from the parent main checkout |

---

## 12. Common commands

```sh
# Dev (frontend only — Firebase emulator needs a separate terminal if NEXT_PUBLIC_USE_EMULATOR=true)
pnpm dev                                            # http://localhost:3000

# Emulators (separate terminal)
pnpm emulators                                      # auth/firestore/database
# UI: http://localhost:4000 — Auth: 9099 — Firestore: 8080 — RTDB: 9000

# Tests (no servers needed)
pnpm typecheck
pnpm test                                           # 70 specs as of HEAD
pnpm test:watch

# E2E (drives a browser; needs emulator)
pnpm exec playwright install chromium               # one-time
pnpm e2e:emulators                                  # boots emulator + runs spec, cleanest

# Production build / deploy
pnpm build                                          # next build (Turbopack)
firebase deploy --only firestore:rules,firestore:indexes,database
git push                                            # Vercel auto-deploys on push to its Production Branch

# Migration tooling (rebuild only)
pnpm add -D tsx                                     # one-time, required by the migration script
node scripts/seed-emulator.mjs                      # seed synthetic legacy data into emulator
pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --dry-run     # read-only count
pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply       # actual migration
pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply --verbose

# Add a package — DO NOT use npm install
pnpm add <pkg>                                      # production
pnpm add -D <pkg>                                   # dev only
```

---

## 13. What's left

| Phase | Scope | Effort |
|---|---|---|
| **Cutover** | Run migration `--apply` on prod (legacy stays alive thanks to dual-shape preservation), promote `entirelyNew` in Vercel when ready | <1 day |
| **Phase 3** | Multiplayer (RTDB-backed live race lanes, room codes, lobby), AI Test (`/api/generate-test` + `/api/grade-test` calling Anthropic, sticky side panel, 2-column paper layout), Mini-games (Twenty-Four, Zetamac) | ~2 weeks |
| **Phase 4** | Settings full wiring (sound effects, haptics, keypad orientation), theme variants beyond sage (arcade/ink/mono), Firebase Analytics + GA4 events (port the helpers from `main`'s `firebase/config.js`), Vercel Speed Insights, sitemap/JSON-LD/per-route metadata, Sentry | ~1 week |

**Recommended order**: cut over to `entirelyNew` once you've verified the migration end-to-end against the emulator, then Phase 4 polish (especially analytics — easy port from `main`), then Phase 3.

---

## 14. Operational checklist (cutover)

In order. Steps 1–9 are safe; only step 10 (the production `--apply`) actually changes prod data.

1. **Save work** — already done (commits `e1d4a11`, `7b0bfa1` pushed to `entirelyNew`).
2. **Verify Vercel's Production Branch is `main`** — Vercel Dashboard → Project → Settings → Git. So pushing `entirelyNew` only creates preview deploys.
3. **Install `tsx`** — `pnpm add -D tsx`. Required by the migration script.
4. **Generate a service account key** — Firebase Console → Project Settings → Service accounts → "Generate new private key". Save the JSON locally.
5. **Set `FIREBASE_SERVICE_ACCOUNT_KEY`**:
   - **Vercel**: Project → Settings → Environment Variables → add the JSON as a single-line string, scope: Production + Preview, server-only (do NOT prefix `NEXT_PUBLIC_`).
   - **Local `.env.local`**: same line, lets you run the migration script.
   - After adding to Vercel, redeploy `main` once so its `/api/leaderboard` and `/api/stats` finally work (they were 500-ing without the key).
6. **Local smoke test against emulator** (recommended): `pnpm emulators` + `node scripts/seed-emulator.mjs` + `pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply` + `pnpm dev`. Walk register → drill → profile → leaderboard.
7. **Deploy the new Firestore composite index**: `firebase deploy --only firestore:indexes`. Additive, doesn't affect `main`.
8. **Production dry-run**: `pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --dry-run`. Inspect the counts. Investigate any non-zero `errors`.
9. **Production apply**: `pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply`. **Legacy `main` keeps working** — `time`/`email`/legacy settings are preserved on every doc.
10. **When ready to cut over**: re-run `--apply` once more (refreshes any docs the legacy app overwrote since step 9), then change Vercel's Production Branch to `entirelyNew`. The rebuild's URL replaces the legacy app on the same domain.

---

## 15. Decisions log

| Decision | Reasoning |
|---|---|
| pnpm over npm | npm install hung on corporate network; pnpm surfaced the SSL error clearly. Lockfile is `pnpm-lock.yaml` |
| Firebase over Convex/Supabase | User explicitly said "keep Firebase for now" |
| Next.js 16 (latest) | "Modern stack". `engines.node >=20.18` declared |
| Tailwind v4 | Shipped with `create-next-app`. Tokens go under `:root` + `@theme inline` |
| All-CSS animations (not motion/react in Phase 1) | Prototype's animations are battle-tested; faster to port than re-orchestrate |
| Vertical slice phasing | User chose this in brainstorming over "all-screens-visual-only first" |
| Static problem generator vs runtime call | All 52 generators deterministic + seeded. Test asserts every generated answer round-trips through validator |
| `firebase-tools` not in devDeps | 60MB+ install. User has it globally; e2e:emulators script just calls global `firebase` |
| shadcn CLI not initialized | Phase 1+2 didn't need any shadcn primitives; the design uses pure CSS classes |
| Trick IDs bare `"1"`–`"52"` (no zero-padding) on `entirelyNew` | Matches legacy production data exactly. No migration ID translation needed |
| Drop rebuild's net-new tricks (Pythagorean, calendar, clock angles, etc.) | User wanted the catalog to match legacy production exactly |
| Migration uses `set({ merge: true })` AND `...legacy` spread | Belt + suspenders. Spread guarantees legacy field preservation at the function level even if a future change drops merge mode |
| Server-side `/api/leaderboard` does drill-doc verification (rebuild only) | Closes the trust loop: server reloads `users/{uid}/drills/{drillId}` and asserts 5/5 + matching totalMs before publishing |
| `.firebaserc` shared with `main` (`csmidterm-5f652`) | User confirmed: same Firebase project, data carries over, rebuild is wired differently |
| Defer analytics + SEO + Sentry to Phase 4 | Migration-day blast radius stays small. Easy to port from `main`'s patterns later |
| Defer global stats counter (`/api/stats`) | Per-user `attempts`/`correct` in `users/{uid}/bests` already track the same info |

---

## 16. Quick troubleshooting

- **App is at `/login` but won't sign in** → Firebase Console → Authentication → Sign-in method → confirm Email/Password is enabled.
- **"Missing or insufficient permissions"** → rules not deployed: `firebase deploy --only firestore:rules,database`.
- **Login works but home shows no stats** → fresh user, no drills yet. Run a drill first.
- **`pnpm dev` runs but pages 404** → make sure you're on branch `entirelyNew`, not `main`.
- **Vercel deploy still failing on Node 18** → set the version in Vercel dashboard, not just `engines` field.
- **Tests fail randomly** → are you running with `NODE_OPTIONS=--use-system-ca`? Some CI environments need it.
- **`/api/leaderboard` returns 500** → `FIREBASE_SERVICE_ACCOUNT_KEY` not set in Vercel.
- **Migration script errors `Cannot find module 'lib/server/migration.ts'`** → install `tsx`: `pnpm add -D tsx`. Run via `pnpm exec tsx scripts/...`.
- **Legacy `/leaderboard` page goes blank after migration `--apply`** → shouldn't happen; the migration preserves `time`/`email` via merge + spread. If it does, run the dry-run again and inspect — likely a malformed legacy doc.
- **Browser console: `FirebaseError: Missing App configuration value`** → Vercel env vars use the wrong names. Add `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.

---

## 17. Useful URLs

- Repo: <https://github.com/henry-tran07/projectSense/tree/entirelyNew>
- Latest commits on `entirelyNew`:
  - `e1d4a11` Phase 2 + 52-trick catalog port
  - `7b0bfa1` Migration tooling
- Firebase Console: <https://console.firebase.google.com/project/csmidterm-5f652>
- Firestore data: <https://console.firebase.google.com/project/csmidterm-5f652/firestore/data>
- Auth users: <https://console.firebase.google.com/project/csmidterm-5f652/authentication/users>
- Vercel dashboard: <https://vercel.com/dashboard>
- Emulator UI (when running): <http://localhost:4000>
