# Project Sense — Engineering Metrics

Verified on **2026-08-18** against branch `entirelyNew` (commit `09539a8`) by running the
commands noted beside each figure. Numbers marked **(post-launch)** only accrue once the
app is deployed and receiving real traffic.

Project Sense is a full-stack practice gym for UIL Number Sense — a from-scratch rebuild in
Next.js 16 (App Router) / React 19 / TypeScript with Firebase Auth, Firestore, and Realtime
Database, deployed on Vercel.

## Scale & quality (verifiable today)

- **184 automated unit tests across 19 suites**, green. `corepack pnpm test`
- **23 Firebase security-rule assertions** run against the Firebase Local Emulator Suite
  (Firestore + RTDB). `corepack pnpm test:rules`
- **Playwright end-to-end coverage** of the core register → drill → results → leaderboard
  flow plus a per-route smoke test that loads all 12 user-facing routes against a production
  build and asserts zero uncaught runtime errors. `corepack pnpm e2e`
- **68 pages built; all 52 trick pages pre-rendered as static HTML (SSG)** for search
  indexing, with `sitemap.xml` + `robots.txt` emitted. `corepack pnpm build`
- **0 production dependency vulnerabilities.** `corepack pnpm audit --prod`
- **Strict TypeScript, zero lint errors.** `corepack pnpm typecheck` / `corepack pnpm lint`

## Performance

- Replaced `mathjs` with the ~8 KB **fraction.js** for client-side answer checking and the
  Twenty-Four game, and removed unused dependencies (`motion`, `katex`, `react-katex`) —
  cutting client-bundle weight on the drill, multiplayer, and games routes.
- **Real-user Web Vitals** captured via Vercel Speed Insights. **(post-launch)**

## Security & privacy

- Hardened Firebase rules: participant-gated realtime rooms (rooms can't be enumerated), a
  names-free public lobby index, schema/range validation on every write, and **server-only
  leaderboard writes** through an admin-SDK API route.
- Per-user, in-memory **rate limiting** on the AI-test endpoints (generate 10/min, grade
  60/min → HTTP 429).
- Privacy-preserving identity: non-identifying handles for Google sign-in; server-side
  sanitization of display name and school.

## Analytics & data (this pass)

- **16 distinct GA4 event types** spanning the full product funnel — auth (`login`,
  `sign_up`), practice (`drill_started`, `practice_session_completed`), AI tests, both
  mini-games (`game_started` / `game_completed`), multiplayer lifecycle (room created /
  joined / race started / completed), settings changes, and SPA `page_view` on every route
  change — plus Vercel Analytics and Speed Insights.
- A public **`/stats` page** surfacing live aggregate usage (registered players, drills
  completed, questions answered, leaderboard entries) computed with Firestore **count
  aggregations** via the admin SDK — no new client-write surface. Totals are **(post-launch)**.

## Delivery

- **55 commits** on the rebuild branch ahead of the legacy `main` deployment.
- Continuous verification gates (typecheck, lint, unit, security-rule, and e2e suites) all
  green before merge.
