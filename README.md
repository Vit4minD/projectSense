# Project Sense

A practice gym for UIL Number Sense — drill the canon, race your friends, sit full AI-generated papers.

Feature-complete: a 52-trick practice catalog with timed drills and personal bests, a world (login-gated) leaderboard, real-time multiplayer races (RTDB), AI-generated full-length papers (Gemini, locally graded), two mini-games (Twenty-Four, Zetamac), plus profile stats, analytics, and SEO.

> `PROJECT_CONTEXT.md` is the exhaustive source of truth (data model, security posture, cutover runbook). This README is the quick-start.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Firebase Auth + Firestore + RTDB · firebase-admin · Gemini (`@google/generative-ai`) · mathjs · KaTeX · motion · Vitest · Playwright · Vercel.

## Getting started

> **One-time SSL note:** if you're behind a corporate SSL inspection proxy, prepend every Node command with `NODE_OPTIONS=--use-system-ca` so Node trusts the certificates already in your OS store. The scripts below work as-is on a clean machine; add the flag if you hit `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.

```sh
pnpm install
cp .env.local.example .env.local         # fill in your Firebase web config
pnpm dev                                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the Next dev server (Turbopack). |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |
| `pnpm typecheck` | `tsc --noEmit` over the whole repo. |
| `pnpm lint` | ESLint (Next core-web-vitals + TypeScript). |
| `pnpm test` | Vitest unit suites — `__tests__/*.test.ts`. |
| `pnpm test:watch` | Vitest in watch mode. |
| `pnpm test:rules` | Firestore + RTDB security-rules tests against the emulator (`rules-tests/`). |
| `pnpm emulators` | Start the Firebase Local Emulator Suite (auth + firestore + database). |
| `pnpm e2e` | Playwright e2e specs against a running dev server. |
| `pnpm e2e:emulators` | Wraps Playwright in `firebase emulators:exec` — the recommended way to run e2e locally. |

## Project layout

```
app/
  layout.tsx                 root layout, fonts, providers
  globals.css                full design-system port (tokens, components, animations)
  providers.tsx              Auth + Tweaks context
  (auth)/login/page.tsx      sign-in / register screen
  (app)/layout.tsx           sidebar + topbar shell, auth gate
  (app)/page.tsx             home (52-trick catalog)
  (app)/drill/[trickId]/…    drill + results
  (app)/trick/[trickId]/     trick detail
  (app)/leaderboard, profile
  (app)/multiplayer/…        real-time races (RTDB rooms)
  (app)/test/                AI-generated papers
  (app)/games/…              twenty-four, zetamac
  api/{leaderboard,generate-test,grade-test}/route.ts   server routes (Admin SDK, Gemini, rate-limited)
  error.tsx, global-error.tsx, not-found.tsx            error boundaries
components/sense/            sense-specific UI (Sidebar, TrickCard, DrillProblem, Room*, AITest*, …)
hooks/                       useAuth, useTweaks, useTimer, useRoom, useAITest, useTwentyFour, useZetamac, …
lib/
  data/                      tricks (52), categories, tips, achievements
  drill/                     problemGenerator, answerValidator, utils
  games/                     twentyFour, hands24, zetamac
  firebase/                  client, auth, drills, admin, leaderboard, profile, rooms, analytics
  server/                    aiTest, geminiKey, rateLimit, leaderboard, migration
  types.ts                   shared types
__tests__/                   Vitest specs
rules-tests/                 Firebase security-rules tests (emulator)
e2e/                         Playwright specs
scripts/                     data migration + emulator seed
firebase.json, firestore.rules, database.rules.json   Firebase config
```

## Firebase setup

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Enable **Email/Password** and **Google** auth providers.
3. Enable **Firestore** and **Realtime Database** in production mode.
4. Add a Web app, copy the config snippet into `.env.local`.
5. `pnpm exec firebase login` → `pnpm exec firebase use <project-id>`.
6. Deploy rules: `pnpm exec firebase deploy --only firestore:rules,database`.

For local development, `pnpm emulators` starts the suite at:
- Auth UI: <http://localhost:9099>
- Firestore: localhost:8080
- RTDB: localhost:9000
- Emulator UI: <http://localhost:4000>

Set `NEXT_PUBLIC_USE_EMULATOR=true` in `.env.local` to route the SDK at the emulators.

## Smoke test

1. `pnpm emulators` and `pnpm dev` in two terminals (with `NEXT_PUBLIC_USE_EMULATOR=true`).
2. Visit `http://localhost:3000` → redirects to `/login`.
3. Click **Create account**, register with any email/password/school.
4. Land on home with empty stats and the full 52-trick catalog.
5. Click **Multiplying by 11** → drill page → answer 5 problems (timer running, pips advancing, auto-enter on correct).
6. Land on results page with per-question grid, total time, suggested next; a 5/5 run publishes to the leaderboard.
7. **Back to tricks** → home now shows the drill in *Recent activity*, the trick has its `bestMs` populated.
8. Spot-check the other surfaces: `/multiplayer` (two windows), `/test` (needs a Gemini key), `/games/twenty-four`, `/games/zetamac`.
