/**
 * Pure transformation functions and idempotent runner for the legacy ->
 * rebuild Firestore migration. No firebase-admin imports here so the helpers
 * are loadable in vitest's jsdom environment; the .mjs scripts are the only
 * place that bring in the Admin SDK.
 *
 * Source/target shapes (from the brainstorming plan, 2026-05-05):
 *
 *   users/{uid}
 *     legacy:  { email, questionLimited, rightLeft, autoEnter }
 *     rebuild: legacy ∪ { displayName, school, avatarInitials, createdAt, lastActiveAt }
 *     ^ legacy fields preserved as harmless residue.
 *
 *   users/{uid}/bests/{trickId}
 *     legacy:  { time: "MM:SS.dd" }
 *     rebuild: { bestMs, attempts, correct, lastAttemptAt }
 *     ^ seed attempts:1, correct:5 — legacy only wrote bests on a 5/5 run.
 *
 *   leaderboards/{trickId}/entries/{uid}
 *     legacy:  { uid, email, time, updatedAt }
 *     rebuild: { uid, bestMs, displayName, school, updatedAt }
 *     ^ displayName/school pulled from the just-migrated user profile.
 */

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Parse a legacy `"MM:SS.dd"` time string (centiseconds) into milliseconds.
 * Examples:
 *   "01:23.45" -> 83450
 *   "00:08.07" -> 8070
 * Returns NaN on malformed input.
 */
export function parseTimeToMs(time: string): number {
  if (typeof time !== "string") return NaN;
  const match = time.match(/^(\d{1,2}):(\d{2})\.(\d{2})$/);
  if (!match) return NaN;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const centis = Number(match[3]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(centis)) {
    return NaN;
  }
  if (seconds >= 60) return NaN;
  return minutes * 60_000 + seconds * 1000 + centis * 10;
}

/**
 * Inverse of `parseTimeToMs`. Round-trips with `parseTimeToMs` for any value
 * `>= 0` and `< 60 * 60 * 1000` (i.e., under one hour). Higher inputs still
 * format but won't survive the round-trip because the legacy format had a
 * 2-digit minute cap.
 */
