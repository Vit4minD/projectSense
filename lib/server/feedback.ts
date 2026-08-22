import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { feedbackLimiter } from "./rateLimit";

export const FeedbackBody = z.object({
  category: z.enum(["bug", "idea", "other"]),
  message: z.string().min(1).max(2000),
  path: z.string().max(200).optional(),
  appVersion: z.string().max(20).optional(),
  userAgent: z.string().max(400).optional(),
});
export type FeedbackInput = z.infer<typeof FeedbackBody>;

export type FeedbackErrCode =
  | "no-token"
  | "bad-token"
  | "bad-request"
  | "rate-limited"
  | "internal";

export type FeedbackResult =
  | { ok: true; id: string }
  | { ok: false; code: FeedbackErrCode; message: string; issues?: unknown };

export type FeedbackDeps = {
  adminAuth: Pick<Auth, "verifyIdToken">;
  adminDb: Firestore;
  serverTimestamp: () => unknown;
};

function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function err(code: FeedbackErrCode, message: string, issues?: unknown): FeedbackResult {
  return { ok: false, code, message, ...(issues !== undefined ? { issues } : {}) };
}

// Single-line fields: strip all control chars. Message: keep tab/newline, strip the rest.
const oneLine = (s: string | undefined, max: number) =>
  (s ?? "").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, max);
const multiLine = (s: string | undefined, max: number) =>
  (s ?? "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, max);

export function statusCodeFor(code: FeedbackErrCode): number {
  switch (code) {
    case "no-token":
    case "bad-token":
      return 401;
    case "bad-request":
      return 400;
    case "rate-limited":
      return 429;
    case "internal":
      return 500;
  }
}

export async function submitFeedback(
  deps: FeedbackDeps,
  authHeader: string | null,
  body: unknown,
): Promise<FeedbackResult> {
  const token = parseBearer(authHeader);
  if (!token) return err("no-token", "Missing Authorization header");

  let uid: string;
  let email = "";
  let name = "";
  try {
    const decoded = await deps.adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    const rec = decoded as unknown as Record<string, unknown>;
    email = typeof rec.email === "string" ? rec.email : "";
    name = typeof rec.name === "string" ? rec.name : "";
  } catch {
    return err("bad-token", "ID token failed verification");
  }

  const rl = await feedbackLimiter.limit(uid);
  if (!rl.allowed) return err("rate-limited", "Too many submissions. Please wait a moment.");

  const parsed = FeedbackBody.safeParse(body);
  if (!parsed.success) return err("bad-request", "Body did not match schema", parsed.error.issues);
  const input = parsed.data;

  try {
    const ref = deps.adminDb.collection("feedback").doc();
    await ref.set({
      uid,
      email: oneLine(email, 200),
      displayName: oneLine(name, 80),
      category: input.category,
      message: multiLine(input.message, 2000),
      path: oneLine(input.path, 200),
      appVersion: oneLine(input.appVersion, 20),
      userAgent: oneLine(input.userAgent, 400),
      createdAt: deps.serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    console.error("[feedback] write failed", e);
    return err("internal", "Could not save feedback");
  }
}
