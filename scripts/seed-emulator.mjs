#!/usr/bin/env node
/**
 * Seed a small synthetic LEGACY-shaped dataset to the Firestore emulator so
 * `scripts/migrate-data-to-rebuild.mjs` can be exercised end-to-end before
 * running it against production.
 *
 *   pnpm emulators                    # in one terminal
 *   node scripts/seed-emulator.mjs    # in another
 *
 * Writes:
 *   - 3 users, each with legacy fields { email, questionLimited, rightLeft, autoEnter }
 *   - ~5 bests per user as { time: "MM:SS.dd" }
 *   - ~5 leaderboard entries across a few tricks as { uid, email, time, updatedAt }
 *
 * Refuses to run without an emulator host set, so it can never touch prod by
 * accident.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const useEmulator =
  !!process.env.FIRESTORE_EMULATOR_HOST ||
  !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!useEmulator) {
  console.error(
    "Refusing to seed: FIRESTORE_EMULATOR_HOST is not set.\n" +
      "Start emulators first: `pnpm emulators` (in another terminal).",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  });
}

const db = getFirestore();

// 3 fake users with realistic legacy field layouts.
const USERS = [
  {
    uid: "seed-user-1",
    profile: {
      email: "henry.tran07@gmail.com",
      questionLimited: true,
      rightLeft: false,
      autoEnter: true,
    },
    bests: {
      "1": "00:08.45",
      "2": "00:09.12",
      "12": "00:18.30",
      "20": "00:14.78",
      "43": "00:25.10",
    },
  },
  {
    uid: "seed-user-2",
    profile: {
      email: "ada@example.com",
      questionLimited: false,
      rightLeft: true,
      autoEnter: false,
    },
    bests: {
      "1": "00:07.20",
      "5": "00:11.55",
      "12": "00:20.00",
      "30": "00:16.66",
      "52": "00:33.40",
    },
  },
  {
    uid: "seed-user-3",
    profile: {
      // Already-migrated profile to verify idempotency: has displayName/school.
      email: "grace@example.com",
      displayName: "grace",
      school: "Yale",
      avatarInitials: "G",
      questionLimited: true,
      rightLeft: false,
      autoEnter: true,
    },
    bests: {
      "1": "00:09.99",
      "12": "00:22.11",
      "43": "00:28.30",
      "50": "00:30.00",
      "52": "00:35.50",
    },
  },
];

// Leaderboard entries (legacy shape) across a few trick IDs.
const LEADERBOARD = [
  { trickId: "1", uid: "seed-user-1", email: "henry.tran07@gmail.com", time: "00:08.45" },
  { trickId: "1", uid: "seed-user-2", email: "ada@example.com", time: "00:07.20" },
  { trickId: "12", uid: "seed-user-1", email: "henry.tran07@gmail.com", time: "00:18.30" },
  { trickId: "12", uid: "seed-user-3", email: "grace@example.com", time: "00:22.11" },
  { trickId: "43", uid: "seed-user-1", email: "henry.tran07@gmail.com", time: "00:25.10" },
];

async function main() {
  console.log(`[seed] using emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);

  for (const u of USERS) {
    await db.collection("users").doc(u.uid).set(u.profile, { merge: true });
    for (const [trickId, time] of Object.entries(u.bests)) {
      await db
        .collection("users")
        .doc(u.uid)
        .collection("bests")
        .doc(trickId)
        .set({ time }, { merge: true });
    }
    console.log(
      `[seed] users/${u.uid} (${Object.keys(u.bests).length} bests)`,
    );
  }

  for (const e of LEADERBOARD) {
    await db
      .collection("leaderboards")
      .doc(e.trickId)
      .collection("entries")
      .doc(e.uid)
      .set(
        {
          uid: e.uid,
          email: e.email,
          time: e.time,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    console.log(`[seed] leaderboards/${e.trickId}/entries/${e.uid}`);
  }

  console.log("");
  console.log(
    `[seed] done — ${USERS.length} users, ${USERS.reduce((n, u) => n + Object.keys(u.bests).length, 0)} bests, ${LEADERBOARD.length} leaderboard entries`,
  );
}

main().catch((err) => {
  console.error("[seed] fatal:", err);
  process.exit(1);
});
