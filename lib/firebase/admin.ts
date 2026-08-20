import "server-only";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | undefined;

export function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApps()[0]!;
    return _app;
  }
  const useEmulator =
    !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (useEmulator) {
    // Emulator auto-detection: Admin SDK reads FIRESTORE_EMULATOR_HOST and
    // FIREBASE_AUTH_EMULATOR_HOST automatically. No real credentials needed.
    _app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
    });
  } else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is required. In Vercel, paste the JSON as a server-only env var.",
      );
    }
    _app = initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return _app;
}

// Mirror the client's database selection so server routes read/write the same
// named Firestore database. The id is not a secret, so reusing the public var
// keeps client and server in lockstep.
const adminFirestoreDatabaseId =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID?.trim() || undefined;

export const getAdminAuth = (): Auth => getAuth(getAdminApp());
export const getAdminDb = (): Firestore =>
  adminFirestoreDatabaseId
    ? getFirestore(getAdminApp(), adminFirestoreDatabaseId)
    : getFirestore(getAdminApp());
