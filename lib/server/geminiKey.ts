import "server-only";

/**
 * Resolve the Gemini API key for server-side use.
 *
 * The key MUST be a server-only env var. We accept `NEXT_PUBLIC_GEMINI_API_KEY`
 * only as a development fallback so local work isn't blocked while you set
 * up the proper var. In production we refuse to fall back — the public-
 * prefixed var has been (or will be) inlined into the client bundle by
 * Next.js / Vercel at build time, so anyone could read it from DevTools.
 *
 * Returns `null` when no usable key is configured. Callers should respond
 * with an error (we expose `missing-key` to the route).
 */
export function resolveGeminiKey(): string | null {
  const server = process.env.GEMINI_API_KEY;
  if (server) return server;

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  const fallback = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (fallback && !isProd) {
    if (!warned) {
      warned = true;
      console.warn(
        "[gemini] Using NEXT_PUBLIC_GEMINI_API_KEY as a dev fallback. " +
          "This var is INLINED into the client bundle at build time and " +
          "would be exposed in production. Set a server-only GEMINI_API_KEY " +
          "before deploying.",
      );
    }
    return fallback;
  }

  if (fallback && isProd) {
    console.error(
      "[gemini] NEXT_PUBLIC_GEMINI_API_KEY is set in production and was IGNORED. " +
        "Set a server-only GEMINI_API_KEY in Vercel and rotate the public key.",
    );
  }

  return null;
}

let warned = false;
