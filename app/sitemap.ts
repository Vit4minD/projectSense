import type { MetadataRoute } from "next";
import { TRICKS } from "@/lib/data/tricks";
import { SITE_URL } from "@/lib/config/site";

/**
 * Only list genuinely-crawlable URLs. The `(app)` routes (home, leaderboard,
 * games, etc.) are behind a client auth gate and redirect logged-out visitors
 * (and crawlers) to /login, so advertising them would surface empty/redirecting
 * pages. What's publicly indexable: the /login landing and the 52 server-rendered
 * /trick/{id} pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const trickEntries: MetadataRoute.Sitemap = TRICKS.map((t) => ({
    url: `${SITE_URL}/trick/${t.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/stats`, lastModified, changeFrequency: "daily", priority: 0.5 },
    ...trickEntries,
  ];
}
