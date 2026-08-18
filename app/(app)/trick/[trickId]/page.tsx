"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Clock, Lightbulb, Trophy } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { TrickCard } from "@/components/sense/TrickCard";
import { useAuth } from "@/hooks/useAuth";
import { TRICKS, getTrickById } from "@/lib/data/tricks";
import { CATEGORIES } from "@/lib/data/categories";
import { getTip } from "@/lib/data/tips";
import {
  getAllBests,
  getDrillsForTrick,
  type SavedDrill,
} from "@/lib/firebase/drills";
import { getLeaderboardForTrick } from "@/lib/firebase/leaderboard";
import { formatShort, formatTime } from "@/lib/drill/utils";
import type { Best, LeaderboardEntry } from "@/lib/types";

export default function TrickDetailPage() {
  const params = useParams<{ trickId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const trick = getTrickById(params.trickId);

  const [best, setBest] = useState<Best | null>(null);
  const [history, setHistory] = useState<SavedDrill[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [allBests, setAllBests] = useState<Map<string, Best>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !trick) return;
    let cancelled = false;
    Promise.all([
      getDrillsForTrick(user.uid, trick.id, 10),
      getLeaderboardForTrick(trick.id, 10).catch(() => [] as LeaderboardEntry[]),
      getAllBests(user.uid),
    ])
      .then(([h, l, all]) => {
        if (cancelled) return;
        // Derive this trick's best from the full bests map we already fetch,
        // instead of a redundant single-doc read.
        setBest(all.get(trick.id) ?? null);
        setHistory(h);
        setLeaders(l);
        setAllBests(all);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, trick]);

  const tip = trick ? getTip(trick.id) : undefined;
  const categoryLabel = useMemo(
    () => (trick ? CATEGORIES.find((c) => c.key === trick.cat)?.label ?? trick.cat : ""),
    [trick],
  );

  const accuracyPct = useMemo(() => {
    if (!best || best.attempts === 0) return null;
    return Math.round((best.correct / (best.attempts * 5)) * 100);
  }, [best]);

  const related = useMemo(() => {
    if (!trick) return [];
    const sameCat = TRICKS.filter((t) => t.cat === trick.cat && t.id !== trick.id);
    sameCat.sort((a, b) => {
      const ba = allBests.get(a.id);
      const bb = allBests.get(b.id);
      const ra = ba && ba.attempts >= 2 ? ba.correct / (ba.attempts * 5) : 1;
      const rb = bb && bb.attempts >= 2 ? bb.correct / (bb.attempts * 5) : 1;
      return ra - rb;
    });
    return sameCat.slice(0, 3);
  }, [trick, allBests]);

  if (!trick) {
    return (
      <div className="main">
        <TopBar crumbs={["sense", "Practice", "Unknown"]} />
        <h1>Unknown trick</h1>
        <button className="btn primary" onClick={() => router.push("/")}>
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Practice", trick.name]}
        right={
          <>
            <button className="btn" type="button" onClick={() => router.push("/")}>
              All tricks
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => router.push(`/drill/${trick.id}`)}
            >
              Drill this <span className="kbd">↵</span>
            </button>
          </>
        }
      />

      <section className="hero">
        <div>
          <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
            trick / {trick.id} · {categoryLabel}
          </div>
          <h1 className="hero-title">
            {trick.name.split(" ").slice(0, -1).join(" ")}{" "}
            <em>{trick.name.split(" ").slice(-1).join(" ")}</em>
          </h1>
          <div className="hero-sub" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
            {trick.example}
          </div>
          <div className="hero-cta">
            <button
              className="btn accent"
              type="button"
              onClick={() => router.push(`/drill/${trick.id}`)}
            >
              <ArrowRight size={12} /> Drill this trick
            </button>
            <span style={{ color: "var(--muted)", fontSize: 12, alignSelf: "center" }}>
              {"•".repeat(trick.difficulty)}
              <span style={{ color: "var(--muted-2)" }}>{"•".repeat(3 - trick.difficulty)}</span>{" "}
              difficulty
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <span className="big-num">/{trick.id}</span>
        </div>
      </section>

      <div className="hero-stats-row">
        <div className="stat">
          <div className="label">Your best</div>
          <div className="value">
            {best?.bestMs !== undefined ? formatTime(best.bestMs).replace(/^00:/, "") : "—"}
          </div>
          <div className="delta">{best?.attempts ?? 0} attempts</div>
        </div>
        <div className="stat">
          <div className="label">Accuracy</div>
          <div className="value">{accuracyPct === null ? "—" : `${accuracyPct}%`}</div>
          <div className="delta">{best?.correct ?? 0} correct</div>
        </div>
        <div className="stat">
          <div className="label">Last attempt</div>
          <div className="value" style={{ fontSize: 18 }}>
            {best?.lastAttemptAt ? formatRel(best.lastAttemptAt.toMillis()) : "never"}
          </div>
          <div className="delta">{history.length} runs in history</div>
        </div>
        <div className="stat">
          <div className="label">Global #1</div>
          <div className="value">
            {leaders[0]?.bestMs !== undefined
              ? formatTime(leaders[0].bestMs).replace(/^00:/, "")
              : "—"}
          </div>
          <div className="delta">{leaders.length} on board</div>
        </div>
      </div>

      {tip && (
        <>
          <div className="section-head">
            <h2>
              <Lightbulb size={14} style={{ display: "inline", marginRight: 6 }} />
              How to
            </h2>
          </div>
          <div
            style={{
              background: "var(--bg-soft)",
              borderRadius: 16,
              padding: 20,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>{tip.tip}</p>
            {tip.mnemonic && (
              <p
                className="caps"
                style={{ marginTop: 12, color: "var(--muted)", fontSize: 11 }}
              >
                mnemonic · {tip.mnemonic}
              </p>
            )}
          </div>
        </>
      )}

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          <Clock size={14} style={{ display: "inline", marginRight: 6 }} />
          Your history{" "}
          <span className="count">· {history.length}</span>
        </h2>
      </div>
      <div style={{ background: "var(--bg-soft)", borderRadius: 16 }}>
        {!loaded && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Loading…
          </div>
        )}
        {loaded && history.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No runs yet — drill this trick to fill in the chart.
          </div>
        )}
        {history.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => router.push(`/drill/${trick.id}/results?d=${d.id}`)}
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 80px 90px 20px",
              gap: 16,
              padding: "14px 18px",
              borderBottom: i < history.length - 1 ? "1px solid var(--bg-2)" : "none",
              alignItems: "center",
              fontSize: 14,
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              color: "inherit",
            }}
          >
            <span className="caps" style={{ color: "var(--muted)" }}>
              {d.startedAt ? formatRel(d.startedAt.toMillis()) : "saved"}
            </span>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              avg{" "}
              {d.perQuestion.length > 0
                ? formatShort(
                    d.perQuestion.reduce((a, p) => a + p.ms, 0) / d.perQuestion.length,
                  )
                : "—"}
            </span>
            <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
              {d.score}
            </span>
            <span className="mono" style={{ textAlign: "right" }}>
              {formatTime(d.totalMs)}
            </span>
            <ArrowRight size={14} style={{ color: "var(--muted)" }} />
          </button>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          <Trophy size={14} style={{ display: "inline", marginRight: 6 }} />
          Top 10 globally
        </h2>
      </div>
      <div style={{ background: "var(--bg-soft)", borderRadius: 16 }}>
        {!loaded && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Loading…
          </div>
        )}
        {loaded && leaders.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Be the first to set a time.
          </div>
        )}
        {leaders.map((entry, i) => {
          const isYou = entry.uid === user?.uid;
          return (
            <div
              key={entry.uid}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 90px",
                gap: 16,
                padding: "12px 18px",
                borderBottom: i < leaders.length - 1 ? "1px solid var(--bg-2)" : "none",
                alignItems: "center",
                fontSize: 14,
                background: isYou ? "var(--accent-soft, var(--bg-2))" : "transparent",
              }}
            >
              <span
                className="mono"
                style={{
                  color: i < 3 ? "var(--ink)" : "var(--muted)",
                  fontWeight: i < 3 ? 600 : 400,
                }}
              >
                #{i + 1}
              </span>
              <span style={{ fontWeight: isYou ? 600 : 500 }}>
                {entry.displayName || "Anonymous"}
                {isYou && (
                  <span className="caps" style={{ marginLeft: 8, color: "var(--muted)", fontSize: 10 }}>
                    you
                  </span>
                )}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{entry.school || "—"}</span>
              <span className="mono" style={{ textAlign: "right" }}>
                {formatTime(entry.bestMs).replace(/^00:/, "")}
              </span>
            </div>
          );
        })}
      </div>

      {related.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 40 }}>
            <h2>
              Related tricks <span className="count">· {related.length}</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {related.map((t) => (
              <TrickCard
                key={t.id}
                trick={t}
                bestMs={allBests.get(t.id)?.bestMs}
                onClick={() => router.push(`/trick/${t.id}`)}
              />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn primary"
          type="button"
          onClick={() => router.push(`/drill/${trick.id}`)}
        >
          Drill this trick <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function formatRel(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
