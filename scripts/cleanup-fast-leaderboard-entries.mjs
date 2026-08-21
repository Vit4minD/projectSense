#!/usr/bin/env node
/**
 * Remove implausible leaderboard entries whose `bestMs` is under one second
 * (< 1000 ms) from the rebuild's Firestore database. Such times are not humanly
 * achievable on a 5-question drill and are almost certainly bad/legacy/test data.
 *
 * Runs against the `prodsense` database by default (override with
 * MIGRATION_DEST_DATABASE_ID). Dry-run by default — pass --apply to delete.
 *
 *   pnpm exec tsx scripts/cleanup-fast-leaderboard-entries.mjs            # dry-run (lists)
 *   pnpm exec tsx scripts/cleanup-fast-leaderboard-entries.mjs --apply    # deletes
 *
 * Auth precedence matches lib/firebase/admin.ts: FIRESTORE_EMULATOR_HOST /
 * FIREBASE_AUTH_EMULATOR_HOST → emulator; otherwise FIREBASE_SERVICE_ACCOUNT_KEY.
 *
 * Note: this only removes the `leaderboards/{trickId}/entries/{uid}` docs. It
 * does NOT touch `users/{uid}/bests/{trickId}` — if a sub-1s best still exists
 * there, a future verified run could republish it, so consider it separately.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const argv = new Set(process.argv.slice(2));
const APPLY = argv.has("--apply");
const DRY_RUN = !APPLY;
const THRESHOLD_MS = 1000; // strictly less than 1 second

const useEmulator =
  !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!getApps().length) {
  if (useEmulator) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
    });
    console.log("[init] using emulator");
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY env var is required.");
      process.exit(1);
    }
    initializeApp({ credential: cert(JSON.parse(raw)) });
    console.log("[init] using service-account credentials");
  }
}

const DEST_DATABASE_ID = process.env.MIGRATION_DEST_DATABASE_ID || "prodsense";
const db = getFirestore(getApps()[0], DEST_DATABASE_ID);

console.log("");
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"} | database: ${DEST_DATABASE_ID} | threshold: bestMs < ${THRESHOLD_MS}`);
console.log("");

let scanned = 0;
let flagged = 0;
let deleted = 0;
let errors = 0;

// Enumerate leaderboard parent docs (some exist only as containers for `entries`).
let trickRefs = [];
try {
  const boardCol = db.collection("leaderboards");
  trickRefs = await boardCol.listDocuments();
} catch (e) {
  console.error(`failed to list leaderboards: ${e.message}`);
  process.exit(1);
}

for (const trickRef of trickRefs) {
  const trickId = trickRef.id;
  let entries;
  try {
    entries = await trickRef.collection("entries").get();
  } catch (e) {
    console.error(`list leaderboards/${trickId}/entries: ${e.message}`);
    errors++;
    continue;
  }

  for (const entryDoc of entries.docs) {
    scanned++;
    const data = entryDoc.data() ?? {};
    const bestMs = data.bestMs;
    if (typeof bestMs === "number" && Number.isFinite(bestMs) && bestMs < THRESHOLD_MS) {
      flagged++;
      console.log(
        `${DRY_RUN ? "[would delete]" : "[delete]"} leaderboards/${trickId}/entries/${entryDoc.id} bestMs=${bestMs} time=${JSON.stringify(data.time)}`,
      );
      if (!DRY_RUN) {
        try {
          await entryDoc.ref.delete();
          deleted++;
        } catch (e) {
          console.error(`delete leaderboards/${trickId}/entries/${entryDoc.id}: ${e.message}`);
          errors++;
        }
      }
    }
  }
}

console.log("");
console.log("---- Cleanup summary ----");
console.log(`entriesScanned: ${scanned}`);
console.log(`under1s:        ${flagged}`);
console.log(`deleted:        ${deleted}`);
console.log(`errors:         ${errors}`);
console.log(`mode:           ${DRY_RUN ? "DRY RUN (no deletes)" : "APPLY (deletes committed)"}`);

process.exit(errors > 0 ? 1 : 0);
