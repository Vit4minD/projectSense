import { describe, expect, it } from "vitest";
import {
  migrateAll,
  type MigrateAllDeps,
  type MigrationCollectionRef,
  type MigrationDocRef,
  type MigrationDocSnap,
  type MigrationFirestore,
} from "@/lib/server/migration";

// ---------------------------------------------------------------------------
// Fake Firestore — mirrors the shape used by __tests__/leaderboardRoute.test.ts
// (makeDocRef / makeCollection / makeDeps), extended to support `.get()` on
// collections (returning `{ docs }`) so the migration runner can iterate.
// Storage is keyed by full path strings so subcollections compose naturally.
// ---------------------------------------------------------------------------

type StoredDoc = Record<string, unknown>;
type Store = Map<string, StoredDoc>;

function makeDocRef(store: Store, path: string): MigrationDocRef {
  const id = path.split("/").pop() as string;
  return {
    id,
    get: async (): Promise<MigrationDocSnap> => {
      const data = store.get(path);
      return {
        id,
        exists: data !== undefined,
        data: () => data,
        ref: makeDocRef(store, path),
      };
    },
    set: async (data: Record<string, unknown>, options?: { merge?: boolean }) => {
      const merged = options?.merge
        ? { ...(store.get(path) ?? {}), ...data }
        : data;
      store.set(path, merged);
      return { writeTime: "fake" };
    },
    collection: (name: string) => makeCollection(store, `${path}/${name}`),
  };
}

function makeCollection(store: Store, prefix: string): MigrationCollectionRef {
  return {
    doc: (id: string) => makeDocRef(store, `${prefix}/${id}`),
    get: async () => {
      // Return every doc whose path is exactly `${prefix}/{id}` (no further
      // slashes after the id segment — that would be a nested subcollection).
      const docs: MigrationDocSnap[] = [];
      const slice = prefix.length + 1;
      for (const [path, data] of store.entries()) {
        if (!path.startsWith(prefix + "/")) continue;
        const tail = path.slice(slice);
        if (tail.includes("/")) continue;
        const id = tail;
        docs.push({
          id,
          exists: data !== undefined,
          data: () => data,
          ref: makeDocRef(store, path),
        });
      }
      // Sort for deterministic iteration order across the test suite.
      docs.sort((a, b) => a.id.localeCompare(b.id));
      return { docs };
    },
    // Mirrors firebase-admin: returns refs for any direct child id, including
    // ones that exist only as containers for a subcollection (no own fields).
    listDocuments: async () => {
      const ids = new Set<string>();
      for (const path of store.keys()) {
        if (!path.startsWith(prefix + "/")) continue;
        const tail = path.slice(prefix.length + 1);
        const firstSeg = tail.split("/")[0];
        if (firstSeg) ids.add(firstSeg);
      }
      const sorted = Array.from(ids).sort();
      return sorted.map((id) => makeDocRef(store, `${prefix}/${id}`));
    },
  };
}

function makeFirestore(store: Store): MigrationFirestore {
  return {
    collection: (name: string) => makeCollection(store, name),
  };
}

