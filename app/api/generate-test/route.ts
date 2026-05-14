import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminAuth } from "@/lib/firebase/admin";
import { generatePaper, statusCodeFor } from "@/lib/server/aiTest";
import { resolveGeminiKey } from "@/lib/server/geminiKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const key = resolveGeminiKey();
    const result = await generatePaper(
      {
        adminAuth: getAdminAuth(),
        geminiKey: key ?? "",
        geminiClient: key ? new GoogleGenerativeAI(key) : null,
      },
      req.headers.get("authorization"),
    );
    if (result.ok) return Response.json(result);
    return Response.json(result, { status: statusCodeFor(result.code) });
  } catch (e) {
    console.error("[generate-test] POST failed", e);
    return Response.json(
      { ok: false, code: "internal", message: "Server error" },
      { status: 500 },
    );
  }
}
