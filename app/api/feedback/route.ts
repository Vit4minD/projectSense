import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { submitFeedback, statusCodeFor } from "@/lib/server/feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await submitFeedback(
      {
        adminAuth: getAdminAuth(),
        adminDb: getAdminDb(),
        serverTimestamp: () => FieldValue.serverTimestamp(),
      },
      req.headers.get("authorization"),
      body,
    );
    if (result.ok) return Response.json(result);
    return Response.json(result, { status: statusCodeFor(result.code) });
  } catch (e) {
    console.error("[feedback] POST failed", e);
    return Response.json(
      { ok: false, code: "internal", message: "Server error" },
      { status: 500 },
    );
  }
}
