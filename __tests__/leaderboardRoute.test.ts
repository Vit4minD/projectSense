import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  publishLeaderboardEntry,
  statusCodeFor,
  type PublishDeps,
} from "@/lib/server/leaderboard";

type StoredDoc = Record<string, unknown> | undefined;

function makeDocRef(store: Map<string, StoredDoc>, path: string) {
  return {
    _path: path,
    get: async () => ({
      exists: store.get(path) !== undefined,
      data: () => store.get(path),
    }),
    collection: (name: string) => makeCollection(store, `${path}/${name}`),
  };
}

function makeCollection(store: Map<string, StoredDoc>, prefix: string) {
  return {
    doc: (id: string) => makeDocRef(store, `${prefix}/${id}`),
  };
}

function makeDeps(opts: {
  verifyIdToken: PublishDeps["adminAuth"]["verifyIdToken"];
  store: Map<string, StoredDoc>;
}) {
  const writes: { path: string; data: Record<string, unknown>; merge: boolean }[] = [];
  const db = {
    collection: (name: string) => makeCollection(opts.store, name),
    runTransaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      const tx = {
        get: async (ref: { get: () => Promise<unknown> }) => ref.get(),
        set: (
          ref: { _path: string },
          data: Record<string, unknown>,
          options?: { merge?: boolean },
        ) => {
          writes.push({ path: ref._path, data, merge: !!options?.merge });
          const merged = options?.merge
            ? { ...(opts.store.get(ref._path) ?? {}), ...data }
            : data;
          opts.store.set(ref._path, merged);
        },
      };
      return fn(tx);
    },
  } as unknown as PublishDeps["adminDb"];

  const deps: PublishDeps = {
    adminAuth: { verifyIdToken: opts.verifyIdToken },
    adminDb: db,
    serverTimestamp: () => "__SERVER_TS__",
  };
  return { deps, writes };
}

const VALID_DRILL_BODY = {
  trickId: "20",
  drillId: "drill-abc",
  bestMs: 8500,
};

const SEED_VALID_USER = (store: Map<string, StoredDoc>) => {
  store.set("users/u1", { displayName: "Ada Lovelace", school: "Trinity HS" });
  store.set("users/u1/drills/drill-abc", {
    trickId: "20",
    totalMs: 8500,
    score: "5/5",
  });
};

describe("publishLeaderboardEntry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401-equivalent on missing Authorization header", async () => {
    const { deps } = makeDeps({
      verifyIdToken: vi.fn(),
      store: new Map(),
    });
    const result = await publishLeaderboardEntry(deps, null, VALID_DRILL_BODY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("no-token");
      expect(statusCodeFor(result.code)).toBe(401);
    }
  });

  it("returns 401 on token that fails verification", async () => {
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockRejectedValue(new Error("expired")),
      store: new Map(),
    });
    const result = await publishLeaderboardEntry(
      deps,
      "Bearer bad",
      VALID_DRILL_BODY,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("bad-token");
  });

  it("rejects malformed body", async () => {
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store: new Map(),
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", {
      trickId: "1",
      drillId: "x",
      bestMs: -1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("bad-request");
      expect(statusCodeFor(result.code)).toBe(400);
    }
  });

  it("rejects unknown trickId", async () => {
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store: new Map(),
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", {
      ...VALID_DRILL_BODY,
      trickId: "99",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unknown-trick");
  });

  it("returns stale-or-fabricated when drill doc is missing", async () => {
    const store = new Map<string, StoredDoc>();
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(
      deps,
      "Bearer ok",
      VALID_DRILL_BODY,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("stale-or-fabricated");
      expect(statusCodeFor(result.code)).toBe(409);
    }
  });

  it("returns stale-or-fabricated when claimed bestMs disagrees with drill.totalMs", async () => {
    const store = new Map<string, StoredDoc>();
    SEED_VALID_USER(store);
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", {
      ...VALID_DRILL_BODY,
      bestMs: 1000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("stale-or-fabricated");
  });

  it("returns stale-or-fabricated on a drill that wasn't 5/5", async () => {
    const store = new Map<string, StoredDoc>();
    store.set("users/u1", { displayName: "Ada", school: "X" });
    store.set("users/u1/drills/drill-abc", {
      trickId: "20",
      totalMs: 8500,
      score: "4/5",
    });
    const { deps } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", VALID_DRILL_BODY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("stale-or-fabricated");
  });

  it("upserts a new entry on first valid submission", async () => {
    const store = new Map<string, StoredDoc>();
    SEED_VALID_USER(store);
    const { deps, writes } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", VALID_DRILL_BODY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("updated");
      if (result.status === "updated") expect(result.bestMs).toBe(8500);
    }
    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe("leaderboards/20/entries/u1");
    expect(writes[0].merge).toBe(true);
    expect(writes[0].data).toMatchObject({
      uid: "u1",
      bestMs: 8500,
      displayName: "Ada Lovelace",
      school: "Trinity HS",
      updatedAt: "__SERVER_TS__",
    });
  });

  it("short-circuits to no-improvement when existing entry is faster", async () => {
    const store = new Map<string, StoredDoc>();
    SEED_VALID_USER(store);
    store.set("leaderboards/20/entries/u1", { uid: "u1", bestMs: 5000 });
    const { deps, writes } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", VALID_DRILL_BODY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("no-improvement");
    expect(writes).toHaveLength(0);
  });

  it("upserts when the new claim beats the existing entry", async () => {
    const store = new Map<string, StoredDoc>();
    SEED_VALID_USER(store);
    store.set("leaderboards/20/entries/u1", { uid: "u1", bestMs: 12000 });
    const { deps, writes } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", VALID_DRILL_BODY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("updated");
    expect(writes).toHaveLength(1);
    expect((writes[0].data as { bestMs: number }).bestMs).toBe(8500);
  });

  it("does not require a profile doc to publish (defaults to Anonymous)", async () => {
    const store = new Map<string, StoredDoc>();
    store.set("users/u1/drills/drill-abc", {
      trickId: "20",
      totalMs: 8500,
      score: "5/5",
    });
    const { deps, writes } = makeDeps({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }),
      store,
    });
    const result = await publishLeaderboardEntry(deps, "Bearer ok", VALID_DRILL_BODY);
    expect(result.ok).toBe(true);
    expect(writes[0].data).toMatchObject({
      displayName: "Anonymous",
      school: "",
    });
  });
});
