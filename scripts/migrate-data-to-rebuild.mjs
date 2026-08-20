#!/usr/bin/env node
/**
 * One-shot migration runner: copies the live legacy Firestore data on project
 * `csmidterm-5f652` from the (default) database into the isolated `rebuild`
 * database, reshaping it into the rebuild's schema. The source (default)
 * database is only read — never written — so legacy `main` stays untouched.
 * Override the destination with MIGRATION_DEST_DATABASE_ID (defaults to
 * "rebuild").
 *
 * Run with a TS-aware Node loader so `lib/server/migration.ts` is importable:
 *
 *   pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --dry-run
 *   pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply
 *   pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --apply --verbose
 *
 * On Node 22.6+, you can alternatively use:
 *   node --experimental-strip-types scripts/migrate-data-to-rebuild.mjs --dry-run
 *
 * Auth precedence (matches lib/firebase/admin.ts):
 *   1. If FIRESTORE_EMULATOR_HOST or FIREBASE_AUTH_EMULATOR_HOST is set, the
 *      Admin SDK auto-connects to the emulator. No real credentials needed.
 *   2. Otherwise FIREBASE_SERVICE_ACCOUNT_KEY (single-line JSON) is required.
 *
 * The pure transforms live in `lib/server/migration.ts` so they're testable
 * in vitest's jsdom env without firebase-admin. This script is just the
 * Admin SDK init + summary printer.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ---- CLI flags ------------------------------------------------------------
const argv = new Set(process.argv.slice(2));
const APPLY = argv.has("--apply");
const DRY_RUN_FLAG = argv.has("--dry-run");
const VERBOSE = argv.has("--verbose");

if (APPLY && DRY_RUN_FLAG) {
  console.error("Cannot pass both --apply and --dry-run.");
  process.exit(1);
}
const DRY_RUN = !APPLY;

// ---- Admin SDK init -------------------------------------------------------
const useEmulator =
  !!process.env.FIRESTORE_EMULATOR_HOST ||
  !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!getApps().length) {
  if (useEmulator) {
    initializeApp({
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
    });
    console.log(
      `[init] using emulator (FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST ?? "n/a"})`,
    );
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      console.error(
        "FIREBASE_SERVICE_ACCOUNT_KEY env var is required (or set FIRESTORE_EMULATOR_HOST for emulator).",
      );
      process.exit(1);
    }
    initializeApp({ credential: cert(JSON.parse(raw)) });
    console.log("[init] using service-account credentials");
  }
}

// Two handles off the same admin app: read from the legacy (default) database,
// write into the isolated rebuild database. Override the dest id if needed.
const DEST_DATABASE_ID = process.env.MIGRATION_DEST_DATABASE_ID || "rebuild";
const app = getApps()[0];
const sourceDb = getFirestore(app);
const destDb = getFirestore(app, DEST_DATABASE_ID);

// Dynamic import so the TS loader (tsx / --experimental-strip-types) only
// has to handle this single specifier; if the loader isn't active, fail
// loudly with a clear message instead of an opaque "Unknown file extension".
let migrateAll;
try {
  ({ migrateAll } = await import("../lib/server/migration.ts"));
} catch (e) {
  console.error(
    "\nFailed to import lib/server/migration.ts.\n" +
      "Run this script via a TS-aware loader, e.g.:\n" +
      "  pnpm exec tsx scripts/migrate-data-to-rebuild.mjs --dry-run\n" +
      "or on Node 22.6+:\n" +
      "  node --experimental-strip-types scripts/migrate-data-to-rebuild.mjs --dry-run\n",
  );
  console.error(e);
  process.exit(1);
}

// The Admin SDK's Firestore matches the runner's MigrationFirestore surface
// structurally (collection().get() returns { docs }, doc().ref, etc.), so we
// pass the handles through without adapter shims.

const log = {
  log: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

// `now` returns a serverTimestamp sentinel for Admin SDK writes; in dry-run
// nothing is written so the value is irrelevant.
const now = () => FieldValue.serverTimestamp();

console.log("");
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"}${VERBOSE ? " + verbose" : ""}`);
console.log("");

const start = Date.now();
let result;
try {
  result = await migrateAll(
    { sourceDb, destDb, log, now },
    { dryRun: DRY_RUN, verbose: VERBOSE },
  );
} catch (e) {
  console.error("Fatal error during migration:", e);
  process.exit(1);
}
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log("");
console.log("---- Migration summary ----");
console.log(`profilesTouched: ${result.profilesTouched}`);
console.log(`bestsTouched:    ${result.bestsTouched}`);
console.log(`entriesWritten:  ${result.entriesWritten}`);
console.log(`errors:          ${result.errors}`);
console.log(`elapsed:         ${elapsed}s`);
console.log(`mode:            ${DRY_RUN ? "DRY RUN (no writes)" : "APPLY (writes committed)"}`);

process.exit(result.errors > 0 ? 1 : 0);
