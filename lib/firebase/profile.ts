import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb } from "./client";
import { getAllBests, type SavedDrill } from "./drills";
import type { Best, DrillResult } from "@/lib/types";
import { computeAchievements, type Achievement } from "@/lib/data/achievements";

export type ProfileStats = {
  totalDrills: number;
  totalCorrect: number;
  accuracy: number; // 0..1
  tricksPracticed: number;
  strongest: { trickId: string; bestMs: number }[];
  weakest: { trickId: string; rate: number }[];
  weeklyMs: number[]; // 7 entries, oldest..newest, in user-local day buckets
  achievements: Achievement[];
};

export async function getProfileStats(uid: string): Promise<ProfileStats> {
  const db = getDb();
  const sinceMs = Date.now() - 30 * 86_400_000;
  const drillsQ = query(
    collection(db, "users", uid, "drills"),
    where("startedAt", ">=", Timestamp.fromMillis(sinceMs)),
    orderBy("startedAt", "desc"),
    limit(500),
  );
  const [bestsMap, drillsSnap] = await Promise.all([getAllBests(uid), getDocs(drillsQ)]);
  const drills = drillsSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as DrillResult) }) as SavedDrill,
  );
  return aggregateProfile(bestsMap, drills, new Date());
}

/**
 * Pure aggregation. All inputs in, ProfileStats out — no Firestore. Kept exported
 * so unit tests can drive it with synthetic data.
 *
 * Weekly bucketing uses user-local day boundaries (Date#toDateString), so DST
 * transitions are absorbed by the locale's wall-clock day rather than UTC.
 */
export function aggregateProfile(
  bests: Map<string, Best>,
  drills: SavedDrill[],
  now: Date,
): ProfileStats {
  const QUESTIONS_PER = 5;

  let totalDrills = 0;
  let totalCorrect = 0;
  let perfectRuns = 0;
  let fastestSubTenMs: number | null = null;

  for (const b of bests.values()) {
    totalDrills += b.attempts;
    totalCorrect += b.correct;
  }

  for (const d of drills) {
    if (d.score === `${QUESTIONS_PER}/${QUESTIONS_PER}`) {
      perfectRuns++;
      if (d.totalMs < 10_000 && (fastestSubTenMs === null || d.totalMs < fastestSubTenMs)) {
        fastestSubTenMs = d.totalMs;
      }
    }
  }

  const accuracy = totalDrills > 0 ? totalCorrect / (totalDrills * QUESTIONS_PER) : 0;

  const strongest = Array.from(bests.entries())
    .filter(([, b]) => b.bestMs !== undefined)
    .map(([trickId, b]) => ({ trickId, bestMs: b.bestMs as number }))
    .sort((a, b) => a.bestMs - b.bestMs)
    .slice(0, 5);

  const weakest = Array.from(bests.entries())
    .filter(([, b]) => b.attempts >= 2)
    .map(([trickId, b]) => ({ trickId, rate: b.correct / (b.attempts * QUESTIONS_PER) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  const weeklyMs = computeWeeklyMs(drills, now);

  const achievements = computeAchievements({
    totalDrills,
    perfectRuns,
    fastestSubTenMs,
    tricksPracticed: bests.size,
  });

  return {
    totalDrills,
    totalCorrect,
    accuracy,
    tricksPracticed: bests.size,
    strongest,
    weakest,
    weeklyMs,
    achievements,
  };
}

function dayKey(date: Date): string {
  return date.toDateString();
}

function computeWeeklyMs(drills: SavedDrill[], now: Date): number[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dayKey(d));
  }
  const buckets: Record<string, number> = Object.fromEntries(days.map((k) => [k, 0]));

  for (const drill of drills) {
    if (!drill.startedAt) continue;
    const ms = drill.startedAt.toMillis();
    const key = dayKey(new Date(ms));
    if (key in buckets) buckets[key] += drill.totalMs;
  }
  return days.map((k) => buckets[k] ?? 0);
}
