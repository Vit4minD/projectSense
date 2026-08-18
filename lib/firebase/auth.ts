import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "./client";
import { trackEvent } from "./analytics";

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  school: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await ensureUserDoc(cred.user.uid, { displayName, school });
  void trackEvent("sign_up", { method: "password" });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await touchLastActive(cred.user.uid);
  void trackEvent("login", { method: "password" });
  return cred.user;
}

/**
 * A non-identifying public handle from the email local-part (before "@").
 * Avoids broadcasting a Google account's real full name on the public
 * leaderboard / in multiplayer rooms — this is a kids' app.
 */
function deriveHandle(email: string | null | undefined): string {
  if (typeof email !== "string") return "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : "";
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithPopup(auth, googleProvider);
  const isNewUser = await ensureUserDoc(cred.user.uid, {
    displayName: deriveHandle(cred.user.email) || "Sense Player",
    school: "",
  });
  void trackEvent(isNewUser ? "sign_up" : "login", { method: "google" });
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

function avatarInitialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "S";
}

async function ensureUserDoc(uid: string, data: { displayName: string; school: string }): Promise<boolean> {
  const db = getDb();
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await touchLastActive(uid);
    return false;
  }
  await setDoc(ref, {
    displayName: data.displayName,
    school: data.school,
    avatarInitials: avatarInitialsFor(data.displayName),
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });
  return true;
}

async function touchLastActive(uid: string) {
  const db = getDb();
  await setDoc(doc(db, "users", uid), { lastActiveAt: serverTimestamp() }, { merge: true });
}
