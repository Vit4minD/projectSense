<div align="center">

<img src="public/projectSenseLogo.png" alt="Project Sense logo" width="112" />

# Project Sense

**A practice gym for UIL Number Sense — drill the canon, race your friends, and sit AI-generated practice tests.**

Built for the pen-and-paper mathlete.

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Chakra UI](https://img.shields.io/badge/Chakra_UI-2-319795?logo=chakraui&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_AI-testGen-8E75B2?logo=googlegemini&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## What is Project Sense?

[UIL Number Sense](https://www.uiltexas.org/academics/number-sense) is a competitive mental-math event: an 80-question test worked in **10 minutes, entirely in your head** — no erasing, no scratch work. **Project Sense** is a full-stack web app that turns that grind into a training gym. Students drill the standard catalog of shortcuts, compete on global leaderboards, race head-to-head in real time, and generate full-length AI practice papers — all in the browser, on desktop or phone.

## Features

- **📚 Trick drills** — practice **52 canonical number-sense tricks** with LaTeX-rendered problems, a live timer, and personal-best tracking.
- **🏆 Leaderboards** — global per-trick rankings, written server-side through a dedicated API route.
- **⚔️ Real-time multiplayer** — race other players live, backed by Firebase.
- **🤖 AI practice tests** — full-length papers generated on demand by **Google Gemini** (the `testGen` page).
- **🎮 Mini-games** — **Twenty-Four** (make 24 from four numbers) and **Zetamac** (rapid-fire arithmetic).
- **🎥 Instructional videos** — **26 built-in walkthrough clips** covering the trickier methods (cubes, base conversion, complex multiplication, and more).
- **📊 Usage stats** — public aggregate stats via an API route.
- **📱 Installable PWA** — web-app manifest and icons for home-screen install.
- **✨ Polish** — animated particle background, Framer Motion transitions, in-app settings, and analytics.

## Screenshots

> Drop images into `docs/screenshots/` and uncomment the block below to display them.

<!--
| Home / trick catalog | Drill in progress | AI test generator |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Drill](docs/screenshots/drill.png) | ![AI test](docs/screenshots/testgen.png) |

| Leaderboard | Multiplayer | Twenty-Four |
| --- | --- | --- |
| ![Leaderboard](docs/screenshots/leaderboard.png) | ![Multiplayer](docs/screenshots/multiplayer.png) | ![Twenty-Four](docs/screenshots/twenty-four.png) |
-->

## Tech stack

| Layer | Choices |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| UI | Chakra UI + Emotion, DaisyUI, Tailwind CSS 3, Framer Motion, `react-icons` |
| Math rendering | KaTeX + `react-katex`, `mathjs` |
| Visuals | `react-particles` / `tsparticles`, `spinners-react` |
| Backend & data | Firebase (Auth, Firestore, Realtime Database) · `firebase-admin` (server) |
| AI | `@google/generative-ai` (Gemini) |
| Analytics | Vercel Analytics + Speed Insights |
| Hosting | Vercel |

## Getting started

**Prerequisites:** Node **24.x** and npm.

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local        # then fill in the values (see below)

# 3. Run the dev server
npm run dev                             # http://localhost:3000
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in your own project values. `.env.local` is gitignored — never commit real keys.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` … `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase Web SDK client config (Auth, Firestore, RTDB) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK service-account JSON (server-only). Used by `app/api/leaderboard`, `app/api/stats`, and the migration script. **Keep secret.** |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini key for the AI test generator |

> Generate the service-account key at **Firebase Console → Project Settings → Service accounts → Generate new private key** and paste the full JSON on a single line.

## Project structure

```
app/
  page.tsx                 # landing page
  register/                # sign up / log in
  home/                    # trick catalog + practice/[id] drills
  leaderboard/             # global rankings
  multiplayer/             # real-time races
  testGen/                 # AI-generated practice tests (Gemini)
  twenty-four/             # Twenty-Four mini-game
  zetamac/                 # Zetamac mini-game
  api/
    leaderboard/route.ts   # server-side leaderboard writes
    stats/route.ts         # aggregate usage stats
  components/              # MathComponent (KaTeX), modals, particle bg, ...
  utils/problemGenerator.ts# deterministic problem generation
firebase/                  # Firebase client/admin setup
scripts/migrate-firebase-data.mjs
firestore.rules · database.rules.json · firestore.indexes.json
public/                    # logo, icons, sounds, manual.pdf, instructional videos
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server at `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (`eslint-config-next`) |
| `npm run format` | Format `app/` and `firebase/` with Prettier |

## Data migration

`scripts/migrate-firebase-data.mjs` reshapes and carries over Firebase data (requires `FIREBASE_SERVICE_ACCOUNT_KEY`). Run it against a backup first, and do a dry run before applying to production.

## Deployment

Deployed on **Vercel**. Set the environment variables above in the Vercel project settings, then connect the repo — pushes to the production branch deploy automatically.

## License

[MIT](LICENSE) © 2024 Henry T.
