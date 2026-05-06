import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getDb } from "./client";
import type { LeaderboardEntry } from "@/lib/types";

export async function getLeaderboardForTrick(
  trickId: string,
  max: number = 10,
): Promise<LeaderboardEntry[]> {
  const db = getDb();
  const q = query(
    collection(db, "leaderboards", trickId, "entries"),
    orderBy("bestMs", "asc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<LeaderboardEntry, "uid">) }));
}
