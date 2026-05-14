import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "./client";
import { trackEvent } from "./analytics";
import type { Best, DrillResult, PerQuestion } from "@/lib/types";

export type SavedDrill = DrillResult & { id: string };

export async function saveDrillResult(
  uid: string,
  trickId: string,
  totalMs: number,
  perQuestion: PerQuestion[],
): Promise<string> {
  const db = getDb();
  const correct = perQuestion.filter((p) => p.correct).length;
  const score = `${correct}/${perQuestion.length}`;

  const drillsCol = collection(db, "users", uid, "drills");
  const newDrillRef = doc(drillsCol);

  const bestRef = doc(db, "users", uid, "bests", trickId);

  let isNewBest = false;
  await runTransaction(db, async (tx) => {
    tx.set(newDrillRef, {
      trickId,
      startedAt: serverTimestamp(),
      totalMs,
      score,
      perQuestion,
    });

    const prev = await tx.get(bestRef);
    const allCorrect = correct === perQuestion.length;
    const prevData = prev.exists() ? (prev.data() as Best) : null;
    const next: Partial<Best> = {
      attempts: (prevData?.attempts ?? 0) + 1,
      correct: (prevData?.correct ?? 0) + correct,
      lastAttemptAt: serverTimestamp() as Timestamp,
    };
    if (allCorrect && (!prevData || totalMs < prevData.bestMs)) {
      next.bestMs = totalMs;
      isNewBest = true;
    } else if (prevData?.bestMs !== undefined) {
      next.bestMs = prevData.bestMs;
    }
    tx.set(bestRef, next, { merge: true });
  });

  void trackEvent("practice_session_completed", {
    trick_id: trickId,
    duration_ms: totalMs,
    number_correct: correct,
    total: perQuestion.length,
    score,
  });

  if (isNewBest) {
    void publishToLeaderboard(trickId, newDrillRef.id, totalMs);
  }

  return newDrillRef.id;
}

async function publishToLeaderboard(
  trickId: string,
  drillId: string,
  bestMs: number,
): Promise<void> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trickId, drillId, bestMs }),
    });
    if (res.ok) {
      void trackEvent("leaderboard_submitted", { trick_id: trickId, time_ms: bestMs });
    }
  } catch {
    // Local data is already consistent — leaderboard publish is best-effort.
  }
}

export async function getDrillById(uid: string, drillId: string): Promise<SavedDrill | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, "users", uid, "drills", drillId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as DrillResult) };
}

export async function getRecentDrills(uid: string, max: number = 5): Promise<SavedDrill[]> {
  const db = getDb();
  const q = query(
    collection(db, "users", uid, "drills"),
    orderBy("startedAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DrillResult) }));
}

export async function getDrillsForTrick(
  uid: string,
  trickId: string,
  max: number = 10,
): Promise<SavedDrill[]> {
  const db = getDb();
  const q = query(
    collection(db, "users", uid, "drills"),
    where("trickId", "==", trickId),
    orderBy("startedAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DrillResult) }));
}

export async function getBest(uid: string, trickId: string): Promise<Best | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, "users", uid, "bests", trickId));
  return snap.exists() ? (snap.data() as Best) : null;
}

export async function getAllBests(uid: string): Promise<Map<string, Best>> {
  const db = getDb();
  const snap = await getDocs(collection(db, "users", uid, "bests"));
  const out = new Map<string, Best>();
  snap.docs.forEach((d) => out.set(d.id, d.data() as Best));
  return out;
}
