import { describe, expect, it, vi, beforeEach } from "vitest";

// Stub firebase/firestore so getLeaderboardForTrick can be exercised without a
// real Firestore connection. The mock asserts that the right query shape is
// built (collection path, orderBy, limit) and that returned docs are mapped
// into LeaderboardEntry objects with `uid` lifted from the doc id.
const calls: { kind: string; args: unknown[] }[] = [];

vi.mock("firebase/firestore", () => {
  const collection = (...args: unknown[]) => {
    calls.push({ kind: "collection", args });
    return { __ref: args };
  };
  const orderBy = (...args: unknown[]) => {
    calls.push({ kind: "orderBy", args });
    return { __orderBy: args };
  };
  const limit = (n: number) => {
    calls.push({ kind: "limit", args: [n] });
    return { __limit: n };
  };
  const query = (...parts: unknown[]) => {
    calls.push({ kind: "query", args: parts });
    return { __q: parts };
  };
  const getDocs = vi.fn(async () => ({
    docs: [
      {
        id: "u1",
        data: () => ({
          bestMs: 8000,
          displayName: "A",
          school: "X",
          updatedAt: { toMillis: () => 0 },
        }),
      },
      {
        id: "u2",
        data: () => ({
          bestMs: 9000,
          displayName: "B",
          school: "Y",
          updatedAt: { toMillis: () => 0 },
        }),
      },
    ],
  }));
  return { collection, orderBy, limit, query, getDocs };
});

vi.mock("@/lib/firebase/client", () => ({
  getDb: () => ({ __db: true }),
}));

import { getLeaderboardForTrick } from "@/lib/firebase/leaderboard";

describe("getLeaderboardForTrick", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("queries leaderboards/{trickId}/entries ordered by bestMs asc", async () => {
    await getLeaderboardForTrick("20", 25);
    const collectionCall = calls.find((c) => c.kind === "collection");
    expect(collectionCall?.args.slice(1)).toEqual(["leaderboards", "20", "entries"]);
    expect(calls.find((c) => c.kind === "orderBy")?.args).toEqual(["bestMs", "asc"]);
    expect(calls.find((c) => c.kind === "limit")?.args).toEqual([25]);
  });

  it("maps each doc into a LeaderboardEntry, lifting id into uid", async () => {
    const rows = await getLeaderboardForTrick("20");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ uid: "u1", bestMs: 8000, displayName: "A", school: "X" });
    expect(rows[1]).toMatchObject({ uid: "u2", bestMs: 9000 });
  });

  it("defaults limit to 10 when not specified", async () => {
    await getLeaderboardForTrick("01");
    expect(calls.find((c) => c.kind === "limit")?.args).toEqual([10]);
  });
});
