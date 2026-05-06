import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { aggregateProfile } from "@/lib/firebase/profile";
import type { SavedDrill } from "@/lib/firebase/drills";
import type { Best } from "@/lib/types";

function ts(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function mkBest(opts: Partial<Best> & { bestMs?: number; attempts: number; correct: number }): Best {
  return {
    bestMs: opts.bestMs ?? 0,
    attempts: opts.attempts,
    correct: opts.correct,
    lastAttemptAt: ts(new Date()),
  };
}

function mkDrill(
  id: string,
  trickId: string,
  totalMs: number,
  score: string,
  startedAt: Date,
): SavedDrill {
  return {
    id,
    trickId,
    totalMs,
    score,
    startedAt: ts(startedAt),
    perQuestion: [],
  };
}

describe("aggregateProfile", () => {
  const now = new Date("2026-05-05T12:00:00");

  it("returns zeroed stats for empty inputs", () => {
    const stats = aggregateProfile(new Map(), [], now);
    expect(stats.totalDrills).toBe(0);
    expect(stats.totalCorrect).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(stats.tricksPracticed).toBe(0);
    expect(stats.strongest).toEqual([]);
    expect(stats.weakest).toEqual([]);
    expect(stats.weeklyMs).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats.achievements.every((a) => !a.unlocked)).toBe(true);
  });

  it("totals attempts and correct counts across bests", () => {
    const bests = new Map<string, Best>([
      ["01", mkBest({ bestMs: 12000, attempts: 4, correct: 18 })],
      ["02", mkBest({ bestMs: 8000, attempts: 6, correct: 27 })],
    ]);
    const stats = aggregateProfile(bests, [], now);
    expect(stats.totalDrills).toBe(10);
    expect(stats.totalCorrect).toBe(45);
    expect(stats.accuracy).toBeCloseTo(45 / 50, 5);
    expect(stats.tricksPracticed).toBe(2);
  });

  it("strongest is ordered by lowest bestMs and capped at 5", () => {
    const bests = new Map<string, Best>(
      Array.from({ length: 7 }, (_, i) => [
        String(i + 1).padStart(2, "0"),
        mkBest({ bestMs: (7 - i) * 1000, attempts: 1, correct: 5 }),
      ]),
    );
    const stats = aggregateProfile(bests, [], now);
    expect(stats.strongest.map((s) => s.trickId)).toEqual(["07", "06", "05", "04", "03"]);
    expect(stats.strongest[0].bestMs).toBe(1000);
  });

  it("weakest excludes bests with fewer than 2 attempts", () => {
    const bests = new Map<string, Best>([
      ["01", mkBest({ bestMs: 9000, attempts: 1, correct: 2 })], // would be weakest, but only 1 attempt — excluded
      ["02", mkBest({ bestMs: 9000, attempts: 4, correct: 10 })], // 50%
      ["03", mkBest({ bestMs: 9000, attempts: 5, correct: 24 })], // 96%
    ]);
    const stats = aggregateProfile(bests, [], now);
    expect(stats.weakest.map((w) => w.trickId)).toEqual(["02", "03"]);
    expect(stats.weakest[0].rate).toBeCloseTo(0.5, 5);
  });

  it("weekly bucketing places drills into correct user-local day", () => {
    // 7 daily buckets ending on `now`. Place one drill on each of the last 7 days.
    const drills: SavedDrill[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(10, 0, 0, 0);
      drills.push(mkDrill(`d${i}`, "01", 1000 * (i + 1), "5/5", d));
    }
    const stats = aggregateProfile(new Map(), drills, now);
    // Index 0 is oldest (i=6), index 6 is today (i=0). totalMs at oldest = 7000, today = 1000.
    expect(stats.weeklyMs).toEqual([7000, 6000, 5000, 4000, 3000, 2000, 1000]);
  });

  it("ignores drills outside the 7-day window for the weekly chart", () => {
    const old = new Date(now);
    old.setDate(old.getDate() - 15);
    const stats = aggregateProfile(new Map(), [mkDrill("d", "01", 9999, "5/5", old)], now);
    expect(stats.weeklyMs).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("unlocks first-steps and perfect on a single 5/5 drill", () => {
    const bests = new Map<string, Best>([["01", mkBest({ bestMs: 12000, attempts: 1, correct: 5 })]]);
    const drills = [mkDrill("d", "01", 12000, "5/5", now)];
    const stats = aggregateProfile(bests, drills, now);
    const ach = (id: string) => stats.achievements.find((a) => a.id === id)?.unlocked;
    expect(ach("first-steps")).toBe(true);
    expect(ach("perfect")).toBe(true);
    expect(ach("on-a-roll")).toBe(false);
    expect(ach("speed-demon")).toBe(false);
  });

  it("unlocks speed-demon when a 5/5 drill is sub-10s", () => {
    const drills = [mkDrill("d", "01", 9500, "5/5", now)];
    const stats = aggregateProfile(new Map(), drills, now);
    expect(stats.achievements.find((a) => a.id === "speed-demon")?.unlocked).toBe(true);
  });

  it("does not unlock speed-demon on a sub-10s non-5/5 run", () => {
    const drills = [mkDrill("d", "01", 5000, "4/5", now)];
    const stats = aggregateProfile(new Map(), drills, now);
    expect(stats.achievements.find((a) => a.id === "speed-demon")?.unlocked).toBe(false);
  });

  it("unlocks centurion at 100 drills and master at 43 tricks practiced", () => {
    const bests = new Map<string, Best>(
      Array.from({ length: 43 }, (_, i) => [
        String(i + 1).padStart(2, "0"),
        mkBest({ bestMs: 9000, attempts: 3, correct: 12 }),
      ]),
    );
    const stats = aggregateProfile(bests, [], now);
    const ach = (id: string) => stats.achievements.find((a) => a.id === id)?.unlocked;
    expect(stats.totalDrills).toBe(129);
    expect(ach("centurion")).toBe(true);
    expect(ach("catalogue")).toBe(true);
    expect(ach("master")).toBe(true);
  });
});
