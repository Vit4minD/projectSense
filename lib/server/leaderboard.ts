import { z } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { TRICKS } from "@/lib/data/tricks";

export const PublishBody = z.object({
  trickId: z.string().regex(/^\d{1,2}$/),
  drillId: z.string().min(1),
  bestMs: z.number().int().positive().lt(600_000),
});

export type PublishInput = z.infer<typeof PublishBody>;

export type PublishOk =
  | { ok: true; status: "updated"; bestMs: number }
  | { ok: true; status: "no-improvement" };

export type PublishErrCode =
  | "no-token"
  | "bad-token"
  | "bad-request"
  | "unknown-trick"
  | "stale-or-fabricated"
  | "internal";

export type PublishErr = {
  ok: false;
  code: PublishErrCode;
  message: string;
  issues?: unknown;
};

export type PublishResult = PublishOk | PublishErr;

export type PublishDeps = {
  adminAuth: Pick<Auth, "verifyIdToken">;
  adminDb: Firestore;
  /** Sentinel returned by FieldValue.serverTimestamp() in prod; anything in tests. */
  serverTimestamp: () => unknown;
};

const QUESTIONS_PER_DRILL = 5;
const TIMING_TOLERANCE_MS = 50;

const TRICK_IDS = new Set(TRICKS.map((t) => t.id));

/**
 * Verify the caller's ID token, validate the body against the user's recorded
 * drill, then upsert the leaderboard entry only if the time is faster than the
 * existing one. Pure-ish: takes Admin SDK handles as deps so tests can stub them.
 */
export async function publishLeaderboardEntry(
  deps: PublishDeps,
  authHeader: string | null,
  body: unknown,
): Promise<PublishResult> {
  const token = parseBearer(authHeader);
  if (!token) return err("no-token", "Missing Authorization header");

  let uid: string;
  try {
    const decoded = await deps.adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return err("bad-token", "ID token failed verification");
  }

  const parsed = PublishBody.safeParse(body);
  if (!parsed.success) {
    return err("bad-request", "Body did not match schema", parsed.error.issues);
  }
  const input = parsed.data;

  if (!TRICK_IDS.has(input.trickId)) {
    return err("unknown-trick", `trickId ${input.trickId} is not registered`);
  }

  // Anti-fabrication: load the original drill via the Admin SDK and assert it
  // matches the claim. This blocks a tampered client that fakes a fast time
  // without an actual matching drill record.
  const drillSnap = await deps.adminDb
    .collection("users")
    .doc(uid)
    .collection("drills")
    .doc(input.drillId)
    .get();

  if (!drillSnap.exists) {
    return err("stale-or-fabricated", "Drill not found for this user");
  }
  const drill = drillSnap.data() as
    | { trickId?: string; totalMs?: number; score?: string }
    | undefined;
  if (
    !drill ||
    drill.trickId !== input.trickId ||
    drill.score !== `${QUESTIONS_PER_DRILL}/${QUESTIONS_PER_DRILL}` ||
    typeof drill.totalMs !== "number" ||
    Math.abs(drill.totalMs - input.bestMs) > TIMING_TOLERANCE_MS
  ) {
    return err("stale-or-fabricated", "Drill record does not back this claim");
  }

  // Read the user profile for displayName/school once. Outside the transaction;
  // these fields are slow-changing and a stale read here is harmless.
  const profileSnap = await deps.adminDb.collection("users").doc(uid).get();
  const profile = profileSnap.data() as
    | { displayName?: string; school?: string }
    | undefined;
  const displayName = profile?.displayName ?? "Anonymous";
  const school = profile?.school ?? "";

  const entryRef = deps.adminDb
    .collection("leaderboards")
    .doc(input.trickId)
    .collection("entries")
    .doc(uid);

  const txResult = await deps.adminDb.runTransaction(async (tx) => {
    const existing = await tx.get(entryRef);
    if (existing.exists) {
      const prev = existing.data() as { bestMs?: number } | undefined;
      if (typeof prev?.bestMs === "number" && prev.bestMs <= input.bestMs) {
        return { status: "no-improvement" as const };
      }
    }
    tx.set(
      entryRef,
      {
        uid,
        bestMs: input.bestMs,
        displayName,
        school,
        updatedAt: deps.serverTimestamp(),
      },
      { merge: true },
    );
    return { status: "updated" as const };
  });

  if (txResult.status === "updated") {
    return { ok: true, status: "updated", bestMs: input.bestMs };
  }
  return { ok: true, status: "no-improvement" };
}

export function statusCodeFor(code: PublishErrCode): number {
  switch (code) {
    case "no-token":
    case "bad-token":
      return 401;
    case "bad-request":
    case "unknown-trick":
      return 400;
    case "stale-or-fabricated":
      return 409;
    case "internal":
      return 500;
  }
}

function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function err(code: PublishErrCode, message: string, issues?: unknown): PublishErr {
  return { ok: false, code, message, ...(issues !== undefined ? { issues } : {}) };
}
