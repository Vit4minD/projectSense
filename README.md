# Project Sense

A practice gym for UIL Number Sense — drill the canon, race your friends, sit full AI-generated papers.

This repo is a **Phase 1 vertical slice**: Login → Home → Drill → Results, end-to-end with real Firebase auth, Firestore drill history, and accurate timing. Phases 2–4 add Leaderboard, Profile, Trick Detail, Multiplayer, AI Test, Mini-games.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Firebase Auth + Firestore (+ RTDB reserved for Phase 3) · mathjs · KaTeX · motion · Vitest · Playwright.

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
| `pnpm test` | Vitest unit suites — `__tests__/*.test.ts`. |
| `pnpm test:watch` | Vitest in watch mode. |
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
  (app)/page.tsx             home (trick catalog)
  (app)/drill/[trickId]/page.tsx
  (app)/drill/[trickId]/results/page.tsx
components/sense/            sense-specific UI (Sidebar, TrickCard, DrillProblem, …)
hooks/                       useAuth, useTweaks, useTimer, useKeyboardNav
lib/
  data/                      tricks, categories
  drill/                     problemGenerator, answerValidator, utils
  firebase/                  client, auth, drills
  types.ts                   shared types
__tests__/                   Vitest specs
e2e/                         Playwright specs
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

## Phase 1 acceptance flow

1. `pnpm emulators` and `pnpm dev` in two terminals (with `NEXT_PUBLIC_USE_EMULATOR=true`).
2. Visit `http://localhost:3000` → redirects to `/login`.
3. Click **Create account**, register with any email/password/school.
4. Land on home with empty stats and the full 43-trick catalog.
5. Click **Multiplying by 11** → drill page → answer 5 problems (timer running, pips advancing, auto-enter on correct).
6. Land on results page with per-question grid, total time, suggested next.
7. **Back to tricks** → home now shows the drill in *Recent activity*, the trick has its `bestMs` populated.
