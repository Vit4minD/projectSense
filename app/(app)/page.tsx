"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Play, Search, Zap } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { TrickCard } from "@/components/sense/TrickCard";
import { TRICKS } from "@/lib/data/tricks";
import { CATEGORIES } from "@/lib/data/categories";
import { useAuth } from "@/hooks/useAuth";
import { useTweaks } from "@/hooks/useTweaks";
import { getAllBests, getRecentDrills, type SavedDrill } from "@/lib/firebase/drills";
import type { Best } from "@/lib/types";
import { formatTime } from "@/lib/drill/utils";

// Rotating hero titles — mental math, Number Sense, winning, speed. The last
// word (`em`) gets the italic accent. Picked at random on each visit.
const HERO_TITLES: { lead: string; em: string }[] = [
  { lead: "Use your", em: "head." },
  { lead: "Mental math,", em: "mastered." },
  { lead: "Faster than a", em: "calculator." },
  { lead: "Number Sense,", em: "sharpened." },
  { lead: "Think fast. Win", em: "faster." },
  { lead: "Outpace the", em: "clock." },
  { lead: "No pencil. No", em: "problem." },
  { lead: "Train your brain to", em: "win." },
  { lead: "Speed is a", em: "skill." },
  { lead: "Answer at the speed of", em: "thought." },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tweaks, setTweaks } = useTweaks();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [bests, setBests] = useState<Map<string, Best>>(new Map());
  const [recent, setRecent] = useState<SavedDrill[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  // Start at index 0 for a stable SSR render, then randomize on the client to
  // avoid a hydration mismatch.
  const [titleIdx, setTitleIdx] = useState(0);
  useEffect(() => {
    setTitleIdx(Math.floor(Math.random() * HERO_TITLES.length));
  }, []);
  const heroTitle = HERO_TITLES[titleIdx];

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getAllBests(user.uid), getRecentDrills(user.uid, 5)])
      .then(([b, r]) => {
        if (cancelled) return;
        setBests(b);
        setRecent(r);
      })
      .catch(() => {
        // Silent — empty state is fine for new users.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(
    () =>
      TRICKS.filter(
        (t) =>
          (cat === "All" || t.cat === cat) &&
          (q === "" || t.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, q],
  );

  const totalDrills = useMemo(
    () => Array.from(bests.values()).reduce((sum, b) => sum + b.attempts, 0),
    [bests],
  );
  const totalCorrect = useMemo(
    () => Array.from(bests.values()).reduce((sum, b) => sum + b.correct, 0),
    [bests],
  );
  const accuracyPct = totalDrills > 0 ? Math.round((totalCorrect / (totalDrills * 5)) * 100) : null;

  const featuredTrick = useMemo(() => {
    // Pick the trick with the lowest accuracy (your "weakness"), or fall back to TRICKS[1].
    if (bests.size === 0) return TRICKS[1];
    let worst: { trick: typeof TRICKS[number]; rate: number } | null = null;
    for (const t of TRICKS) {
      const b = bests.get(t.id);
      if (!b || b.attempts < 2) continue;
      const rate = b.correct / (b.attempts * 5);
      if (worst === null || rate < worst.rate) worst = { trick: t, rate };
    }
    return worst?.trick ?? TRICKS[1];
  }, [bests]);

  const gridClass =
    tweaks.density === "dense"
      ? "trick-grid dense"
      : tweaks.density === "list"
        ? "trick-grid list"
        : "trick-grid";

  // Catalog = all filtered tricks except the featured one shown above.
  const catalog = useMemo(
    () => filtered.filter((t) => t.id !== featuredTrick.id),
    [filtered, featuredTrick.id],
  );
  const hasMore = visibleCount < catalog.length;

  // Infinite scroll: reveal 12 more whenever the sentinel nears the viewport.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + 12, catalog.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, catalog.length]);

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Practice", "All tricks"]}
        right={
          <>
            <button className="btn ghost" type="button">
              <Zap size={14} /> Shuffle <span className="kbd">R</span>
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => router.push(`/drill/${TRICKS[0].id}`)}
            >
              Start drill <span className="kbd">↵</span>
            </button>
          </>
        }
      />

      <section className="hero home-hero">
        <div>
          <h1 className="hero-title">
            {heroTitle.lead} <em>{heroTitle.em}</em>
          </h1>
          <div className="hero-cta">
            <button
              className="btn accent"
              type="button"
              onClick={() => router.push(`/drill/${recent[0]?.trickId ?? TRICKS[0].id}`)}
            >
              <Play size={12} /> {recent.length > 0 ? "Resume last drill" : "Start your first drill"}
            </button>
            <button className="btn" type="button" onClick={() => router.push("/test")}>
              Take a full test
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <Zap size={160} style={{ color: "var(--ink)" }} />
        </div>
      </section>

      <div className="hero-stats-row">
        <div className="stat">
          <div className="label">Drills today</div>
          <div className="value">{totalDrills}</div>
          <div className="delta">{recent.length} recent</div>
        </div>
        <div className="stat">
          <div className="label">Tricks practiced</div>
          <div className="value">{bests.size}/{TRICKS.length}</div>
          <div className="delta">{TRICKS.length - bests.size} to go</div>
        </div>
        <div className="stat">
          <div className="label">Accuracy</div>
          <div className="value">{accuracyPct === null ? "—" : `${accuracyPct}%`}</div>
          <div className="delta">last {totalDrills} drills</div>
        </div>
        <div className="stat">
          <div className="label">Best streak</div>
          <div className="value">{bestStreak(recent)}</div>
          <div className="delta">{recent.filter((d) => d.score === "5/5").length} perfect</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search">
          <Search size={14} />
          <input
            placeholder="Search tricks…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setVisibleCount(12);
            }}
          />
          <span className="kbd">/</span>
        </div>
        {CATEGORIES.slice(0, 8).map((c) => (
          <button
            key={c.key}
            className={`chip ${cat === c.key ? "active" : ""}`}
            type="button"
            onClick={() => {
              setCat(c.key);
              setVisibleCount(12);
            }}
          >
            {c.label}
            {c.key !== "All" && (
              <span style={{ opacity: 0.6, fontFamily: "var(--mono)", fontSize: 10 }}>
                {TRICKS.filter((t) => t.cat === c.key).length}
              </span>
            )}
          </button>
        ))}
        <div className="spacer" />
        <div className="view-toggle">
          <button
            className={tweaks.density === "comfortable" ? "active" : ""}
            type="button"
            onClick={() => {
              setTweaks({ density: "comfortable" });
              setVisibleCount(12);
            }}
            aria-label="Comfortable"
          >
            <LayoutGrid size={12} />
          </button>
          <button
            className={tweaks.density === "dense" ? "active" : ""}
            type="button"
            onClick={() => {
              setTweaks({ density: "dense" });
              setVisibleCount(12);
            }}
          >
            Dense
          </button>
          <button
            className={tweaks.density === "list" ? "active" : ""}
            type="button"
            onClick={() => {
              setTweaks({ density: "list" });
              setVisibleCount(12);
            }}
            aria-label="List"
          >
            <List size={12} />
          </button>
        </div>
      </div>

      <div className="section-head">
        <h2>
          Pinned for you <span className="count">· 1</span>
        </h2>
      </div>

      <div className={`${gridClass} pinned-grid`}>
        {tweaks.density !== "list" && (
          <TrickCard
            trick={featuredTrick}
            variant="featured"
            tagOverride={bests.size === 0 ? "start here" : "weakness"}
            bestMs={bests.get(featuredTrick.id)?.bestMs}
            onClick={() => router.push(`/drill/${featuredTrick.id}`)}
          />
        )}
      </div>

      <div className="section-head catalog-head" style={{ marginTop: 40 }}>
        <h2>
          All tricks <span className="count">· {filtered.length}</span>
        </h2>
      </div>
      <div className={gridClass}>
        {catalog.slice(0, visibleCount).map((t) => (
          <TrickCard
            key={t.id}
            trick={t}
            variant={tweaks.density === "list" ? "list-row" : "default"}
            bestMs={bests.get(t.id)?.bestMs}
            onClick={() => router.push(`/drill/${t.id}`)}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="catalog-sentinel" aria-hidden style={{ height: 1 }} />
      )}

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>Recent activity</h2>
      </div>
      <div className="activity-list">
        {recent.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No drills yet — pick a trick above to get started.
          </div>
        ) : (
          recent.map((a) => {
            const trick = TRICKS.find((t) => t.id === a.trickId);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => router.push(`/trick/${a.trickId}`)}
                className="activity-row"
              >
                <span className="caps" style={{ color: "var(--muted)" }}>
                  trick / {a.trickId}
                </span>
                <span style={{ fontWeight: 500 }}>{trick?.name ?? "Drill"}</span>
                <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                  {a.score}
                </span>
                <span className="mono" style={{ textAlign: "right" }}>
                  {formatTime(a.totalMs)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function bestStreak(drills: SavedDrill[]): number {
  let best = 0;
  let cur = 0;
  for (const d of drills) {
    if (d.score === "5/5") {
      cur += 5;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}