function makeDeps(store: Store): {
  deps: MigrateAllDeps;
  logs: { log: string[]; warn: string[]; error: string[] };
} {
  const logs = { log: [] as string[], warn: [] as string[], error: [] as string[] };
  const deps: MigrateAllDeps = {
    adminDb: makeFirestore(store),
    log: {
      log: (m) => logs.log.push(m),
      warn: (m) => logs.warn.push(m),
      error: (m) => logs.error.push(m),
    },
    now: () => "__SERVER_TS__",
  };
  return { deps, logs };
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe("migrateAll", () => {
  it("backfills derived fields on a legacy-only user profile", async () => {
    const store: Store = new Map();
    store.set("users/uid-1", {
      email: "henry.tran07@gmail.com",
      questionLimited: true,
      rightLeft: false,
      autoEnter: true,
    });

    const { deps } = makeDeps(store);
    const result = await migrateAll(deps, { dryRun: false });

    expect(result.profilesTouched).toBe(1);
    expect(result.errors).toBe(0);

    const written = store.get("users/uid-1") as Record<string, unknown>;
    expect(written.displayName).toBe("henry.tran07");
    expect(written.school).toBe("");
    expect(written.avatarInitials).toBe("H");
    expect(written.createdAt).toBe("__SERVER_TS__");
    // Legacy fields preserved.
    expect(written.email).toBe("henry.tran07@gmail.com");
    expect(written.questionLimited).toBe(true);
    expect(written.rightLeft).toBe(false);
    expect(written.autoEnter).toBe(true);
  });

  it("does not double-migrate a user already in the new shape", async () => {
    const existingCreated = new Date("2024-01-01T00:00:00Z");
    const store: Store = new Map();
    store.set("users/uid-1", {
      email: "henry.tran07@gmail.com",
      displayName: "Henry Tran",
      school: "MIT",
      avatarInitials: "HT",
      createdAt: existingCreated,
      lastActiveAt: existingCreated,
      questionLimited: true,
    });

    const { deps } = makeDeps(store);
    await migrateAll(deps, { dryRun: false });

    const written = store.get("users/uid-1") as Record<string, unknown>;
    expect(written.displayName).toBe("Henry Tran");
    expect(written.school).toBe("MIT");
    expect(written.avatarInitials).toBe("HT");
    // Original timestamps preserved (not bumped to __SERVER_TS__).
    expect(written.createdAt).toBe(existingCreated);
    expect(written.lastActiveAt).toBe(existingCreated);
  });

  it("logs a warning and increments errors on a malformed best.time, but doesn't crash", async () => {
    const store: Store = new Map();
    store.set("users/uid-1", { email: "ada@example.com" });
    store.set("users/uid-1/bests/1", { time: "00:08.45" });
    store.set("users/uid-1/bests/2", { time: "garbage" });
    store.set("users/uid-1/bests/12", { time: "00:18.30" });

    const { deps, logs } = makeDeps(store);
    const result = await migrateAll(deps, { dryRun: false });

    expect(result.bestsTouched).toBe(3);
    expect(result.errors).toBe(1);
    expect(logs.warn.some((m) => m.includes("malformed time"))).toBe(true);

    // The two valid bests were rewritten in place.
    const best1 = store.get("users/uid-1/bests/1") as Record<string, unknown>;
    expect(best1.bestMs).toBe(8450);
    expect(best1.attempts).toBe(1);
    expect(best1.correct).toBe(5);

    const best12 = store.get("users/uid-1/bests/12") as Record<string, unknown>;
    expect(best12.bestMs).toBe(18300);

    // The malformed best was left as-is (no NaN written).
    const best2 = store.get("users/uid-1/bests/2") as Record<string, unknown>;
    expect(best2.time).toBe("garbage");
    expect(best2.bestMs).toBeUndefined();
  });

  it("pulls displayName/school onto leaderboard entries from the just-migrated profile", async () => {
    const store: Store = new Map();
    store.set("users/uid-1", {
      email: "henry.tran07@gmail.com",
      displayName: "Henry Tran",
      school: "MIT",
    });
    store.set("users/uid-1/bests/1", { time: "00:08.45" });
    const originalUpdatedAt = new Date("2025-08-10T10:00:00Z");
    store.set("leaderboards/1/entries/uid-1", {
      uid: "uid-1",
      email: "henry.tran07@gmail.com",
      time: "00:08.45",
      updatedAt: originalUpdatedAt,
    });

    const { deps } = makeDeps(store);
    const result = await migrateAll(deps, { dryRun: false });

    expect(result.entriesWritten).toBe(1);
    expect(result.errors).toBe(0);

    const entry = store.get("leaderboards/1/entries/uid-1") as Record<string, unknown>;
    expect(entry.uid).toBe("uid-1");
    expect(entry.bestMs).toBe(8450);
    expect(entry.displayName).toBe("Henry Tran");
    expect(entry.school).toBe("MIT");
    // Original updatedAt preserved.
    expect(entry.updatedAt).toBe(originalUpdatedAt);
  });

  it("dry-run reports counts without writing", async () => {
    const store: Store = new Map();
    store.set("users/uid-1", { email: "ada@example.com" });
    store.set("users/uid-1/bests/1", { time: "00:08.45" });
    store.set("leaderboards/1/entries/uid-1", {
      uid: "uid-1",
      email: "ada@example.com",
      time: "00:08.45",
    });

    const before = JSON.stringify(Array.from(store.entries()));
    const { deps } = makeDeps(store);
    const result = await migrateAll(deps, { dryRun: true });

    expect(result.profilesTouched).toBe(1);
    expect(result.bestsTouched).toBe(1);
    expect(result.entriesWritten).toBe(1);
    expect(result.errors).toBe(0);

    // No mutations performed.
    expect(JSON.stringify(Array.from(store.entries()))).toBe(before);
  });

  it("preserves legacy fields on bests and leaderboard entries after a full migrateAll run", async () => {
    // This locks the legacy compatibility invariant: the legacy app on `main`
    // reads users/{uid}/bests/{trickId}.time and leaderboards/.../entries/{uid}.{email,time}.
    // Both must survive `migrateAll(... { dryRun: false })` so the legacy
    // deploy keeps working after a production --apply.
    const store: Store = new Map();
    const originalEntryTimestamp = new Date("2025-08-10T10:00:00Z");
    store.set("users/uid-1", {
      email: "henry.tran07@gmail.com",
      questionLimited: true,
      rightLeft: false,
      autoEnter: true,
    });
    store.set("users/uid-1/bests/1", { time: "00:08.45" });
    store.set("leaderboards/1/entries/uid-1", {
      uid: "uid-1",
      email: "henry.tran07@gmail.com",
      time: "00:08.45",
      updatedAt: originalEntryTimestamp,
    });

    const { deps } = makeDeps(store);
    await migrateAll(deps, { dryRun: false });

    // Bests doc — both legacy and new fields present.
    const best = store.get("users/uid-1/bests/1") as Record<string, unknown>;
    expect(best.time).toBe("00:08.45");
    expect(best.bestMs).toBe(8450);
    expect(best.attempts).toBe(1);
    expect(best.correct).toBe(5);

    // Leaderboard entry — legacy email + time intact alongside new fields.
    const entry = store.get("leaderboards/1/entries/uid-1") as Record<
      string,
      unknown
    >;
    expect(entry.email).toBe("henry.tran07@gmail.com");
    expect(entry.time).toBe("00:08.45");
    expect(entry.bestMs).toBe(8450);
    expect(entry.displayName).toBe("henry.tran07");
    expect(entry.school).toBe("");
    expect(entry.updatedAt).toBe(originalEntryTimestamp);

    // User profile legacy settings intact (already covered, repeated here so
    // the full legacy-preservation contract lives in one spec).
    const user = store.get("users/uid-1") as Record<string, unknown>;
    expect(user.email).toBe("henry.tran07@gmail.com");
    expect(user.questionLimited).toBe(true);
    expect(user.rightLeft).toBe(false);
    expect(user.autoEnter).toBe(true);
  });

  it("running migrateAll twice yields the same final state (idempotent)", async () => {
    const store: Store = new Map();
    store.set("users/uid-1", { email: "henry.tran07@gmail.com", questionLimited: true });
    store.set("users/uid-1/bests/1", { time: "00:08.45" });
    store.set("users/uid-1/bests/12", { time: "00:18.30" });
    store.set("leaderboards/1/entries/uid-1", {
      uid: "uid-1",
      email: "henry.tran07@gmail.com",
      time: "00:08.45",
    });

    const { deps: deps1 } = makeDeps(store);
    await migrateAll(deps1, { dryRun: false });
    const afterFirst = JSON.stringify(Array.from(store.entries()).sort());

    const { deps: deps2 } = makeDeps(store);
    const second = await migrateAll(deps2, { dryRun: false });
    const afterSecond = JSON.stringify(Array.from(store.entries()).sort());

    expect(afterSecond).toBe(afterFirst);
    expect(second.errors).toBe(0);
  });
});
