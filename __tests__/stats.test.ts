import { vi, describe, it, expect } from "vitest";
import { TRICKS } from "@/lib/data/tricks";

const { getAdminDb } = vi.hoisted(() => ({ getAdminDb: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ getAdminDb }));

function countGetter(n: number) {
  return { count: () => ({ get: () => Promise.resolve({ data: () => ({ count: n }) }) }) };
}

import { getGlobalStats } from "@/lib/firebase/stats";

describe("getGlobalStats", () => {
  it("aggregates users, drills, entries and derives questions answered", async () => {
    getAdminDb.mockReturnValue({
      collection: (name: string) => countGetter(name === "users" ? 3 : 0),
      collectionGroup: (name: string) =>
        countGetter(name === "drills" ? 10 : name === "entries" ? 4 : 0),
    });

    const stats = await getGlobalStats();
    expect(stats).toEqual({
      users: 3,
      drills: 10,
      leaderboardEntries: 4,
      questionsAnswered: 50,
      tricksInCatalog: TRICKS.length,
    });
  });
});
