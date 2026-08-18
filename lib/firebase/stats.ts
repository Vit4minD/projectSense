// No direct `import "server-only"` here: this module imports `./admin`, which
// is itself server-only, so bundling it into a client component still fails the
// build. Omitting it keeps the module unit-testable with a mocked admin SDK.
import { getAdminDb } from "./admin";
import { TRICKS } from "@/lib/data/tricks";

const QUESTIONS_PER_DRILL = 5;

export type GlobalStats = {
  users: number;
  drills: number;
  leaderboardEntries: number;
  questionsAnswered: number;
  tricksInCatalog: number;
};

/**
 * Real, live usage totals derived from Firestore count aggregations via the
 * admin SDK. Counts bypass security rules (admin) and require no client write
 * path, so no new collection or rule is introduced. Cheap: ~1 read per 1000
 * documents counted.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const db = getAdminDb();
  const [users, drills, entries] = await Promise.all([
    db.collection("users").count().get(),
    db.collectionGroup("drills").count().get(),
    db.collectionGroup("entries").count().get(),
  ]);
  const drillCount = drills.data().count;
  return {
    users: users.data().count,
    drills: drillCount,
    leaderboardEntries: entries.data().count,
    questionsAnswered: drillCount * QUESTIONS_PER_DRILL,
    tricksInCatalog: TRICKS.length,
  };
}
