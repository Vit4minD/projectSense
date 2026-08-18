import { beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (snap: { val: () => unknown; forEach: (cb: (child: { val: () => unknown; key: string }) => boolean | void) => void }) => void;

type StoreShape = {
  data: Record<string, unknown>;
  listeners: Map<string, Set<{ path: string; filter?: { child: string; value: unknown }; fn: Listener }>>;
  nowCounter: { v: number };
};

const store: StoreShape = {
  data: {},
  listeners: new Map(),
  nowCounter: { v: 1000 },
};

const SERVER_TS = Symbol("server-ts");

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function getAt(path: string): unknown {
  const parts = splitPath(path);
  let cur: unknown = store.data;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }
  return cur ?? null;
}

function resolveServerTimestamps(value: unknown): unknown {
  if (value === SERVER_TS) {
    store.nowCounter.v += 1;
    return store.nowCounter.v;
  }
  if (Array.isArray(value)) return value.map(resolveServerTimestamps);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveServerTimestamps(v);
    }
    return out;
  }
  return value;
}

function setAt(path: string, value: unknown): void {
  const resolved = resolveServerTimestamps(value);
  const parts = splitPath(path);
  if (parts.length === 0) {
    store.data = (resolved as Record<string, unknown>) ?? {};
    notifyListeners();
    return;
  }
  let cur: Record<string, unknown> = store.data;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (resolved === null || resolved === undefined) {
    delete cur[last];
  } else {
    cur[last] = resolved;
  }
  notifyListeners();
}

function removeAt(path: string): void {
  const parts = splitPath(path);
  if (parts.length === 0) {
    store.data = {};
    notifyListeners();
    return;
  }
  let cur: Record<string, unknown> = store.data;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") return;
    cur = cur[p] as Record<string, unknown>;
  }
  delete cur[parts[parts.length - 1]];
  notifyListeners();
}

function makeSnap(value: unknown, keyHint?: string) {
  return {
    val: () => value,
    key: keyHint ?? null,
    forEach(cb: (child: { val: () => unknown; key: string }) => boolean | void) {
      if (!value || typeof value !== "object") return;
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const stop = cb({ val: () => v, key: k });
        if (stop) break;
      }
    },
  };
}

function notifyListeners() {
  for (const set of store.listeners.values()) {
    for (const entry of set) {
      let value = getAt(entry.path);
      if (entry.filter && value && typeof value === "object") {
        const filtered: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (
            v &&
            typeof v === "object" &&
            (v as Record<string, unknown>)[entry.filter.child] === entry.filter.value
          ) {
            filtered[k] = v;
          }
        }
        value = filtered;
      }
      entry.fn(makeSnap(value));
    }
  }
}

type RefMarker = {
  __isRef: true;
  path: string;
  filter?: { child: string; value: unknown };
};

vi.mock("firebase/database", () => {
  const ref = (_db: unknown, path: string = ""): RefMarker => ({
    __isRef: true,
    path,
  });
  const get = async (r: RefMarker) => makeSnap(getAt(r.path));
  const set = async (r: RefMarker, value: unknown) => {
    setAt(r.path, value);
  };
  const remove = async (r: RefMarker) => {
    removeAt(r.path);
  };
  const runTransaction = async (
    r: RefMarker,
    updater: (current: unknown) => unknown,
  ) => {
    const current = getAt(r.path);
    const cloned = current === null || current === undefined ? current : JSON.parse(JSON.stringify(current));
    const next = updater(cloned);
    if (next === undefined) {
      return {
        committed: false,
        snapshot: makeSnap(current),
      };
    }
    setAt(r.path, next);
    return {
      committed: true,
      snapshot: makeSnap(getAt(r.path)),
    };
  };
  const onValue = (
    r: RefMarker,
    fn: Listener,
  ) => {
    const entry = { path: r.path, filter: r.filter, fn };
    let bucket = store.listeners.get(r.path);
    if (!bucket) {
      bucket = new Set();
      store.listeners.set(r.path, bucket);
    }
    bucket.add(entry);
    let value = getAt(r.path);
    if (entry.filter && value && typeof value === "object") {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (
          v &&
          typeof v === "object" &&
          (v as Record<string, unknown>)[entry.filter.child] === entry.filter.value
        ) {
          filtered[k] = v;
        }
      }
      value = filtered;
    }
    fn(makeSnap(value));
    return () => {
      bucket?.delete(entry);
    };
  };
  const update = async (r: RefMarker, values: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(values)) {
      const full = r.path ? `${r.path}/${k}` : k;
      setAt(full, v);
    }
  };
  const onDisconnect = (_r: RefMarker) => ({
    remove: async () => {},
    cancel: async () => {},
    set: async () => {},
    update: async () => {},
    setWithPriority: async () => {},
  });
  const serverTimestamp = () => SERVER_TS;
  const orderByChild = (child: string) => ({ __order: child });
  const equalTo = (value: unknown) => ({ __equal: value });
  const query = (
    r: RefMarker,
    order: { __order: string },
    eq?: { __equal: unknown },
  ): RefMarker => ({
    __isRef: true,
    path: r.path,
    filter: eq ? { child: order.__order, value: eq.__equal } : undefined,
  });
  return { ref, get, set, remove, update, runTransaction, onValue, onDisconnect, serverTimestamp, orderByChild, equalTo, query };
});

