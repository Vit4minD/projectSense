import { getAdminAuth } from "@/lib/firebase/admin";
import { gradePaper, statusCodeFor } from "@/lib/server/aiTest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await gradePaper(
      { adminAuth: getAdminAuth() },
      req.headers.get("authorization"),
      body,
    );
    if (result.ok) return Response.json(result);
    return Response.json(result, { status: statusCodeFor(result.code) });
  } catch (e) {
    console.error("[grade-test] POST failed", e);
    return Response.json(
      { ok: false, code: "internal", message: "Server error" },
      { status: 500 },
    );
  }
}
