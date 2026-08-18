import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let rtdbInstance: Database | undefined;

const REQUIRED_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: firebaseConfig.databaseURL,
};

function getOrInitApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK can only be used in the browser. Wrap calls in 'use client' boundaries.");
  }
  if (app) return app;
  if (!getApps().length) {
    // Fail fast with a clear message rather than initializing with undefined
    // fields (which surfaces later as opaque SDK errors deep in auth/database).
    const missing = Object.entries(REQUIRED_ENV)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      throw new Error(
        `Missing required Firebase env var(s): ${missing.join(", ")}. Set them in .env.local (local) or the Vercel dashboard (deployed).`,
      );
    }
  }
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getOrInitApp());
  if (useEmulator) {
    connectAuthEmulator(authInstance, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return authInstance;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getOrInitApp());
  if (useEmulator) {
    connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
  }
  return dbInstance;
}

export function getRtdb(): Database {
  if (rtdbInstance) return rtdbInstance;
  rtdbInstance = getDatabase(getOrInitApp());
  if (useEmulator) {
    connectDatabaseEmulator(rtdbInstance, "127.0.0.1", 9000);
  }
  return rtdbInstance;
}
