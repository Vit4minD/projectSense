import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, set, update, get, remove } from "firebase/database";
import { problemFunction } from "@/app/utils/problemGenerator";

function generateRoomCode() {
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const Firebase = initializeApp(firebaseConfig);
export const database = getDatabase(Firebase);
export const auth = getAuth(Firebase);
export const db = getFirestore(Firebase);

export function setQuestions(code, trick) {
  const questionsRef = ref(database, `rooms/${code}/questions`);
  const payload = {
    1: problemFunction[trick].function(),
    2: problemFunction[trick].function(),
    3: problemFunction[trick].function(),
    4: problemFunction[trick].function(),
    5: problemFunction[trick].function(),
    6: problemFunction[trick].function(),
  };
  return update(questionsRef, payload);
}

export function createRoom() {
  const code = generateRoomCode();
  const room = {
    state: "waiting",
    startTime: new Date().toISOString(),
    players: {},
  };
  return set(ref(database, `rooms/${code}`), room).then(() => code);
}

export function joinRoom(code, uid, playerData) {
  return set(ref(database, `rooms/${code}/players/${uid}`), playerData);
}

export function updatePlayerPosition(code, uid, position) {
  return update(ref(database, `rooms/${code}/players/${uid}/position`), position);
}

export async function getAvailableRooms() {
  const snapshot = await get(ref(database, `rooms`));
  const rooms = snapshot.val();
  if (!rooms) return [];
  return Object.entries(rooms).filter(([, room]) => room.state === "waiting");
}

export function endRoom(code) {
  return remove(ref(database, `rooms/${code}`));
}

export function startRoom(code) {
  return update(ref(database, `rooms/${code}`), { state: "in_progress" });
}

export async function getRoom(code) {
  const snapshot = await get(ref(database, `rooms/${code}`));
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  if (!data?.players) return [];
  return Object.entries(data.players).map(([uid, playerData]) => ({
    uid,
    questionsSolved: playerData.questionsSolved,
  }));
}
