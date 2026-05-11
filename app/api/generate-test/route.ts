import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminAuth } from "@/lib/firebase/admin";
import { generatePaper, statusCodeFor } from "@/lib/server/aiTest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const key = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
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
