import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set(["questions_answered", "questions_generated"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { kind, n } = (body ?? {}) as { kind?: unknown; n?: unknown };
  if (typeof kind !== "string" || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const amount = typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : 1;
  if (amount < 1 || amount > 1000) {
    return NextResponse.json({ error: "Invalid n" }, { status: 400 });
  }

  await adminDb()
    .collection("statistics")
    .doc(kind)
    .set({ total: FieldValue.increment(amount) }, { merge: true });

  return NextResponse.json({ ok: true });
}
