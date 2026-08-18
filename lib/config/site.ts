/**
 * Canonical site identity, shared by root metadata, the sitemap, and robots.
 * The origin is overridable via NEXT_PUBLIC_SITE_URL (set it to the real
 * production domain in Vercel); it defaults to the Vercel preview domain.
 * `||` (not `??`) so a blank env var falls back instead of producing "".
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://project-sense.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Project Sense";

export const SITE_DESCRIPTION =
  "A practice gym for UIL Number Sense — drill the canon, race your friends, sit AI-generated papers.";
