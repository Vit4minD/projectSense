import "server-only";
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let appPromise: App | null = null;

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Paste the JSON contents of your service account key into this env var."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the full JSON content of the service account file."
    );
  }
}

function getAdminApp(): App {
  if (appPromise) return appPromise;
  const existing = getApps()[0];
  if (existing) {
    appPromise = existing;
    return existing;
  }
  appPromise = initializeApp({ credential: cert(readServiceAccount()) });
  return appPromise;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
