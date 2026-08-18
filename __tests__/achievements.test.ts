import { describe, it, expect } from "vitest";
import { ACHIEVEMENTS, computeAchievements } from "@/lib/data/achievements";
import { TRICKS } from "@/lib/data/tricks";

const base = { totalDrills: 200, perfectRuns: 5, fastestSubTenMs: 5000 };

describe("achievements — master threshold tracks the catalog", () => {
  it("unlocks master at exactly TRICKS.length tricks practiced", () => {
    const master = computeAchievements({ ...base, tricksPracticed: TRICKS.length }).find(
      (a) => a.id === "master",
    )!;
    expect(master.unlocked).toBe(true);
  });

  it("keeps master locked one trick short of the catalog", () => {
    const master = computeAchievements({ ...base, tricksPracticed: TRICKS.length - 1 }).find(
      (a) => a.id === "master",
    )!;
    expect(master.unlocked).toBe(false);
  });

  it("states the real catalog size in the master hint", () => {
    const def = ACHIEVEMENTS.find((a) => a.id === "master")!;
    expect(def.hint).toContain(String(TRICKS.length));
  });
});
