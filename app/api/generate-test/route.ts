import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminAuth } from "@/lib/firebase/admin";
import { generatePaper, statusCodeFor } from "@/lib/server/aiTest";
import { resolveGeminiKey } from "@/lib/server/geminiKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini generates a 40-question structured paper (with one retry on shape
// mismatch), which routinely exceeds Vercel's default 10s function limit and
// 504s. Raise to the 60s ceiling so generation can complete.
export const maxDuration = 60;

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
