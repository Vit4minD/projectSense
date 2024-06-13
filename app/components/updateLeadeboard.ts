import {
  Firestore,
  collection,
  doc,
  getDoc,
  DocumentSnapshot,
  writeBatch,
} from "firebase/firestore";

interface User {
  [key: string]: any;
}

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

    const batch = writeBatch(db);

    const userSnap: DocumentSnapshot<User> = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("User document not found.");
    }

    const userData = userSnap.data();

    if (userData && userData[trick]) {
      if (compareTimes(userData[trick], time) === 1) {
        batch.update(userRef, { [trick]: time });
      }
    } else {
      batch.update(userRef, { [trick]: time });
    }

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

    console.log("Document successfully updated!");
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    throw error; 
  }
}

function compareTimes(time1: string, time2: string): number {
  const [min1, sec1, ms1] = time1.split(":").map((x) => parseFloat(x));
  const [min2, sec2, ms2] = time2.split(":").map((x) => parseFloat(x));

  const totalMs1 = min1 * 60000 + sec1 * 1000 + ms1;
  const totalMs2 = min2 * 60000 + sec2 * 1000 + ms2;

  if (totalMs1 < totalMs2) {
    return -1;
  } else if (totalMs1 > totalMs2) {
    return 1;
  } else {
    return 0;
  }
}
