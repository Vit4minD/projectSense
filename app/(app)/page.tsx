"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tweaks, setTweaks } = useTweaks();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [bests, setBests] = useState<Map<string, Best>>(new Map());
  const [recent, setRecent] = useState<SavedDrill[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);

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
            Eighty problems.
            <br />
            Ten minutes.
            <br />
            <em>No scratch.</em>
          </h1>
          <p className="hero-sub">
            Grind the canonical UIL tricks, race your friends, and sit full-length AI-generated papers. Built for the pen-only mathlete.
          </p>
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

        <div className="hero-visual home-hero-visual">
          <span className="big-num">10</span>
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
        {filtered
          .filter((t) => t.id !== featuredTrick.id)
          .slice(0, visibleCount)
          .map((t) => (
          <TrickCard
            key={t.id}
            trick={t}
            variant={tweaks.density === "list" ? "list-row" : "default"}
            bestMs={bests.get(t.id)?.bestMs}
            onClick={() => router.push(`/drill/${t.id}`)}
          />
        ))}
      </div>
      {visibleCount < filtered.filter((t) => t.id !== featuredTrick.id).length && (
        <div className="catalog-more">
          <button
            className="btn"
            type="button"
            onClick={() => setVisibleCount((count) => count + 12)}
          >
            Show 12 more
          </button>
        </div>
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