vi.mock("@/lib/firebase/client", () => ({
  getRtdb: () => ({ __mockDb: true }),
}));

import {
  createRoom,
  joinRoom,
  leaveRoom,
  incrementSolved,
  startRace,
  endRace,
  subscribeRoom,
  subscribePublicRooms,
} from "@/lib/firebase/rooms";
import type { Room } from "@/lib/types";

function readRoom(code: string): Room | null {
  return getAt(`rooms/${code}`) as Room | null;
}

describe("rooms (RTDB operations)", () => {
  beforeEach(() => {
    store.data = {};
    store.listeners.clear();
    store.nowCounter.v = 1000;
  });

  it("createRoom writes a lobby doc with host seeded and correct fields", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 12345,
      visibility: "public",
    });
    const room = readRoom("ABC23");
    expect(room).not.toBeNull();
    expect(room?.state).toBe("lobby");
    expect(room?.host).toBe("u_host");
    expect(room?.trickId).toBe("20");
    expect(room?.seed).toBe(12345);
    expect(room?.visibility).toBe("public");
    expect(room?.questionCount).toBe(5);
    expect(room?.startedAt).toBeNull();
    expect(room?.endedAt).toBeNull();
    expect(room?.winnerUid).toBeNull();
    expect(room?.players.u_host).toMatchObject({
      displayName: "Ada",
      avatarInitials: "AD",
      solved: 0,
      finishedAt: null,
    });
    expect(typeof room?.players.u_host.joinedAt).toBe("number");
    expect(typeof room?.createdAt).toBe("number");
  });

  it("joinRoom adds a player entry without touching top-level fields", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    const seedBefore = readRoom("ABC23")?.seed;
    const trickBefore = readRoom("ABC23")?.trickId;

    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    const after = readRoom("ABC23");
    expect(after?.seed).toBe(seedBefore);
    expect(after?.trickId).toBe(trickBefore);
    expect(after?.host).toBe("u_host");
    expect(Object.keys(after?.players ?? {})).toEqual(
      expect.arrayContaining(["u_host", "u2"]),
    );
    expect(after?.players.u2).toMatchObject({
      displayName: "Bo",
      avatarInitials: "BO",
      solved: 0,
      finishedAt: null,
    });
  });

  it("joinRoom overwrites existing players/{uid} entry on idempotent rejoin", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    // Simulate progress, then rejoin
    await incrementSolved("ABC23", "u2");
    expect(readRoom("ABC23")?.players.u2.solved).toBe(1);

    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo Reborn",
      avatarInitials: "BR",
    });
    expect(readRoom("ABC23")?.players.u2.solved).toBe(0);
    expect(readRoom("ABC23")?.players.u2.displayName).toBe("Bo Reborn");
  });

  it("leaveRoom removes the player", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    await leaveRoom("ABC23", "u2");
    const room = readRoom("ABC23");
    expect(room?.players.u2).toBeUndefined();
    expect(room?.players.u_host).toBeDefined();
  });

  it("leaveRoom deletes the room when the last player leaves", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await leaveRoom("ABC23", "u_host");
    expect(readRoom("ABC23")).toBeNull();
  });

  it("leaveRoom transfers host to the next-joined player when host leaves with others remaining", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u3",
      displayName: "Cy",
      avatarInitials: "CY",
    });
    const joinedU2 = readRoom("ABC23")?.players.u2.joinedAt;
    const joinedU3 = readRoom("ABC23")?.players.u3.joinedAt;
    expect((joinedU2 as number) < (joinedU3 as number)).toBe(true);

    await leaveRoom("ABC23", "u_host");
    expect(readRoom("ABC23")?.host).toBe("u2");
  });

  it("incrementSolved increments by 1 and returns the new value", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    const first = await incrementSolved("ABC23", "u_host");
    expect(first).toBe(1);
    const second = await incrementSolved("ABC23", "u_host");
    expect(second).toBe(2);
    expect(readRoom("ABC23")?.players.u_host.solved).toBe(2);
  });

  it("startRace flips state to 'racing' only if caller is host", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await startRace("ABC23", "u_host");
    expect(readRoom("ABC23")?.state).toBe("racing");
    expect(typeof readRoom("ABC23")?.startedAt).toBe("number");
  });

  it("startRace rejects when caller is not the host (state stays 'lobby')", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    await startRace("ABC23", "u2");
    expect(readRoom("ABC23")?.state).toBe("lobby");
    expect(readRoom("ABC23")?.startedAt).toBeNull();
  });

  it("endRace returns true on first call, false on second", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    await startRace("ABC23", "u_host");
    const firstWin = await endRace("ABC23", "u_host");
    expect(firstWin).toBe(true);
    expect(readRoom("ABC23")?.state).toBe("ended");
    expect(readRoom("ABC23")?.winnerUid).toBe("u_host");
    expect(typeof readRoom("ABC23")?.players.u_host.finishedAt).toBe("number");

    const secondWin = await endRace("ABC23", "u2");
    expect(secondWin).toBe(false);
    expect(readRoom("ABC23")?.winnerUid).toBe("u_host");
  });

  it("subscribeRoom fires callback on subscription and on subsequent updates", async () => {
    await createRoom({
      code: "ABC23",
      host: "u_host",
      hostDisplayName: "Ada",
      hostAvatarInitials: "AD",
      trickId: "20",
      seed: 1,
      visibility: "public",
    });
    const calls: Array<Room | null> = [];
    const unsub = subscribeRoom("ABC23", (room) => calls.push(room));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.state).toBe("lobby");

    await joinRoom({
      code: "ABC23",
      uid: "u2",
      displayName: "Bo",
      avatarInitials: "BO",
    });
    expect(calls.length).toBeGreaterThanOrEqual(2);
    const latest = calls[calls.length - 1];
    expect(Object.keys(latest?.players ?? {})).toContain("u2");
    unsub();
  });

  it("subscribePublicRooms filters out private and non-lobby rooms, sorted by createdAt asc", async () => {
    await createRoom({
      code: "AAA22",
      host: "h1",
      hostDisplayName: "A",
      hostAvatarInitials: "AA",
      trickId: "1",
      seed: 1,
      visibility: "public",
    });
    await createRoom({
      code: "BBB33",
      host: "h2",
      hostDisplayName: "B",
      hostAvatarInitials: "BB",
      trickId: "2",
      seed: 2,
      visibility: "private",
    });
    await createRoom({
      code: "CCC44",
      host: "h3",
      hostDisplayName: "C",
      hostAvatarInitials: "CC",
      trickId: "3",
      seed: 3,
      visibility: "public",
    });
    await startRace("CCC44", "h3"); // CCC44 leaves lobby -> should be filtered out

    await createRoom({
      code: "DDD55",
      host: "h4",
      hostDisplayName: "D",
      hostAvatarInitials: "DD",
      trickId: "4",
      seed: 4,
      visibility: "public",
    });

    const results: Array<Array<{ code: string; createdAt: number }>> = [];
    const unsub = subscribePublicRooms((rooms) =>
      results.push(rooms.map((r) => ({ code: r.code, createdAt: r.createdAt }))),
    );
    const latest = results[results.length - 1];
    const codes = latest.map((r) => r.code);
    expect(codes).toContain("AAA22");
    expect(codes).toContain("DDD55");
    expect(codes).not.toContain("BBB33"); // private
    expect(codes).not.toContain("CCC44"); // not in lobby anymore
    // sorted asc by createdAt
    for (let i = 1; i < latest.length; i++) {
      expect(latest[i].createdAt >= latest[i - 1].createdAt).toBe(true);
    }
    unsub();
  });
});
