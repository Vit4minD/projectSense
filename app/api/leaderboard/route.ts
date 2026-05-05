import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/firebase/admin";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME_PATTERN = /^([0-5]\d):([0-5]\d)\.(\d{2})$/;

function timeToMs(time: string): number | null {
  const m = time.match(TIME_PATTERN);
  if (!m) return null;
  const minutes = parseInt(m[1], 10);
  const seconds = parseInt(m[2], 10);
  const centis = parseInt(m[3], 10);
  return minutes * 60_000 + seconds * 1_000 + centis * 10;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(match[1]);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { trickId, time } = (body ?? {}) as { trickId?: unknown; time?: unknown };
  const trickIdNum = typeof trickId === "number" ? trickId : Number(trickId);
  if (!Number.isInteger(trickIdNum) || trickIdNum < 1 || trickIdNum > 52) {
    return NextResponse.json({ error: "Invalid trickId" }, { status: 400 });
  }
  if (typeof time !== "string" || timeToMs(time) === null) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  const newMs = timeToMs(time)!;
  const entryRef = adminDb()
    .collection("leaderboards")
    .doc(String(trickIdNum))
    .collection("entries")
    .doc(decoded.uid);

  const snap = await entryRef.get();
  if (snap.exists) {
    const existing = snap.data() as { time?: string } | undefined;
    const existingMs = existing?.time ? timeToMs(existing.time) : null;
    if (existingMs !== null && existingMs <= newMs) {
      return NextResponse.json({ updated: false, time: existing!.time });
    }
  }

  await entryRef.set({
    uid: decoded.uid,
    email: decoded.email ?? null,
    time,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ updated: true, time });
}
