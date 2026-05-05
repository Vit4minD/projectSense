// One-time migration script. Run from repo root:
//   node scripts/migrate-firebase-data.mjs --dry-run
//   node scripts/migrate-firebase-data.mjs --apply
//   node scripts/migrate-firebase-data.mjs --apply --delete-old   # also remove legacy docs
//
// Requires FIREBASE_SERVICE_ACCOUNT_KEY in the environment (single-line JSON).

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRY_RUN = !APPLY;
const DELETE_OLD = args.has("--delete-old");

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY env var is required.");
  process.exit(1);
}
const credentials = JSON.parse(raw);
if (!getApps().length) initializeApp({ credential: cert(credentials) });

const adminAuth = getAuth();
const db = getFirestore();

const KNOWN_PROFILE_FIELDS = new Set(["questionLimited", "rightLeft", "autoEnter", "email"]);

function tag(action) {
  return DRY_RUN ? `[dry-run] ${action}` : `[apply] ${action}`;
}

async function migrateUsers() {
  const users = await db.collection("users").get();
  let migrated = 0;
  let skippedNonEmail = 0;
  let skippedNoAuth = 0;
  let bestsCopied = 0;
  let errors = 0;

  for (const docSnap of users.docs) {
    const docId = docSnap.id;
    if (!docId.includes("@")) {
      skippedNonEmail++;
      continue;
    }
    const data = docSnap.data() ?? {};
    let uid;
    try {
      const authUser = await adminAuth.getUserByEmail(docId);
      uid = authUser.uid;
    } catch (err) {
      console.warn(tag(`skip user ${docId} — no Auth account: ${err.code ?? err.message}`));
      skippedNoAuth++;
      continue;
    }

    const profile = {
      email: data.email ?? docId,
      questionLimited: data.questionLimited ?? true,
      rightLeft: data.rightLeft ?? false,
      autoEnter: data.autoEnter ?? true,
    };

    const bests = Object.entries(data).filter(([k]) => !KNOWN_PROFILE_FIELDS.has(k));

    console.log(
      tag(
        `users/${docId} -> users/${uid}  (${bests.length} bests; profile fields: ${
          Object.keys(profile).length
        })`
      )
    );

    if (APPLY) {
      try {
        await db.collection("users").doc(uid).set(profile, { merge: true });
        for (const [trickId, time] of bests) {
          if (typeof time !== "string") continue;
          await db
            .collection("users")
            .doc(uid)
            .collection("bests")
            .doc(String(trickId))
            .set({ time }, { merge: true });
          bestsCopied++;
        }
        if (DELETE_OLD) {
          await db.collection("users").doc(docId).delete();
        }
        migrated++;
      } catch (err) {
        console.error(tag(`error migrating ${docId}: ${err.message}`));
        errors++;
      }
    } else {
      migrated++;
      bestsCopied += bests.length;
    }
  }

  console.log("");
  console.log(`Users summary: migrated=${migrated} bestsCopied=${bestsCopied} skippedNonEmail=${skippedNonEmail} skippedNoAuth=${skippedNoAuth} errors=${errors}`);
}

async function migrateLeaderboard() {
  const board = await db.collection("leaderboard").get();
  let entriesWritten = 0;
  let docsTouched = 0;
  let skippedNoAuth = 0;
  let errors = 0;

  for (const docSnap of board.docs) {
    const trickId = docSnap.id;
    docsTouched++;
    const data = docSnap.data() ?? {};
    const scores = data.scores;
    if (!scores || typeof scores !== "object") {
      console.log(tag(`leaderboard/${trickId} has no .scores map; skipping`));
      continue;
    }

    for (const [email, time] of Object.entries(scores)) {
      if (typeof time !== "string") continue;
      let uid;
      try {
        uid = (await adminAuth.getUserByEmail(email)).uid;
      } catch {
        skippedNoAuth++;
        continue;
      }

      console.log(tag(`leaderboards/${trickId}/entries/${uid}  (email=${email}, time=${time})`));

      if (APPLY) {
        try {
          await db
            .collection("leaderboards")
            .doc(trickId)
            .collection("entries")
            .doc(uid)
            .set(
              {
                uid,
                email,
                time,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          entriesWritten++;
        } catch (err) {
          console.error(tag(`error writing leaderboards/${trickId}/entries/${uid}: ${err.message}`));
          errors++;
        }
      } else {
        entriesWritten++;
      }
    }

    if (APPLY && DELETE_OLD) {
      try {
        await db.collection("leaderboard").doc(trickId).delete();
      } catch (err) {
        console.error(tag(`error deleting leaderboard/${trickId}: ${err.message}`));
        errors++;
      }
    }
  }

  console.log("");
  console.log(`Leaderboard summary: docsTouched=${docsTouched} entriesWritten=${entriesWritten} skippedNoAuth=${skippedNoAuth} errors=${errors}`);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"}${DELETE_OLD ? " + DELETE_OLD" : ""}`);
  console.log("");
  await migrateUsers();
  console.log("");
  await migrateLeaderboard();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
