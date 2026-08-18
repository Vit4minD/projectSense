import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight } from "lucide-react";
import { getGlobalStats, type GlobalStats } from "@/lib/firebase/stats";
import { SITE_URL, SITE_NAME } from "@/lib/config/site";

// Render at request time (never at build): the admin SDK needs credentials that
// aren't present during `next build`. `unstable_cache` still bounds how often
// the count aggregations actually run.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats",
  description: `Live usage stats for ${SITE_NAME} — players, drills completed, and questions answered.`,
  alternates: { canonical: `${SITE_URL}/stats` },
};

const cachedStats = unstable_cache(getGlobalStats, ["global-stats"], { revalidate: 900 });

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

type Tile = { label: string; value: string; delta: string };

export default async function StatsPage() {
  let stats: GlobalStats | null = null;
  try {
    stats = await cachedStats();
  } catch {
    // Admin credentials not configured / backend unavailable — fail soft so the
    // public page never crashes.
    stats = null;
  }

  const tiles: Tile[] | null = stats && [
    { label: "Players", value: fmt(stats.users), delta: "registered" },
    { label: "Drills", value: fmt(stats.drills), delta: "completed" },
    { label: "Questions", value: fmt(stats.questionsAnswered), delta: "answered" },
    { label: "Leaderboard", value: fmt(stats.leaderboardEntries), delta: "entries" },
    { label: "Catalog", value: fmt(stats.tricksInCatalog), delta: "tricks" },
  ];

  return (
    <div className="main" style={{ maxWidth: 920, margin: "0 auto", padding: "0 20px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 0",
        }}
      >
        <Link href="/" className="brand-name" style={{ textDecoration: "none" }}>
          <span className="brand-project">Project</span> Sense
        </Link>
        <nav style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" className="btn primary">
            Start practicing <ArrowRight size={12} />
          </Link>
        </nav>
      </header>

      <section className="hero" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
            live · updated every 15 min
          </div>
          <h1 className="hero-title">
            By the <em>numbers</em>
          </h1>
          <div className="hero-sub">
            Real, aggregated usage across {SITE_NAME} — a practice gym for UIL Number Sense.
          </div>
        </div>
      </section>

      {tiles ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 40,
          }}
        >
          {tiles.map((t) => (
            <div className="stat" key={t.label}>
              <div className="label">{t.label}</div>
              <div className="value">{t.value}</div>
              <div className="delta">{t.delta}</div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--muted)",
            background: "var(--bg-soft)",
            borderRadius: 16,
            marginBottom: 40,
          }}
        >
          Live stats are warming up — check back once the app is serving traffic.
        </div>
      )}
    </div>
  );
}
