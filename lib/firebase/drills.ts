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
} from "firebase/firestore";
import { getDb } from "./client";
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
    } else if (prevData?.bestMs !== undefined) {
      next.bestMs = prevData.bestMs;
    }
    tx.set(bestRef, next, { merge: true });
  });

  return newDrillRef.id;
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
