import {
  Firestore,
  collection,
  doc,
  getDoc,
  DocumentSnapshot,
  writeBatch,
} from "firebase/firestore";

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
    const update = isFasterTime(oldTime, newTime)

    if (update) {
      batch.update(userRef, { [trick]: time });
      const scoresSnap = (await getDoc(
        scoresRef
      )) as DocumentSnapshot<Leaderboard>;
      if (scoresSnap.exists()) {
        const scoresData = scoresSnap.data();
        const scoreList = { ...scoresData?.scores, [email]: time };
        batch.update(scoresRef, { scores: scoreList });
      } else {
        const newScores = { scores: { [email]: time } };
        batch.set(scoresRef, newScores);
      }
      await batch.commit();
    }
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    throw error;
  }
}

function isFasterTime(oldTime: string, newTime: string): boolean {
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