export function formatMsToTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00.00";
  const total = Math.round(ms / 10); // centiseconds
  const centis = total % 100;
  const totalSeconds = Math.floor(total / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

/**
 * Local part of an email, RAW (no title-casing). Confirmed by user 2026-05-05:
 *   "henry.tran07@gmail.com" -> "henry.tran07"
 * Returns "" on missing/malformed input.
 */
export function deriveDisplayName(email: string | null | undefined): string {
  if (typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at <= 0) return "";
  return email.slice(0, at);
}

/**
 * Up to two uppercase initials from a display name. "henry tran" -> "HT".
 * Single-word names take the first letter only. Empty input yields "S"
 * (Sense brand fallback).
 */
export function deriveAvatarInitials(name: string | null | undefined): string {
  if (typeof name !== "string") return "S";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "S";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

// ---------------------------------------------------------------------------
// Document-level transforms
// ---------------------------------------------------------------------------

export type LegacyUserProfile = {
  email?: string;
  displayName?: string;
  school?: string;
  avatarInitials?: string;
  createdAt?: unknown;
  lastActiveAt?: unknown;
  questionLimited?: unknown;
  rightLeft?: unknown;
  autoEnter?: unknown;
  [key: string]: unknown;
};

export type MigratedUserProfile = LegacyUserProfile & {
  displayName: string;
  school: string;
  avatarInitials: string;
  createdAt: unknown;
  lastActiveAt: unknown;
};

/**
 * Backfill the rebuild-shape fields on a user profile without trampling
 * legacy ones. Idempotent: re-running on a partially or fully migrated
 * profile produces the same output (modulo `lastActiveAt`, which we touch
 * only when missing — so re-runs do NOT bump it).
 */
export function migrateUserProfile(
  legacy: LegacyUserProfile | undefined | null,
  uid: string,
  now: Date | unknown,
): MigratedUserProfile {
  void uid; // accepted for symmetry with caller; not used by the transform
  const src: LegacyUserProfile = legacy ?? {};
  const email = typeof src.email === "string" ? src.email : "";
  const displayName =
    typeof src.displayName === "string" && src.displayName.length > 0
      ? src.displayName
      : deriveDisplayName(email);
  const school = typeof src.school === "string" ? src.school : "";
  const avatarInitials =
    typeof src.avatarInitials === "string" && src.avatarInitials.length > 0
      ? src.avatarInitials
      : deriveAvatarInitials(displayName);
  const createdAt = src.createdAt !== undefined ? src.createdAt : now;
  const lastActiveAt = src.lastActiveAt !== undefined ? src.lastActiveAt : now;

  return {
    ...src,
    displayName,
    school,
    avatarInitials,
    createdAt,
    lastActiveAt,
  };
}

export type LegacyBest = {
  time?: string;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export type MigratedBest = LegacyBest & {
  bestMs: number;
  attempts: number;
  correct: number;
  lastAttemptAt: unknown;
};

/**
 * Reshape `{ time }` into `{ time, bestMs, attempts, correct, lastAttemptAt }`.
 * The legacy `time` string is preserved so the legacy app on `main` keeps
 * working even after this migration runs (its leaderboard reads `time`).
 * Seeds attempts:1, correct:5 because the legacy app only wrote bests on a
 * 5/5 run. Returns `bestMs: NaN` on malformed time — caller is expected to
 * detect and log; we don't throw because mid-batch crashes hurt idempotency.
 */
export function migrateBest(
  legacy: LegacyBest,
  now: Date | unknown,
): MigratedBest {
  const bestMs = parseTimeToMs(typeof legacy.time === "string" ? legacy.time : "");
  const lastAttemptAt = legacy.updatedAt !== undefined ? legacy.updatedAt : now;
  return {
    ...legacy,
    bestMs,
    attempts: 1,
    correct: 5,
    lastAttemptAt,
  };
}

export type LegacyLeaderboardEntry = {
  uid?: string;
  email?: string;
  time?: string;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export type MigratedLeaderboardEntry = LegacyLeaderboardEntry & {
  uid: string;
  bestMs: number;
  displayName: string;
  school: string;
  updatedAt: unknown;
};

/**
 * Pull `displayName`/`school` from the just-migrated user profile so the
 * leaderboard entry stays in sync with the canonical profile fields. The
 * legacy `email` and `time` fields are preserved so the legacy app on `main`
 * keeps working — its `/leaderboard` page queries `orderBy("time", "asc")`
 * and renders `email`. Preserves the original `updatedAt`; if missing,
 * falls back to `now`.
 */
export function migrateLeaderboardEntry(
  legacy: LegacyLeaderboardEntry,
  profile: MigratedUserProfile,
  uid: string,
  now?: Date | unknown,
): MigratedLeaderboardEntry {
  const bestMs = parseTimeToMs(typeof legacy.time === "string" ? legacy.time : "");
  const updatedAt =
    legacy.updatedAt !== undefined ? legacy.updatedAt : (now ?? new Date());
  return {
    ...legacy,
    uid,
    bestMs,
    displayName: profile.displayName,
    school: profile.school,
    updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

/**
 * Minimal Firestore surface the runner uses. Matches the subset of
 * firebase-admin's Firestore that we actually call, so tests can hand in a
 * fake-Firestore (see __tests__/migrationRunner.test.ts) without dragging in
 * firebase-admin types.
 */
export type MigrationDocSnap = {
  id: string;
  exists: boolean;
  data: () => Record<string, unknown> | undefined;
  ref: MigrationDocRef;
};

export type MigrationDocRef = {
  id: string;
  get: () => Promise<MigrationDocSnap>;
  set: (
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ) => Promise<unknown>;
  collection: (name: string) => MigrationCollectionRef;
};

export type MigrationCollectionRef = {
  doc: (id: string) => MigrationDocRef;
  get: () => Promise<{ docs: MigrationDocSnap[] }>;
  /**
   * Returns parent doc refs even if the doc has no fields (only subcollections).
   * Matches firebase-admin's `CollectionReference.listDocuments()`. Required so
   * we can enumerate `leaderboards/{trickId}` parent placeholders that exist
   * only as containers for the `entries` subcollection.
   */
  listDocuments?: () => Promise<MigrationDocRef[]>;
};

export type MigrationFirestore = {
  collection: (name: string) => MigrationCollectionRef;
};

export type MigrationLogger = {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

export type MigrateAllDeps = {
  adminDb: MigrationFirestore;
  log: MigrationLogger;
  now: () => Date | unknown;
};

export type MigrateAllOptions = {
  /** When true, count what would change but don't write. Default: true. */
  dryRun?: boolean;
  /** When true, log per-doc actions. Default: false. */
  verbose?: boolean;
};

export type MigrateAllResult = {
  profilesTouched: number;
  bestsTouched: number;
  entriesWritten: number;
  errors: number;
};

/**
 * Idempotent batch migration. Iterates every users/{uid}, then their bests
 * subcollection, then every leaderboards/{trickId}/entries/{uid} doc.
 *
 *   - profilesTouched = total profile docs read (whether or not we wrote)
 *   - bestsTouched    = total best docs read
 *   - entriesWritten  = total leaderboard entries read
 *   - errors          = malformed times, missing-profile lookups, etc.
 *
 * Re-running yields the same final state — derived fields are only filled
 * where missing, and the `bestMs`/`displayName`/`school` overwrites compute
 * the same values from the same source data.
 */
export async function migrateAll(
  deps: MigrateAllDeps,
  options: MigrateAllOptions = {},
): Promise<MigrateAllResult> {
  const dryRun = options.dryRun ?? true;
  const verbose = options.verbose ?? false;

  const result: MigrateAllResult = {
    profilesTouched: 0,
    bestsTouched: 0,
    entriesWritten: 0,
    errors: 0,
  };

  const tag = dryRun ? "[dry-run]" : "[apply]";

  // Cache migrated profiles so the leaderboard pass can pull displayName/school
  // without re-reading. Keyed by uid.
  const profileCache = new Map<string, MigratedUserProfile>();

  // ---- Pass 1: users/{uid} and their bests/{trickId}
  let userDocs: MigrationDocSnap[] = [];
  try {
    const usersSnap = await deps.adminDb.collection("users").get();
    userDocs = usersSnap.docs;
  } catch (e) {
    deps.log.error(`${tag} failed to list users: ${(e as Error).message}`);
    result.errors++;
    return result;
  }

  for (const userDoc of userDocs) {
    const uid = userDoc.id;
    result.profilesTouched++;
    const legacyProfile = (userDoc.data() ?? {}) as LegacyUserProfile;
    const migratedProfile = migrateUserProfile(legacyProfile, uid, deps.now());
    profileCache.set(uid, migratedProfile);

    if (verbose) {
      deps.log.log(
        `${tag} users/${uid} -> displayName="${migratedProfile.displayName}" school="${migratedProfile.school}"`,
      );
    }

    if (!dryRun) {
      try {
        // Use merge so we never clobber legacy fields and the operation stays
        // idempotent even mid-batch.
        await userDoc.ref.set(migratedProfile, { merge: true });
      } catch (e) {
        deps.log.error(`${tag} write users/${uid}: ${(e as Error).message}`);
        result.errors++;
      }
    }

    // ---- bests subcollection for this user
    let bestDocs: MigrationDocSnap[] = [];
    try {
      const bestsSnap = await userDoc.ref.collection("bests").get();
      bestDocs = bestsSnap.docs;
    } catch (e) {
      deps.log.error(
        `${tag} list users/${uid}/bests: ${(e as Error).message}`,
      );
      result.errors++;
      continue;
    }

    for (const bestDoc of bestDocs) {
      result.bestsTouched++;
      const legacyBest = (bestDoc.data() ?? {}) as LegacyBest;

      // Idempotency: if the doc already has bestMs as a number, it's already
      // migrated. Skip without counting an error.
      if (typeof legacyBest.bestMs === "number" && Number.isFinite(legacyBest.bestMs)) {
        if (verbose) {
          deps.log.log(
            `${tag} users/${uid}/bests/${bestDoc.id} already migrated (bestMs=${legacyBest.bestMs})`,
          );
        }
        continue;
      }

      const migrated = migrateBest(legacyBest, deps.now());
      if (!Number.isFinite(migrated.bestMs)) {
        deps.log.warn(
          `${tag} users/${uid}/bests/${bestDoc.id} malformed time=${JSON.stringify(legacyBest.time)} — skipping`,
        );
        result.errors++;
        continue;
      }

      if (verbose) {
        deps.log.log(
          `${tag} users/${uid}/bests/${bestDoc.id} -> bestMs=${migrated.bestMs}`,
        );
      }

      if (!dryRun) {
        try {
          await bestDoc.ref.set(migrated, { merge: true });
        } catch (e) {
          deps.log.error(
            `${tag} write users/${uid}/bests/${bestDoc.id}: ${(e as Error).message}`,
          );
          result.errors++;
        }
      }
    }
  }

  // ---- Pass 2: leaderboards/{trickId}/entries/{uid}
  // Use listDocuments() so parent placeholder docs (no fields, only the
  // `entries` subcollection) are still enumerated. Falls back to .get() if
  // the underlying Firestore impl doesn't support listDocuments.
  let trickRefs: MigrationDocRef[] = [];
  try {
    const boardCol = deps.adminDb.collection("leaderboards");
    if (typeof boardCol.listDocuments === "function") {
      trickRefs = await boardCol.listDocuments();
    } else {
      const boardSnap = await boardCol.get();
      trickRefs = boardSnap.docs.map((d) => d.ref);
    }
  } catch (e) {
    deps.log.error(`${tag} failed to list leaderboards: ${(e as Error).message}`);
    result.errors++;
    return result;
  }

  for (const trickRef of trickRefs) {
    const trickId = trickRef.id;
    let entryDocs: MigrationDocSnap[] = [];
    try {
      const entriesSnap = await trickRef.collection("entries").get();
      entryDocs = entriesSnap.docs;
    } catch (e) {
      deps.log.error(
        `${tag} list leaderboards/${trickId}/entries: ${(e as Error).message}`,
      );
      result.errors++;
      continue;
    }

    for (const entryDoc of entryDocs) {
      result.entriesWritten++;
      const legacyEntry = (entryDoc.data() ?? {}) as LegacyLeaderboardEntry;
      const uid =
        typeof legacyEntry.uid === "string" && legacyEntry.uid.length > 0
          ? legacyEntry.uid
          : entryDoc.id;

      // Idempotency: if the entry already has a numeric bestMs and a
      // displayName field, treat as migrated. We still count it in
      // entriesWritten (per the spec: the count is "entries processed").
      const alreadyMigrated =
        typeof legacyEntry.bestMs === "number" &&
        Number.isFinite(legacyEntry.bestMs) &&
        typeof legacyEntry.displayName === "string";
      if (alreadyMigrated) {
        if (verbose) {
          deps.log.log(
            `${tag} leaderboards/${trickId}/entries/${entryDoc.id} already migrated`,
          );
        }
        continue;
      }

      // Pull profile from cache; if absent, synthesize an empty migrated
      // profile so we still emit a well-shaped entry.
      let profile = profileCache.get(uid);
      if (!profile) {
        const fallback = migrateUserProfile(
          { email: typeof legacyEntry.email === "string" ? legacyEntry.email : "" },
          uid,
          deps.now(),
        );
        profile = fallback;
        deps.log.warn(
          `${tag} leaderboards/${trickId}/entries/${entryDoc.id} — no migrated profile for uid=${uid}, using derived defaults`,
        );
      }

      const migrated = migrateLeaderboardEntry(legacyEntry, profile, uid, deps.now());
      if (!Number.isFinite(migrated.bestMs)) {
        deps.log.warn(
          `${tag} leaderboards/${trickId}/entries/${entryDoc.id} malformed time=${JSON.stringify(legacyEntry.time)} — skipping`,
        );
        result.errors++;
        continue;
      }

      if (verbose) {
        deps.log.log(
          `${tag} leaderboards/${trickId}/entries/${entryDoc.id} -> bestMs=${migrated.bestMs} displayName="${migrated.displayName}"`,
        );
      }

      if (!dryRun) {
        try {
          await entryDoc.ref.set(migrated, { merge: true });
        } catch (e) {
          deps.log.error(
            `${tag} write leaderboards/${trickId}/entries/${entryDoc.id}: ${(e as Error).message}`,
          );
          result.errors++;
        }
      }
    }
  }

  return result;
}
