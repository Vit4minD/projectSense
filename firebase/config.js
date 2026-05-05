// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
} from "firebase/analytics";
import "firebase/performance";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, set, update, get, push } from "firebase/database";
import { problemFunction } from "@/app/utils/problemGenerator";

function generateRandomNumbers() {
  let result = "";
  for (let i = 0; i < 5; i++) {
    const randomDigit = Math.floor(Math.random() * 10); // Generate a random number between 0 and 9
    result += randomDigit.toString(); // Convert the random number to string and append to result
  }
  return result;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASEURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function setQuestions(gameId, trick) {
  const questionRef = ref(database, `games/${gameId}/questions`);
  let questionJson = {
    1: problemFunction[trick].function(),
    2: problemFunction[trick].function(),
    3: problemFunction[trick].function(),
    4: problemFunction[trick].function(),
    5: problemFunction[trick].function(),
    6: problemFunction[trick].function(),
  };
  return update(questionRef, questionJson);
}

function createGameSession() {
  const gameId = generateRandomNumbers();
  const gameData = {
    state: "waiting",
    startTime: new Date().toISOString(),
    players: {},
  };
  const gameRef = ref(database, `games/${gameId}`);
  return set(gameRef, gameData).then(() => gameId);
}

function joinGameSession(gameId, playerId, playerData) {
  const playerRef = ref(
    database,
    `games/${gameId}/players/${playerId.replace(/[.#$[\]]/g, "_")}`
  );
  return set(playerRef, playerData);
}

function updatePlayerPosition(gameId, playerId, position) {
  const playerPositionRef = ref(
    database,
    `games/${gameId}/players/${playerId.replace(/[.#$[\]]/g, "_")}/position`
  );
  return update(playerPositionRef, position);
}

async function getAvailableGames() {
  const gamesRef = ref(database, `games`);
  const snapshot = await get(gamesRef);
  const games = snapshot.val();
  return games
    ? Object.entries(games).filter(([gameId, game]) => game.state === "waiting")
    : [];
}

function endGameSession(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  remove(gameRef);
  return update(gameRef, { state: "ended" });
}

function startGameSession(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  return update(gameRef, { state: "in_progress" });
}

async function getGameSession(gameId) {
  const gameRef = ref(database, `games/${gameId}`);

  try {
    const snapshot = await get(gameRef);
    if (snapshot.exists()) {
      const gameData = snapshot.val();
      const players = [];

      // Iterate over players object and construct player data with questions solved
      if (gameData && gameData.players) {
        Object.entries(gameData.players).forEach(([playerId, playerData]) => {
          players.push({
            playerId,
            questionsSolved: playerData.questionsSolved, // Default to 0 if questionsSolved not present
          });
        });
      }

      return players;
    } else {
      return null; // No game session found with the given gameId
    }
  } catch (error) {
    console.error("Error fetching game session:", error);
    return null; // Handle error gracefully
  }
}

export {
  getGameSession,
  createGameSession,
  joinGameSession,
  updatePlayerPosition,
  getAvailableGames,
  endGameSession,
  startGameSession,
  setQuestions,
};

export const Firebase = initializeApp(firebaseConfig);
export const database = getDatabase(Firebase);
export const auth = getAuth(Firebase);
export const db = getFirestore(Firebase);

let analyticsInstance = null;
export async function getAnalyticsClient() {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  if (!(await isSupported())) return null;
  analyticsInstance = getAnalytics(Firebase);
  return analyticsInstance;
}

export async function trackEvent(name, params) {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  logEvent(analytics, name, params);
}

export async function setAnalyticsUser(uid) {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  setUserId(analytics, uid);
}

export async function setAnalyticsUserProperties(props) {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  setUserProperties(analytics, props);
}

export default Firebase;
