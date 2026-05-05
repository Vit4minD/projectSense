import { Firestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { trackEvent } from "@/firebase/config";

interface BestDoc {
  time: string;
}

const TIME_PATTERN = /^([0-5]\d):([0-5]\d)\.(\d{2})$/;

function timeToMs(time: string): number | null {
  const m = time.match(TIME_PATTERN);
  if (!m) return null;
  return parseInt(m[1], 10) * 60_000 + parseInt(m[2], 10) * 1_000 + parseInt(m[3], 10) * 10;
}

function isFaster(oldTime: string | undefined, newTime: string): boolean {
  const newMs = timeToMs(newTime);
  if (newMs === null || newMs === 0) return false;
  if (!oldTime) return true;
  const oldMs = timeToMs(oldTime);
  if (oldMs === null) return true;
  return newMs < oldMs;
}

export default async function updateLeaderboard(
  user: User,
  db: Firestore,
  trickId: number,
  time: string
): Promise<void> {
  if (timeToMs(time) === null) return;

  const bestRef = doc(db, "users", user.uid, "bests", String(trickId));
  const bestSnap = await getDoc(bestRef);
  const oldBest = bestSnap.exists() ? (bestSnap.data() as BestDoc).time : undefined;
  if (!isFaster(oldBest, time)) return;

  await setDoc(bestRef, { time });
  trackEvent("leaderboard_submitted", {
    trick_id: trickId,
    time,
    time_ms: timeToMs(time) ?? 0,
  });

  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ trickId, time }),
    });
    if (!res.ok) {
      console.error("Leaderboard write failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Leaderboard write failed:", err);
  }
}
