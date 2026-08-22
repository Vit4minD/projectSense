import { getFirebaseAuth } from "./client";
import { trackEvent } from "./analytics";
import type { FeedbackCategory } from "@/lib/types";

export type SubmitResult = { ok: boolean; error?: string };

export async function submitFeedback(
  category: FeedbackCategory,
  message: string,
): Promise<SubmitResult> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return { ok: false, error: "You must be signed in to send feedback." };
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        category,
        message,
        path: typeof window !== "undefined" ? window.location.pathname : "",
        appVersion: "v2.0",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    });
    if (res.ok) {
      void trackEvent("feedback_submitted", { category, length: message.length });
      return { ok: true };
    }
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: data?.message || "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
