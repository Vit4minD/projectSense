import {
  Firestore,
  collection,
  doc,
  getDoc,
  DocumentSnapshot,
  writeBatch,
} from "firebase/firestore";
import { trackEvent } from "@/firebase/config";

interface Leaderboard {
  scores: { [key: string]: string };
}

export default async function updateLeaderboard(
  email: string,
  db: Firestore,
  trick: number,
  time: string
): Promise<void> {
  try {
    const colRef = collection(db, "users");
    const boardRef = collection(db, "leaderboard");
    const userRef = doc(colRef, email);
    const scoresRef = doc(boardRef, String(trick));

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User document not found.");
    }

    const batch = writeBatch(db);
    const userData = userSnap.data();

    const oldTime = userData[trick];
    const newTime = time;
    const update = isFasterTime(oldTime, newTime);

    if (update) {
      batch.update(userRef, { [trick]: time });
      const scoresSnap = (await getDoc(scoresRef)) as DocumentSnapshot<Leaderboard>;
      if (scoresSnap.exists()) {
        const scoresData = scoresSnap.data();
        const scoreList = { ...scoresData?.scores, [email]: time };
        batch.update(scoresRef, { scores: scoreList });
      } else {
        const newScores = { scores: { [email]: time } };
        batch.set(scoresRef, newScores);
      }
      await batch.commit();
      trackEvent("leaderboard_submitted", { trick_id: trick, time });
    }
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    throw error;
  }
}

function isValidTime(newTime: string) {
  // Check if newTime is exactly "00:00.00"
  if (newTime === "00:00.00") return false;

  // Regular expression to validate the time format MM:SS.DD
  const timePattern = /^(\d{2}):([0-5]\d)\.(\d{2})$/;

  // Check if newTime matches the pattern
  const match = newTime.match(timePattern);
  if (!match) return false;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const decimals = parseInt(match[3], 10);

  // Return true if all checks pass
  return minutes >= 0 && seconds >= 0 && seconds < 60 && decimals >= 0;
}

function isFasterTime(oldTime: string, newTime: string): boolean {
  if (newTime === "00:00.00") return false;
  if (!isValidTime(newTime)) return false;
  if (!oldTime) return true;
  const parseTime = (time: string) => {
    const [min, sec] = time.split(":");
    const [seconds, milliseconds] = sec.split(".");
    return parseFloat(min) * 60 * 1000 + parseFloat(seconds) * 1000 + parseFloat(milliseconds);
  };

  const oldTimeMs = parseTime(oldTime);
  const newTimeMs = parseTime(newTime);

  return newTimeMs < oldTimeMs;
}
