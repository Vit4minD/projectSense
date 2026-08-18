# Project Sense — Source of Truth

A self-contained snapshot of the project. Replaces and consolidates the earlier
`PROJECT_CONTEXT.md`, `ANALYTICS_SEO_CONTEXT.md`, and
`FIREBASE_RULES_MIGRATION_CONTEXT.md` dumps. Includes the full session log so a
future agent (or you, returning cold) can resume without re-deriving anything.

Last updated: 2026-08-18.

---

## 0. Pickup point for the next session

**Where we are right now (2026-08-18 — major hardening + review pass):**
- Branch: `entirelyNew`. Since the 2026-05 Phase 4 work, a large hardening + review pass landed (see the new **§21** for the full list): all dependencies upgraded to latest, Firebase rules hardened, an in-memory Gemini rate-limit, error boundaries, three real bugs fixed via browser QA, a 5-dimension adversarial code review with its confirmed findings fixed, a single-typeface (Nunito) redesign to cut visual noise, and public server-rendered trick pages for SEO. Full details in §21.
- Gates green: `corepack pnpm typecheck` clean, `corepack pnpm test` **173/173 across 14 suites**, `corepack pnpm lint` 0 errors, **`corepack pnpm audit --prod` CLEAN (0 vulnerabilities)**. Firebase security rules verified against the emulator (`corepack pnpm test:rules`, 23 assertions). Core register→drill→results→leaderboard e2e passes against a production build + emulator.
- **Production build confirmed deploy-ready** (`corepack pnpm build`): 68 pages, incl. all **52 `/trick/{id}` prerendered as static HTML (SSG)** for SEO; `sitemap.xml` + `robots.txt` emitted; no errors. Branch `entirelyNew` is **pushed to `origin`** (working tree clean).
- **Deployment** is Vercel-on-push to the Production Branch. It is NOT yet cut over — production still serves `main`. To go live: set the Vercel env vars (§18/§20), then flip the Production Branch to `entirelyNew`. The build itself needs no further code work.
- 52-trick catalog and production data migration done 2026-05-05 (unchanged).
- Legacy `main` deployment is still live on Vercel — intentional, the rebuild has **not** been cut over yet. Branches are now just `main` + `entirelyNew` (the `worktree-analytics` and `postGradUpdates-integration` branches were deleted).

**The rebuild is feature-complete and hardened.** Remaining work is (a) the operational cutover (your hands — §18/§20: rotate the Gemini key, set Vercel env vars, deploy rules, flip the Production Branch) and (b) manual 2-window/real-Gemini browser QA of multiplayer, AI test, and the mini-games (couldn't be automated here). Verify against a Vercel preview after pushing.

**🚨 Cutover ordering — deploy rules only at the branch flip:**
`database.rules.json` was substantially hardened (participant-gated `rooms/{code}` reads, a names-free `roomIndex` for the public lobby, join/`solved`/room-field validation; Firestore leaderboard reads now require auth). Deploying these while legacy `main` is still live would break legacy multiplayer (it doesn't write a `host` field and reads `/rooms` directly). Run `firebase deploy --only firestore:rules,database` **immediately before** flipping the Vercel Production Branch — not earlier. See §18/§20.

**🔑 Gemini key — rotate at cutover (mandatory):**
`lib/server/geminiKey.ts` already refuses the `NEXT_PUBLIC_GEMINI_API_KEY` fallback in production. Before go-live: revoke the old key, add a server-only `GEMINI_API_KEY` to Vercel + `.env.local`, and delete any `NEXT_PUBLIC_GEMINI_API_KEY`. The old key sits in earlier git history and previously-shipped bundles, so rotation is required regardless.

**Verified vs. NOT (2026-08 pass):**
- ✅ **Verified** in a real browser (production build + Firebase emulator): register → drill (5/5) → results → home, and leaderboard publish (both Playwright specs pass). Login/home/drill visually reviewed after the single-font change. Firestore + RTDB rules verified via `pnpm test:rules` (23 emulator assertions). 173 unit tests + build green; `pnpm audit --prod` clean.
- ⚠️ **NOT yet exercised** — needs a real browser / two windows / a real Gemini key, best on a Vercel preview: multiplayer lobby→race→ended in **2 windows** (incl. host-closes-tab recovery + private-room confidentiality with a third account); `/test` generate+grade against **real Gemini**; Twenty-Four / Zetamac keyboard+timer+sound/haptics; tweaks-panel themes; sitemap/robots/JSON-LD served in prod; GA4 events end-to-end.

**Next session — do this in order:**
1. `git push origin entirelyNew` (all commits are local) → open the Vercel preview.
2. Manual-QA the ⚠️ list above on the preview; fix any UI bugs found.
3. Run the cutover (§18/§20): rotate Gemini key → set Vercel env vars → `firebase deploy --only firestore:rules,database` → **then** flip the Production Branch. Post-cutover: GA4 conversions/dimensions, resubmit sitemap.
4. (Optional) wire Sentry (`npx @sentry/wizard@latest -i nextjs`); add the deferred multiplayer finish-timestamp winner + double-count guard; broaden multiplayer/AI-test e2e.

**Environment gotchas (a fresh session WILL hit these):** invoke pnpm as **`corepack pnpm`** (not on PATH); `next dev` 403s static chunks in the QA sandbox — verify against a **production build** (`next build` + `next start`), not `next dev`; Firebase/emulator commands need `NODE_OPTIONS=--use-system-ca`; run the emulator via `corepack pnpm dlx firebase-tools@latest emulators:exec …` (firebase CLI isn't global). Full command examples in §12 and §21.

**Open decisions / loose ends:**
- Leaderboard privacy (updated 2026-08): reads now require auth (no longer world-readable); Google sign-in uses a non-identifying handle (email local-part), not the real name; `displayName`/`school` are sanitized server-side. `school` is still shown to signed-in users — revisit if that's too much for the audience.
- Whether to run the legacy migration's `--delete-old` to reclaim Firestore quota on the old `users/{email}` and `leaderboard/{trickId}` map docs. Safe to skip indefinitely.
- Legacy `main`'s leaderboard/best writes are non-merge `setDoc`, so post-migration legacy submissions drop the rebuild's new fields on those docs. Re-running the migration right before cutover refreshes any drift (§18). Not a problem until cutover day.
- Multiplayer specifics: 5-char codes from a 31-letter alphabet (no `0/1/I/O/L`), seed-based deterministic problems, first-to-5 wins, no leaderboard tie-in, no server-side answer verification (client-trusted, `solved` is rule-capped to +1/racing). 2026-08 added host-disconnect recovery + a Leave button; still deferred: mid-race *reconnect/resume*, a stale-lobby-cleanup Cloud Function, and finish-timestamp winner attribution (winner is currently earliest-joined among finishers).
- **AI Test v1 scope decisions** (locked 2026-05-11): 40 questions; UIL scoring `5*last - 9*(last - correct)`; Gemini `gemini-2.0-flash` server-side (NOT Anthropic — user override of §3 stack note); local grading via existing `equals()`, NO second AI call for grading; no Firestore writes, no leaderboard tie-in, no per-test persistence.
- **Twenty-Four v1 scope** (locked 2026-05-11): 60s timer, +5s and +5pts per solve, 1362-hand precomputed dict (legacy was bigger than estimated), keyboard support (1-4 select, +-*/ ops, Enter combine, Backspace reset, Esc skip), end-of-game modal.
- **Zetamac v1 scope** (locked 2026-05-11): user-configurable operators (toggle each on/off, last one disabled), 4 range pairs, duration 60/120/300/custom (30-900s). Highscore + config persisted in `localStorage` (`zetamac:highscore:v1`, `zetamac:config:v2`). No Firestore tie-in.

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
| `entirelyNew` | From-scratch rebuild | Phase 1-3 complete (practice, leaderboard, multiplayer, AI test, mini-games). **Not yet deployed.** Phase 4 polish pending. |
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
| AI test gen | `@google/generative-ai` SDK + Gemini `gemini-2.0-flash`, **server-side** (user override 2026-05-11 — stack note originally said Anthropic; user opted for Gemini to reuse existing API key) |
| Math eval | **fraction.js** (client answer-checking + Twenty-Four). mathjs was removed in the 2026-08 pass — see §21 |
| Math render | plain text (KaTeX/react-katex were unused and removed in 2026-08) |
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

### 2026-05-14 — Phase 4 (analytics, SEO, settings, Sentry scaffold)

**Branch**: `entirelyNew`. Single commit `1a0d8ae` on top of `a000aeb`.

Closed out Phase 4. Rebuild is now production-ready pending the operational checklist in §18. No production-side actions taken — every Firebase deploy, Vercel branch flip, key rotation, and migration re-run is left for the user.

**SEO**:
- `app/sitemap.ts` + `app/robots.ts` (Next.js conventions). Sitemap covers `/`, `/login`, `/leaderboard`, `/multiplayer`, `/test`, `/games`, `/games/{twenty-four,zetamac}`, `/profile`. Build outputs `/sitemap.xml` and `/robots.txt` as static routes.
- Root layout: `metadataBase`, title template `%s | Project Sense`, full `openGraph` + `twitter` metadata, `robots: { index: true, follow: true }`. WebSite + Organization JSON-LD inline-rendered in body.
- Per-route `layout.tsx` server components for `/login`, `/leaderboard`, `/multiplayer`, `/games`, `/games/twenty-four`, `/games/zetamac`, `/profile`. `/trick/[trickId]` uses `generateMetadata` to read the trick name from the catalog.
- `/test` already had `layout.tsx` from Phase 3 — left alone.
- `public/projectSenseLogo.png` copied from `main` for og/jsonld references.

**Analytics**:
- `lib/firebase/analytics.ts` — lazy `getAnalyticsClient` (dynamic-imports `firebase/analytics` only when measurementId is set + `isSupported()` succeeds), `trackEvent`, `setAnalyticsUser`, `setAnalyticsUserProperties`. Cleanly no-ops on SSR or when env var is absent.
- `components/sense/AnalyticsProvider.tsx` — mounted in root layout, binds the user's UID on `onAuthStateChanged` and stamps `signup_date` user property.
- `@vercel/analytics/next` `<Analytics />` and `@vercel/speed-insights/next` `<SpeedInsights />` mounted at the body root.

**GA4 event taxonomy** (matches `main`'s patterns):
| Event | Where | Params |
|---|---|---|
| `practice_session_completed` | `lib/firebase/drills.ts` after `runTransaction` commits | `trick_id`, `duration_ms`, `number_correct`, `total`, `score` |
| `leaderboard_submitted` | `lib/firebase/drills.ts` after `/api/leaderboard` returns ok | `trick_id`, `time_ms` |
| `multiplayer_game_completed` | `components/sense/RoomEnded.tsx` mount effect | `trick_id`, `players_count`, `won` |
| `ai_test_generated` | `hooks/useAITest.ts` after `setPaper` | `question_count` |
| `ai_test_graded` | `hooks/useAITest.ts` after `setGrade` | `score`, `number_correct`, `total` |
| `login` | `lib/firebase/auth.ts` (email + Google existing user) | `method` = `password` \| `google` |
| `sign_up` | `lib/firebase/auth.ts` (email + Google new user) | `method` = `password` \| `google` |

`signInWithGoogle` returns the new-vs-existing flag from `ensureUserDoc` and routes to `sign_up` vs `login` accordingly.

**Settings**:
- `Tweaks` type gains `soundEffects: boolean` and `haptics: boolean`. `useTweaks` defaults both to `true`, persists to `localStorage["sense:tweaks"]`, reflects to `<html data-sound|data-haptics>`.
- `lib/effects.ts` — `playCorrectSound()`, `pulseHaptic()`, `celebrateCorrect()`. Helpers read the live `data-*` attrs (no React hook needed). Sound preloads `/correctSound.mp3`; haptics calls `navigator.vibrate(20)`.
- Wired into `app/(app)/drill/[trickId]/page.tsx` (`commitAnswer` on correct), `hooks/useZetamac.ts` (`setInputValue` when `correct === true`), `hooks/useTwentyFour.ts` (`combine` when `outcome === "solved"`).
- `public/correctSound.mp3` copied from `main`.
- `TweaksPanel` exposes Sound + Haptics rows alongside the existing Theme/Numerals/Density rows.
- **Theme variants**: `globals.css` `[data-theme="ink"]` and `[data-theme="mono"]` previously inherited `:root` (no-op). Now both have real palette overrides — `ink` is high-contrast cream + deep orange, `mono` is pure black/white. `arcade` was already painted.
- **Keypad orientation**: NOT wired. Legacy `main` had a `rightLeft` toggle for an on-screen numeric keypad; the rebuild's drill UI is a single text input with no on-screen keypad widget. Implementing this would be a fake setting until/unless we add a keypad widget. Dropped from scope; mention it in any roadmap discussion.

**Sentry scaffold** (DSN-pending, safe by default):
- `@sentry/nextjs@10.53.1` installed.
- `sentry.client.config.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts` each guard on the DSN env var — when unset, `Sentry.init` is never called, so the SDK no-ops entirely.
- `instrumentation.ts` (Node.js + Edge) and `instrumentation-client.ts` (browser) wire the configs into Next.js's instrumentation hook. `captureRequestError` is re-exported as `onRequestError` per Next 16 convention.
- `next.config.ts` is **NOT wrapped** with `withSentryConfig`. Source-map upload requires `SENTRY_AUTH_TOKEN` and a real org/project slug — leave that to the user to run `npx @sentry/wizard@latest -i nextjs` when they have a Sentry project.
- `.env.local.example` documents `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `GEMINI_API_KEY`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.

**Verified green** at HEAD (`1a0d8ae`):
- `pnpm typecheck` clean
- `pnpm test` 165/165 across 12 suites (no test changes; existing analytics no-op path means trackEvent stays inert in vitest's jsdom env)
- `pnpm build` 19 routes (added `/sitemap.xml` + `/robots.txt`)

**NOT verified**: browser walk for any of the new surfaces. Particularly:
1. Tweaks panel toggling sound + haptics actually plays the chime / vibrates
2. Switching theme to `ink` or `mono` re-paints the canvas correctly across all routes
3. JSON-LD passes Google's Rich Results test
4. `sitemap.xml` and `robots.txt` resolve correctly behind Vercel's routing
5. GA4 events fire and land in the property (needs measurementId + GA4 DebugView)

**Quirks / decisions**:
- Analytics module dynamic-imports `firebase/analytics` only on first call to keep the initial JS bundle lean. The first `trackEvent` after sign-in pays a one-time ~25KB chunk fetch.
- `trackEvent`/`setAnalyticsUser` swallow all errors — analytics must never affect product behavior. Tests pass without measurementId because the no-op short-circuit fires before any dynamic import.
- Sentry left dormant intentionally. The wizard is the sanctioned way to wire the webpack plugin + auth token; running it is interactive (asks for project slug) so it can't be done in this session.
- Keypad-orientation tweak intentionally dropped — see Settings note above.

### 2026-05-11 — Phase 3 remainder (AI Test + Twenty-Four + Zetamac)

**Branch**: `entirelyNew`. Uncommitted as of writing — file list under §17.

Built the rest of Phase 3: AI test generator (`/test`) and the two mini-games (`/games/twenty-four`, `/games/zetamac`) plus a `/games` index. Phase 3 is now complete.

**Dispatch shape**: Two rounds of parallel agents per the multiplayer recipe. Round 1 (3 parallel agents) shipped backend cleanly: A1 (AI Test backend), A2 (Twenty-Four core, 1362-hand dict), A3 (Zetamac core). Round 2 (3 parallel agents) **all stalled at 600s** with zero progress; UI work was completed directly in-stream instead. Result is identical to what the agents would have produced.

**AI Test (`/test`)**:
- **Server-side Gemini** via `@google/generative-ai` (model `gemini-2.0-flash`). Two POST routes: `/api/generate-test` (auth-required, Bearer ID token via `getAdminAuth().verifyIdToken`) and `/api/grade-test` (same auth).
- Generation uses Gemini's structured-output mode (`responseMimeType: "application/json"` + `responseSchema`). One retry on shape mismatch before returning `upstream-failed`.
- **Local grading, not AI**: this is the rebuild's biggest improvement over legacy. Gemini returns canonical answer forms (`form: integer|fraction|mixed|decimal|base|ratio|other`, plus `base` field when applicable); grading uses existing `equals()` from `lib/drill/answerValidator.ts`. Saves a Gemini round-trip and removes model-vs-model disagreement.
- UIL scoring: `score = lastQuestion * 5 - 9 * (lastQuestion - correct)`. Blanks count as wrong if they're before the last answered.
- 40 questions, 10 UIL category buckets (basic arithmetic, fractions, percentages, square roots, base conversions, word problems, number theory, algebra, geometry, sequences/patterns), ≥3 per bucket required in the prompt.
- UI: idle → generating → taking (single-column scroll, 40 rows of `[badge] [prompt] [input]`) → submitting → results (3-pane: your-answers / answer-key / sticky score card). Error state with retry.
- Env: reads `process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY`. The fallback exists so the existing key works; long-term need a server-only `GEMINI_API_KEY` (see §0 warning).

**Twenty-Four (`/games/twenty-four`)**:
- Pure state machine in `lib/games/twentyFour.ts`. Hands dict `lib/games/hands24.ts` (1362 solvable multisets, ported from `worktree-analytics/app/twenty-four/dict.ts`). mathjs Fraction arithmetic for exact ratios (so `3/7` displays as `3/7` not `0.428...`).
- 60s timer, +5s and +5pts per solve. State-driven `idle | running | ended`.
- **Keyboard support** (improvement over legacy click-only): `1-4` select tiles, `+/-/*/x//` operators, `Enter` combine, `Backspace` reset selection, `Esc` skip hand.
- End-of-game modal (legacy had none): final score, hands solved, Play Again + Back to Games.
- RNG: next hand derived from `(seed + solvedCount)` to keep state JSON-serializable (no closure in state).

**Zetamac (`/games/zetamac`)**:
- Pure state machine in `lib/games/zetamac.ts`. RNG per problem derived from `(seed + score * 0x9e3779b1)` (golden-ratio scramble to avoid adjacent-problem correlation when seed is small).
- **Full user-configurable config** (chosen 2026-05-11 over duration-only): operator toggles (last-checked one is disabled), per-operator range pairs (addition operands, subtraction operands, mul-A, mul-B, div-divisor, div-quotient), duration 60/120/300/custom (30-900s). Validated via `validateConfig` before persisted.
- Persistence: `localStorage["zetamac:config:v2"]` (config), `localStorage["zetamac:highscore:v1"]` (highscore). No Firestore tie-in.
- Auto-advance UX: clear input + generate next problem the instant `parseFloat(input) === answer`.
- Three views: pre-game config panel → fullscreen drill → end card with Play Again + Settings + Back to Games.

**Files added** (new, ~20 net):
- `lib/server/aiTest.ts`, `app/api/generate-test/route.ts`, `app/api/grade-test/route.ts`
- `lib/games/twentyFour.ts`, `lib/games/hands24.ts`, `lib/games/zetamac.ts`
- `app/(app)/test/page.tsx`, `app/(app)/test/layout.tsx`
- `app/(app)/games/page.tsx`, `app/(app)/games/twenty-four/page.tsx`, `app/(app)/games/zetamac/page.tsx`
- `components/sense/AITestPaper.tsx`, `components/sense/AITestResults.tsx`, `components/sense/TwentyFourBoard.tsx`, `components/sense/ZetamacBoard.tsx`
- `hooks/useAITest.ts`, `hooks/useTwentyFour.ts`, `hooks/useZetamac.ts`
- Tests: `__tests__/aiTest.test.ts` (26), `__tests__/twentyFour.test.ts` (26), `__tests__/zetamac.test.ts` (26)
- `lib/types.ts` appended three banded sections (`// === AI Test ===`, `// === Twenty-Four ===`, `// === Zetamac ===`) with all new types
- `app/globals.css` appended three CSS bands (~600 LOC) for the new surfaces; no raw Tailwind utilities (design-token CSS classes consistent with `.drill`, `.btn`, `.trick-card`)

**Dependencies added**: `@google/generative-ai@^0.24.1`. `zod@^3.23.8` was already present.

**Verified green** (HEAD = uncommitted on `entirelyNew`):
- `pnpm typecheck` clean
- `pnpm test` **165/165 across 12 suites** (+78 from previous baseline of 87 across 9)
- `pnpm build` **17 routes** (+6 from previous 11: `/test`, `/games`, `/games/twenty-four`, `/games/zetamac`, `/api/generate-test`, `/api/grade-test`)

**NOT verified**: real browser walk for any of the three new surfaces. Smoke test against `pnpm emulators` + `pnpm dev` before committing or pushing.

**Quirks / decisions**:
- `lib/games/hands24.ts` is 1362 tuples not 681 — the legacy `dict.ts` had double what the original plan estimated. Typed as `readonly (readonly [number,number,number,number])[]`; large but doesn't trip the TS2590 union-too-complex limit.
- A1's grading test for decimal tolerance was changed from `0.333` vs `1/3` to `0.5` vs `1/2` because `equals()` uses a 1e-9 epsilon and `0.333` isn't within tolerance of `1/3 = 0.3333…`.
- Twenty-Four's combine result ordering matches legacy (`[6,6,6,6]` + `0,1`+ → `[6,6,12]`, NOT `[12,6,6]`) — filter-then-append pattern.
- `format(fractionLike, { fraction: 'ratio' })` emits `"12/1"` for integers; the formatter strips trailing `/1` so display shows `"12"` not `"12/1"` while keeping `"1/3"` etc.
- Round 2 agents all stalled; built UI in-stream. Single rebuild was faster than three retries.

### 2026-05-10 — Phase 3 multiplayer port

**Branch**: `entirelyNew`. Single commit on top of `e70f965`.

Ported the legacy `/multiplayer` feature from `main` to the rebuild, redesigned around the rebuild's tooling. Key shape and improvements over the legacy implementation:
- **Race format**: first to 5 questions wins (matches drill convention; legacy was 6).
- **Problem distribution**: shared seed in the RTDB room doc. Every client calls `generate(trickId, seed, 5)` locally → identical problems, no host-trust, no answer leak in the room doc. Legacy stored the actual problems + answers in RTDB.
- **Room discovery**: code-only invites for private games + a live public-game list (host picks visibility on create). Legacy showed everything to everyone.
- **No leaderboard tie-in**: multiplayer wins don't touch `users/{uid}/bests` or `leaderboards/{trickId}/entries`. Matches legacy intent, avoids sandbag-to-farm incentives.
- **Auto-cleanup**: 30s after `state === "ended"`, any subscribed viewer's cleanup `useEffect` deletes the room. No Cloud Function needed.

**Files added** (12 net new + 2 modified):
- `lib/types.ts` — appended `Room`, `RoomPlayer`, `RoomState`, `RoomVisibility`.
- `lib/multiplayer/roomCode.ts` — pure `generateRoomCode()` / `normalizeRoomCode()`; 5-char codes from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no `0/1/I/O/L`).
- `lib/firebase/rooms.ts` — all RTDB ops (`createRoom`, `joinRoom`, `leaveRoom`, `incrementSolved`, `startRace`, `endRace`, `deleteRoom`, `subscribeRoom`, `subscribePublicRooms`, `setTrick`, `setVisibility`, `resetRoom`). Host-only transactions guard top-level mutations.
- `hooks/useRoom.ts` — subscribes to `rooms/{code}`.
- `hooks/usePublicRooms.ts` — subscribes to public lobby rooms.
- `app/(app)/multiplayer/page.tsx` — main menu (Create / Join by Code / Find Public + live public-room list).
- `app/(app)/multiplayer/[code]/page.tsx` — orchestrator that routes on `room.state`.
- `components/sense/RoomLobby.tsx`, `RoomRace.tsx`, `RoomEnded.tsx`, `RoomLane.tsx` — UI subcomponents.
- `database.rules.json` — tightened rules: host-only top-level writes, player-only own-write, `.indexOn ["visibility", "state"]`. **NOT yet deployed** — wait for cutover day per §14.
- Tests: `__tests__/roomCode.test.ts` (5 specs), `__tests__/rooms.test.ts` (12 specs, `vi.mock("firebase/database")` based RTDB stub).

**Reuses** (no changes): `generate(trickId, seed, count)` from `lib/drill/problemGenerator.ts:624`; `equals()` from `lib/drill/answerValidator.ts`; `DrillProblem`, `useTimer`, `useAuth`, `lib/firebase/client.ts:getRtdb()`.

**Verified green**: `pnpm typecheck`, `pnpm test` (**87/87** across 9 suites, +17 from previous baseline of 70), `pnpm build` (**11 routes** — added `/multiplayer` static + `/multiplayer/[code]` dynamic).

**NOT verified**: browser walk. Smoke test in 2 incognito windows against `pnpm emulators` before merging — typecheck and units don't catch UI issues.

**Dispatch shape**: Built via the `/dispatching-parallel-agents` skill in 2 rounds of parallel agents:
- Round 1 (3 agents): roomCode utility + tests, RTDB rules update, types + rooms.ts + tests.
- Round 2 (2 agents): hooks + menu page, room view + 4 components.
Each agent worked on disjoint file sets with locked-in contracts (hook signatures spec'd in both Round 2 prompts) so no merge conflicts.

### 2026-05-05 — Production migration applied

`scripts/migrate-data-to-rebuild.mjs --apply` ran against `csmidterm-5f652`. Production data is now in **dual-shape state**: every doc has both legacy (`time`, `email`, legacy settings) and rebuild (`bestMs`, `displayName`, `school`, etc.) fields. Legacy app on `main` keeps working unchanged.

| Metric | Count |
|---|---|
| User profiles touched | 1670 |
| Bests reshaped | 3194 (3192 written, 2 skipped malformed) |
| Leaderboard entries reshaped | 3130 |
| Errors | 2 (malformed `time` strings) |
| Elapsed | 14m41s |

**The 2 errors** belong to a single user `x7LAlhSshua1oPHNGyLZPrREVqf1` — bests docs `1` and `11` had corrupted negative-component time values (`"-1:-11.-63"` and similar). The runner skipped them; their broken `time` is preserved as-is. Practical impact: those two best times don't migrate to `bestMs`. Everything else for that user migrated normally. Safe to ignore unless you want to clean them up manually in Firebase Console.

**Operational note for migrations on this machine**: required `NODE_OPTIONS=--use-system-ca` because of the corp SSL inspection — without it, both the emulator JAR download and the Admin SDK's gRPC connection to Google APIs fail with "unable to verify the first certificate." Set it permanently per §11.

Pre-flight steps completed during this session:
- Step 6 — local emulator smoke test verified migration is idempotent (re-run yields 0 errors and same final state)
- Step 7 — `firebase deploy --only firestore:indexes` deployed the `(trickId, startedAt desc)` composite on `drills`
- Step 8 — production dry-run reported the counts above with 0 unexpected anomalies
- Step 9 — production `--apply` completed cleanly (the run summarized in this entry)

**Remaining**: only step 10 — the cutover (Vercel Production Branch flip from `main` to `entirelyNew`). Whenever you decide.

### 2026-05-05 — Firebase data carry-over (Phase 2 + catalog port + migration tooling)

**Branch**: `entirelyNew`. Three commits pushed: `e1d4a11`, `7b0bfa1`, `c793dad`. User also added `74d0840 Add tsx for migration script` between commits.

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
| Tweaks panel — theme (sage/ink/mono/arcade — all paint distinct palettes), numerals, density, sound, haptics, all wired live | ✅ |
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
| **165 Vitest specs across 12 suites** | ✅ |
| Playwright e2e (`register-drill-flow`, `leaderboard-publish`) | ✅ written, needs emulator |
| Firebase config + rules + indexes | ✅ committed; rules same as live; new index NOT yet deployed |
| `firebase-admin@13.8.0`, `@google/generative-ai@0.24.1` | ✅ |
| **Multiplayer (`/multiplayer`, `/multiplayer/[code]`, RTDB `rooms/{code}`)** | ✅ shipped 2026-05-10 |
| **AI Test Generator (`/test`, `/api/generate-test`, `/api/grade-test`)** | ✅ shipped 2026-05-11 |
| **Twenty-Four mini-game (`/games/twenty-four`)** | ✅ shipped 2026-05-11 |
| **Zetamac mini-game (`/games/zetamac`)** | ✅ shipped 2026-05-11 |
| **`/games` index page** | ✅ shipped 2026-05-11 |
| **Settings — sound, haptics, theme variants (ink/mono/arcade with real palettes)** | ✅ shipped 2026-05-14 |
| **Firebase Analytics + GA4 event taxonomy + AnalyticsProvider** | ✅ shipped 2026-05-14 |
| **SEO — sitemap.ts, robots.ts, JSON-LD, per-route metadata** | ✅ shipped 2026-05-14 |
| **Vercel Analytics + Speed Insights** | ✅ shipped 2026-05-14 |
| **Sentry SDK + instrumentation scaffold (DSN-pending; wizard pending)** | ✅ shipped 2026-05-14 |
| Settings: keypad orientation | ✖ dropped — rebuild's drill UI has no on-screen keypad widget; toggle would be inert. Revisit if a keypad widget is added. |

**Verified green** at HEAD (`1a0d8ae`): `pnpm typecheck`, `pnpm test` (165/165), `pnpm build` (19 routes — added `/sitemap.xml` + `/robots.txt`).

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
- `drills` collection: `(trickId asc, startedAt desc)` — required by `getDrillsForTrick` on `entirelyNew`. **Deployed 2026-05-05.** Additive — doesn't affect `main` reads.

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
| `firebase login --reauth` succeeds in browser but errors `Unable to fetch the CLI MOTD and remote config` | Non-fatal; corp SSL blocks the motd fetch but the auth itself worked | Verify with `firebase login:list`. If actually broken, set `NODE_OPTIONS=--use-system-ca` and retry |
| `firebase emulators:exec` fails to download `cloud-firestore-emulator-*.jar` | Same SSL issue blocking `storage.googleapis.com` | Set `NODE_OPTIONS=--use-system-ca` for that command |
| `migrate-data-to-rebuild.mjs --dry-run` errors `unable to verify the first certificate` | Same SSL issue blocking the Admin SDK's gRPC to Google APIs | Same flag |
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
| **Browser verification** | Smoke-test the new + Phase-4 surfaces (multiplayer, /test, /games/twenty-four, /games/zetamac, tweaks panel sound/haptics/themes, JSON-LD validity, sitemap.xml/robots.txt) against `pnpm emulators` + `pnpm dev` or a Vercel preview. Fix any UI bugs found. | <½ day |
| **Cutover** | See §18 for the operational checklist. The user owns these steps — they touch production. | <1 day |
| **Sentry full integration** | Run `npx @sentry/wizard@latest -i nextjs`, set `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` in Vercel. Scaffold is already in place; wizard will wrap `next.config.ts` and configure source-map upload. | ~30 min |

Phase 3 is ✅ complete as of 2026-05-11. Phase 4 is ✅ complete as of 2026-05-14 (commit `1a0d8ae`).

**Recommended order**: browser-verify the rebuild on a Vercel preview → run §18 cutover checklist → optionally finish Sentry wizard.

---

## 14. Operational checklist (cutover)

| # | Step | Status |
|---|---|---|
| 1 | Save work to `origin/entirelyNew` | ✅ commits `e1d4a11`, `7b0bfa1`, `74d0840`, `c793dad` |
| 2 | Verify Vercel's Production Branch is `main` | ✅ |
| 3 | `pnpm add -D tsx` | ✅ commit `74d0840` |
| 4 | Generate service account key in Firebase Console | ✅ |
| 5 | Set `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel + `.env.local` | ✅ |
| 6 | Local emulator smoke test | ✅ idempotency verified — 2026-05-05 |
| 7 | `firebase deploy --only firestore:indexes` | ✅ |
| 8 | Production `--dry-run` | ✅ 1670 profiles / 3194 bests / 3130 entries / 2 known errors |
| 9 | Production `--apply` | ✅ 14m41s, exit 0 — 2026-05-05 |
| 10 | Cutover — re-run `--apply`, deploy new RTDB rules, then flip Vercel Production Branch to `entirelyNew` | ⏳ deferred |

### Step 10 (when ready)

```sh
NODE_OPTIONS=--use-system-ca pnpm exec tsx --env-file=.env.local scripts/migrate-data-to-rebuild.mjs --apply
firebase deploy --only database
```

Then in Vercel: Settings → Git → change Production Branch from `main` to `entirelyNew`. Same domain serves the rebuild.

**Order matters for the RTDB rules deploy**: do it at the same moment you flip the Vercel branch, not before. The new rules (added 2026-05-10 for multiplayer) require a `host` field on every `rooms/{code}` doc; legacy `main`'s multiplayer code doesn't write a `host` field, so deploying the rules while `main` is still live would `PERMISSION_DENIED` legacy multiplayer's top-level updates.

The re-run refreshes any docs the legacy app on `main` has overwritten since step 9 (legacy writes are non-merge `setDoc`, so they drop the rebuild's new fields on the docs they touch). Idempotent skip on already-migrated docs makes this fast.

### Reference command (migrations on this machine)

The migration script needs both the system-CA flag (corp SSL) and the env-file flag (Node CLI doesn't auto-load `.env.local`):

```sh
NODE_OPTIONS=--use-system-ca pnpm exec tsx --env-file=.env.local scripts/migrate-data-to-rebuild.mjs <flag>
```

Replace `<flag>` with `--dry-run`, `--apply`, or `--apply --verbose`.

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
  - `74d0840` Add tsx for migration script
  - `c793dad` docs: consolidate context dumps into a single source of truth
  - `e70f965` docs: add 'Pickup point for the next session' header
  - `18cd2fa` Phase 3: Multiplayer (RTDB rooms, lobby, race, ended)
  - `a000aeb` Phase 3: AI Test + Twenty-Four + Zetamac
  - `1a0d8ae` Phase 4: analytics, SEO, settings wiring, Sentry scaffold
- Firebase Console: <https://console.firebase.google.com/project/csmidterm-5f652>
- Firestore data: <https://console.firebase.google.com/project/csmidterm-5f652/firestore/data>
- Auth users: <https://console.firebase.google.com/project/csmidterm-5f652/authentication/users>
- Vercel dashboard: <https://vercel.com/dashboard>
- Emulator UI (when running): <http://localhost:4000>

---

## 18. Cutover actions for the user

These steps touch production — the rebuild leaves them for you intentionally. Run in this order on cutover day. Nothing here is required for the rebuild's local code or tests to work; everything below is purely operational.

### Pre-flight (anytime before cutover, no impact on prod)

1. **Browser smoke-test the rebuild** — push `entirelyNew` to GitHub, let Vercel build a preview, then walk through:
   - Sign in (email + Google) → home → run a 5/5 drill → verify leaderboard publish
   - `/multiplayer` → create + join in 2 incognito windows → race → ended state
   - `/test` → generate (needs `GEMINI_API_KEY` in the preview env) → submit → results
   - `/games/twenty-four` and `/games/zetamac` → keyboard handlers, timer, end modal
   - Tweaks panel — toggle sound, haptics, switch themes (sage/ink/mono/arcade)
   - DevTools → Application tab → confirm `sense:tweaks` persists
   - View source on the home page → confirm WebSite + Organization JSON-LD blocks
   - Visit `/sitemap.xml` and `/robots.txt` directly
2. **Vercel env vars** — add anything missing to the preview/production environment in the Vercel dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (enables GA4)
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (server-only — `/api/leaderboard` returns 500 without it)
   - `GEMINI_API_KEY` (server-only — see step 3)
   - `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` (only if you've created a Sentry project)
3. **Rotate the Gemini key** — `NEXT_PUBLIC_GEMINI_API_KEY` is currently exposed in the client bundle. Add a server-only `GEMINI_API_KEY` to `.env.local` + Vercel with the same value, then in Google AI Studio rotate the original key and remove the `NEXT_PUBLIC_` variant entirely. The `/api/generate-test` route reads `GEMINI_API_KEY` first, falls back to the public one — once both are set, it'll prefer the safe one transparently.

### Cutover day (each step is irreversible without rollback)

4. **Re-run the data migration** to refresh any drift from legacy writes since 2026-05-05:
   ```sh
   NODE_OPTIONS=--use-system-ca pnpm exec tsx --env-file=.env.local scripts/migrate-data-to-rebuild.mjs --apply
   ```
   Idempotent — already-migrated docs are skipped.

5. **Deploy the new RTDB rules**:
   ```sh
   firebase deploy --only database
   ```
   ⚠ This is the moment legacy `main`'s multiplayer breaks (it doesn't write a `host` field, which the new rules require). Do this *immediately* before the Vercel branch flip, not before.

6. **Flip the Vercel Production Branch** — Vercel dashboard → Settings → Git → Production Branch: change `main` → `entirelyNew`. Same domain serves the rebuild on the next deploy. Vercel will auto-deploy on the next push, or trigger one manually.

### Post-cutover (anytime after)

7. **Mark GA4 conversions** — in GA4 → Admin → Events, mark `login` and `sign_up` as conversions.
8. **Register custom dimensions** — GA4 → Admin → Custom definitions → register these event-scoped params:
   - `trick_id`, `duration_ms`, `time_ms`, `players_count`, `won`, `score`, `number_correct`, `total`, `method`, `question_count`
   - And user-scoped: `signup_date`
9. **Resubmit the sitemap** — Google Search Console → Sitemaps → submit `https://project-sense.vercel.app/sitemap.xml`.
10. **(Optional) Wire Sentry fully** — once you've created a Sentry project:
    ```sh
    npx @sentry/wizard@latest -i nextjs
    ```
    The wizard wraps `next.config.ts` with `withSentryConfig`, sets up source-map upload, and adds `SENTRY_AUTH_TOKEN`. Scaffolding (`sentry.*.config.ts`, `instrumentation.ts`, `instrumentation-client.ts`) is already in place — the wizard will detect and reuse it.
11. **(Optional)** Run the legacy migration's `--delete-old` to reclaim Firestore quota on the old `users/{email}` and `leaderboard/{trickId}` map docs. Safe to skip indefinitely.
12. **(Optional)** Manually clean up the 2 corrupt-time docs on user `x7LAlhSshua1oPHNGyLZPrREVqf1` from the Firebase Console — see §4 (2026-05-05 entry).

### Rollback

If the rebuild misbehaves after cutover, flip the Vercel Production Branch back to `main`. The data migration is additive (preserves all legacy fields), so legacy `main` keeps working. The only thing the legacy app loses on rollback is multiplayer — because the new RTDB rules now require a `host` field that legacy doesn't write. To fully rollback multiplayer, either re-deploy the old permissive rules or accept that multiplayer is dark on legacy until you patch it. (Single-player practice + leaderboard + AI test all keep working on `main` regardless.)

---

## 19. Security audit + env-var classification

Last audit: 2026-05-14 (this session).

### API routes

| Route | Method | Auth | Validation | Notes |
|---|---|---|---|---|
| `/api/leaderboard` | POST | Bearer ID-token via `getAdminAuth().verifyIdToken` | Zod (`PublishBody`) + trick-ID whitelist + drill-doc verify (server reloads `users/{uid}/drills/{drillId}` and asserts `score === "5/5"` and `\|totalMs - claimed\| ≤ 50ms`) | Transactional upsert; skips when existing entry is faster. Server-only writes (Firestore rules deny client writes to leaderboards). Runtime: `nodejs`, `force-dynamic`. |
| `/api/generate-test` | POST | Bearer ID-token | Auth-only (no body); Gemini structured output validated by Zod + custom checks | Reads Gemini key via `lib/server/geminiKey.ts` — production refuses to fall back to `NEXT_PUBLIC_GEMINI_API_KEY`. |
| `/api/grade-test` | POST | Bearer ID-token | Zod (`GradeBody`, paper.questions length must be 40) | Local grading via `equals()`; no LLM call. |

**No rate limiting** — all three routes rely on the auth gate (signed-in users only) plus upstream quotas (Gemini's per-key quota for generation, Firestore's per-project quota for leaderboard). For higher-traffic deploys, consider Vercel's Rate Limit middleware or `@upstash/ratelimit`.

**Response shapes**: errors return `{ ok: false, code, message, issues? }` with HTTP statuses mapped via `statusCodeFor()` (401 no/bad token, 400 bad request / unknown trick, 409 stale-or-fabricated, 500 internal, 502 upstream-failed). Error messages never leak the bearer token, the service account key, or the Gemini key.

### Firebase rules

**Firestore** (`firestore.rules`): owner-only on `users/{uid}` + subcollections (`drills`, `bests`); leaderboards world-readable + write-denied (server-only via Admin SDK, which bypasses rules).

**RTDB** (`database.rules.json`): `rooms/{code}` requires auth for read; writes require either (a) the doc doesn't exist AND the new payload's `host` equals the auth uid (initial create), or (b) the existing doc's `host` equals the auth uid (subsequent updates). Player slots scoped to own UID. Indexed on `visibility` + `state`. Tightened 2026-05-14: previously the create case allowed any auth user to assign `host` to anyone — minor griefing surface fixed.

### Environment variable matrix

| Var | Where | Visibility | Why | Set in Vercel as |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `lib/firebase/client.ts` | **PUBLIC** | Firebase web SDK config; security comes from rules + Auth, not from secrecy. Designed to be public. | All envs (Production/Preview/Development) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lib/firebase/client.ts` | **PUBLIC** | Same | All envs |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lib/firebase/client.ts`, `lib/firebase/admin.ts` (emulator path) | **PUBLIC** | Public identifier | All envs |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `lib/firebase/client.ts` | **PUBLIC** | Public identifier | All envs |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `lib/firebase/client.ts` | **PUBLIC** | Public identifier | All envs |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `lib/firebase/client.ts` | **PUBLIC** | Public identifier | All envs |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `lib/firebase/client.ts` | **PUBLIC** | Public URL | All envs |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `lib/firebase/analytics.ts` | **PUBLIC** | GA4 measurement ID; intended to be public | Production + Preview (omit Development) |
| `NEXT_PUBLIC_USE_EMULATOR` | `lib/firebase/client.ts` | **PUBLIC** | Build-time toggle ("true" → connect SDK to local emulator). Just a bool. | Development only (or omit; defaults false) |
| `NEXT_PUBLIC_SENTRY_DSN` | `sentry.client.config.ts` | **PUBLIC** | Sentry DSN is intentionally public — it's how the browser SDK identifies the project | Production + Preview |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `lib/firebase/admin.ts`, `scripts/migrate-data-to-rebuild.mjs` | 🔒 **SERVER-ONLY** | Service account JSON with full project admin rights. Leaking this = takeover. | Production + Preview (sensitive). Use Vercel's Sensitive flag if available. NEVER set with `NEXT_PUBLIC_` prefix. |
| `GEMINI_API_KEY` | `lib/server/geminiKey.ts` (preferred) → `app/api/generate-test/route.ts` | 🔒 **SERVER-ONLY** | Gemini private API key | Production + Preview |
| `SENTRY_DSN` | `sentry.server.config.ts`, `sentry.edge.config.ts` | 🔒 **SERVER-ONLY** preferred (DSN is technically safe public, but server-side avoids redundancy) | Same value as `NEXT_PUBLIC_SENTRY_DSN`; the server runtime also reports errors | Production + Preview |
| `SENTRY_AUTH_TOKEN` | (set by `@sentry/wizard`, used at build for source-map upload) | 🔒 **SERVER-ONLY** | Sentry org-scoped token; allows uploading source maps | Production + Preview |
| `NEXT_PUBLIC_GEMINI_API_KEY` | `lib/server/geminiKey.ts` (dev fallback only) | ⚠ **REMOVE** | Public-prefixed Gemini key. Currently kept as a dev fallback for local work. **In production, the route IGNORES this var** (since 2026-05-14) and logs an error to alert you. | **DELETE from Vercel after rotating the key** — see Action below. |

### Action: Gemini key rotation (do this before cutover)

The current `.env.local` may only have `NEXT_PUBLIC_GEMINI_API_KEY`. Even though `lib/server/geminiKey.ts` no longer reads it in production, every prior build that *did* read it has shipped JS bundles where Next.js inlined the value. You must rotate:

1. In Google AI Studio → API keys → revoke the existing key.
2. Generate a fresh key.
3. In Vercel → Project Settings → Environment Variables:
   - Add `GEMINI_API_KEY` = `<fresh-key>` to Production + Preview (no `NEXT_PUBLIC_` prefix).
   - **Delete** any existing `NEXT_PUBLIC_GEMINI_API_KEY` entry.
4. In `.env.local` (locally): same — set `GEMINI_API_KEY=<fresh-key>` and remove `NEXT_PUBLIC_GEMINI_API_KEY`.
5. Redeploy (Vercel will auto-deploy on the next push, or trigger one manually).

After this, `/api/generate-test` reads only the safe key and the public-prefixed var is gone from the bundle.

### NEXT_PUBLIC_ vs server-only — how it actually works

- `NEXT_PUBLIC_*` vars are **inlined at build time** into the JS bundles Next.js ships to the browser. Anyone can read them via DevTools → Sources or `console.log(process.env.NEXT_PUBLIC_X)`. Rotating one of these means a redeploy + rebuild.
- Vars without the prefix are **resolved at runtime** server-side. They never appear in client bundles. Rotating one means updating Vercel's env, then redeploying (or triggering an env-only redeploy from the dashboard) — no source change required.
- Vercel sets `VERCEL_ENV` to `production` / `preview` / `development` at runtime, so server code can branch on it (e.g., `geminiKey.ts` does this).
- A var set in Vercel with the `NEXT_PUBLIC_` prefix is treated as a build-time constant — its value participates in build caching. Changing it without bumping the deploy can yield stale bundles.

### Service account key handling

- `FIREBASE_SERVICE_ACCOUNT_KEY` must be the **whole JSON service account file**, on a single line (no newlines).
- Vercel env var values cap at ~64KB; a service account JSON is comfortably under that (~2KB).
- When Vercel mounts it into the Node runtime, `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)` in `lib/firebase/admin.ts` reconstructs the credentials object.
- Locally, leave it unset and run `firebase emulators:start` — `lib/firebase/admin.ts` auto-detects `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` and skips credential init.
- If the var is missing in a deployed environment, every server route that touches the Admin SDK throws on first call with the message: *"FIREBASE_SERVICE_ACCOUNT_KEY is required..."* — the route then returns a 500.

### Open security trade-offs (intentional)

- **No per-user rate limit on `/api/generate-test`**. The auth gate prevents anonymous abuse; a determined signed-in user can still spend Gemini quota by spamming. Acceptable for v1; revisit if the bill is unexpected. Mitigation if needed: `@upstash/ratelimit` keyed by uid.
- **Multiplayer host can technically write to other players' RTDB slots**. The top-level `.write` rule grants the host write access to the whole `rooms/{code}` subtree, which includes nested player slots. In practice, the rebuild's host client never does this. A malicious host could open DevTools and corrupt other players' `solved` counts in their own room. Low impact (only affects rooms they created) and not worth the rule complexity to patch in v1.
- **AI test answers are sent to the client with the paper**. Local grading is faster and avoids a second LLM round-trip, at the cost of "the answers are visible in DevTools to anyone determined enough to look." UIL practice mode — fine. Don't repurpose this for proctored exams.
- **`/api/leaderboard` accepts client-supplied `bestMs`** but verifies it against the recorded drill within ±50ms. Acceptable. The drill record itself is owner-writable, so theoretically a user could write a fake drill to Firestore directly via the SDK and then submit it — closing this would require server-side drill creation, which is overkill for the use case.

---

## 20. Final pre-cutover checklist (condensed)

The rebuild's code is done. Everything below is yours to execute.

### Must-do (in order, on cutover day or just before)

1. **Vercel env vars** — set in Project → Settings → Environment Variables (Production + Preview). See §19 matrix for the full list. The non-negotiable ones:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (server-only, JSON one-line) — without it `/api/leaderboard` returns 500.
   - `GEMINI_API_KEY` (server-only) — without it `/api/generate-test` returns `missing-key`.
   - All 8 `NEXT_PUBLIC_FIREBASE_*` vars + `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (for GA4).
2. **Rotate the Gemini key** — revoke the existing one in Google AI Studio, generate a fresh one, set `GEMINI_API_KEY` (server-only) in Vercel + `.env.local`, **delete** `NEXT_PUBLIC_GEMINI_API_KEY` from both.
3. **Browser smoke-test** on a Vercel preview (push `entirelyNew` and visit the preview URL):
   - Sign in (email + Google) → run a 5/5 drill → check leaderboard publishes
   - `/multiplayer` → 2 incognito windows → create + join → race to 5 → verify ended state + auto-cleanup
   - `/test` → generate (needs `GEMINI_API_KEY`) → submit → results
   - `/games/twenty-four` and `/games/zetamac` → keyboard handlers + timer + end modal
   - Tweaks panel — toggle sound/haptics, switch to ink/mono/arcade themes
   - View page source on `/` → confirm WebSite + Organization JSON-LD blocks render
   - Visit `/sitemap.xml` and `/robots.txt` directly
   - Paste a `/` link into Slack/Twitter/iMessage → confirm og:image preview
4. **Re-run the data migration** to refresh any drift:
   ```sh
   NODE_OPTIONS=--use-system-ca pnpm exec tsx --env-file=.env.local scripts/migrate-data-to-rebuild.mjs --apply
   ```
5. **Deploy the new RTDB rules** — `firebase deploy --only database`. ⚠ Do this *immediately* before step 6, not earlier (it breaks legacy multiplayer once deployed).
6. **Flip the Vercel Production Branch** — Vercel → Settings → Git → change Production Branch from `main` to `entirelyNew`. Same domain (`project-sense.vercel.app`) serves the rebuild on the next deploy.

### Post-cutover (anytime)

7. **GA4 setup** — Admin → Events: mark `login` and `sign_up` as conversions. Admin → Custom definitions: register event-scoped params `trick_id`, `duration_ms`, `time_ms`, `players_count`, `won`, `score`, `number_correct`, `total`, `method`, `question_count`, plus user-scoped `signup_date`.
8. **Resubmit sitemap** — Google Search Console → Sitemaps → submit `https://project-sense.vercel.app/sitemap.xml`. Sitemap now includes all 52 `/trick/{id}` URLs.
9. **(Optional) Wire Sentry fully** — `npx @sentry/wizard@latest -i nextjs` once you have a Sentry project. Scaffold + DSN env vars are already in place; the wizard wraps `next.config.ts` with `withSentryConfig` for source-map upload.
10. **(Optional) Validate Rich Results** — paste your prod URL into <https://search.google.com/test/rich-results>. JSON-LD blocks should pass.

### Known v1 trade-offs (not blockers, but worth knowing)

- No e2e tests for multiplayer / AI test / mini-games — Playwright covers register-drill-flow + leaderboard-publish only. Add later if regressions surface.
- No rate limit on `/api/generate-test` — auth-gated; a determined signed-in user could spend your Gemini quota. Add `@upstash/ratelimit` if billing surprises you.
- Multiplayer: no Cloud Function for stale-lobby cleanup, no mid-race reconnect/resume.
- AI test answers are shipped to the client (intentional — local grading via `equals()`). Fine for practice; not for proctored exams.
- See §19 "Open security trade-offs" for the full list.

### If something breaks post-cutover

Flip the Vercel Production Branch back to `main`. Migration is additive (legacy fields preserved), so legacy keeps working. Only loss on rollback: multiplayer on legacy is dark because the new RTDB rules require a `host` field legacy doesn't write. Practice + leaderboard + AI test on `main` keep working regardless.

---

## 21. Hardening + review pass (2026-08)

A large hardening/review pass on `entirelyNew`, on top of the 2026-05 Phase-4 work. All gates stayed green throughout (typecheck / 173 tests / lint 0 errors / build 23 routes / `pnpm audit --prod` clean).

### Dependencies
- **All deps upgraded to latest** (Next 16.3.1, React/react-dom 19.2.8, firebase 12, firebase-admin 14, zod 4, @hookform/resolvers 5, vitest 4, jsdom 30, tailwindcss 4.3, etc.). `pnpm audit` is now clean (a critical transitive `websocket-driver` and high `fast-uri`/`uuid` advisories were cleared, the last two via `overrides` in `pnpm-workspace.yaml`).
- **TypeScript pinned to 5.9, ESLint to 9** (not the absolute latest): TS 7 / ESLint 10 break `typescript-eslint` / `eslint-plugin-react` pulled in by `eslint-config-next`. Revisit when the lint ecosystem catches up.
- **mathjs removed**; client answer-checking + Twenty-Four now use the ~8KB **fraction.js** (big client-bundle win on the drill/multiplayer/games routes). **Unused deps removed**: `motion`, `katex`, `react-katex`, `@types/katex`.
- `pnpm-workspace.yaml` now carries `allowBuilds` (approve build scripts so install succeeds on a clean checkout) + `overrides` (uuid, fast-uri).
- **Package manager note:** pnpm isn't on PATH on the dev machine — invoke as **`corepack pnpm`**. `next dev` 403s static chunks in the sandbox used for QA, so browser verification is done against a production build (`next build` + `next start`), not `next dev`.

### Typography
- Consolidated the three-font system (Space Grotesk + Instrument Serif + JetBrains Mono) to a **single family, Nunito**, to cut visual noise. `--serif`/`--mono` are aliases of `--sans` in `globals.css`; italic accents remain as a light playful touch.

### Bugs fixed (found via real-browser QA against the emulator)
1. **Drill saves silently failed** — `saveDrillResult`'s Firestore transaction read the previous best *after* writing the drill (Firestore forbids read-after-write). No history/bests/leaderboard ever persisted. Fixed (read-before-write).
2. **Leaderboard publish 400'd** — zod 4 rejected the fractional-ms `bestMs`; drill time is now rounded to whole ms.
3. **Multiplayer hung when a non-host won** — the finisher called `endRace` (a host-only write). The host now drives race completion (`RoomRace.tsx`).
4. **Drill: Enter after an auto-committed correct answer blanked the next question** (broke 5/5). Enter on an empty input is now ignored.
5. **FloatingNumbers hydration mismatch** (Math.random during render) — moved to a mount effect.

### Security / rules / privacy
- Leaderboard reads require auth (kids' names/schools no longer world-readable); drill docs + RTDB player nodes have shape/range `.validate`.
- **Multiplayer room confidentiality**: the public lobby now reads a minimal `roomIndex` node (no player names); `rooms/$code` reads are gated to participants, so rooms can no longer be enumerated. Private rooms remain code-invite joinable. `solved` writes are monotonic and lobby/racing-gated; room fields are schema-validated.
- **Google sign-in** seeds `displayName` from the email local-part, not the real Google account name; the leaderboard writer clamps/sanitizes `displayName`/`school` server-side.
- In-memory per-user **rate limit** on `/api/generate-test` (10/min) + `/api/grade-test` (60/min) → 429.
- `TweaksPanel` design-tool postMessage bridge is dev-only; `client.ts` fails fast with a named error on a missing `NEXT_PUBLIC_FIREBASE_*` var.

### Resilience / a11y / correctness
- **Error boundaries** added (`app/{error,global-error,not-found}.tsx` + `(app)/loading.tsx`) — no more blank screen on a crash. (Sentry stays disabled per product decision.)
- **RTDB subscriptions** now surface errors (no infinite spinner); a **"Leave race"** control + host-disconnect recovery were added to multiplayer.
- **Accessibility**: form inputs have associated `<label htmlFor>`; errors use `role="alert"`.
- Global single-key nav ignores Cmd/Ctrl/Alt (browser shortcuts work); dead `/settings` nav removed; profile shows `/52`; redundant Firestore read on the trick page removed.
- New `rules-tests/` suite validates the Firestore + RTDB rules against the emulator (`pnpm test:rules`).

### SEO (added 2026-08)
- The `(app)` group is behind a client auth gate, so its pages weren't crawlable. **`/trick/{id}` was moved out to a top-level, server-rendered public route** (`app/trick/[trickId]/page.tsx`) — full how-to content + per-trick `LearningResource` JSON-LD + canonical are now in the initial HTML for search engines; the authed stats/history/leaderboard are a client island (`components/sense/TrickStats.tsx`) with a sign-in CTA when logged out. `generateStaticParams` pre-renders all 52.
- Site origin is now `NEXT_PUBLIC_SITE_URL` (default `project-sense.vercel.app`), shared via `lib/config/site.ts` by `layout.tsx`/`sitemap.ts`/`robots.ts`. Set the real domain in Vercel if it differs.
- `sitemap.ts` now lists only genuinely-public URLs (`/login` + the 52 trick pages). Verified: logged-out `curl /trick/1` returns title + content + JSON-LD + canonical.
- README rewritten into a proper project README.
- Not done: the home `/` and other `(app)` pages remain gated (login is the crawlable landing) — revisit only if broader indexing is wanted.

### Still open / deferred
- **Operational cutover** (unchanged, your hands): rotate the Gemini key, set Vercel env vars, `firebase deploy --only firestore:rules,database` sequenced with the Production-Branch flip. See §18/§20.
- **Manual QA** not automatable here: multiplayer in two windows, AI test with a real Gemini key, the mini-games.
- **Deferred (optional):** multiplayer finish-timestamp winner attribution + double-count guard; broader multiplayer/AI-test e2e coverage.
