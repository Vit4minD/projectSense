"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAllBests,
  getDrillsForTrick,
  type SavedDrill,
} from "@/lib/firebase/drills";
import { getLeaderboardForTrick } from "@/lib/firebase/leaderboard";
import { formatShort, formatTime } from "@/lib/drill/utils";
import type { Best, LeaderboardEntry } from "@/lib/types";

/**
 * Authed extras for a trick page (your best/accuracy/history + global top-10).
 * A client island inside the otherwise public, server-rendered trick page:
 * logged-out visitors (and crawlers) get the educational content above plus a
 * sign-in prompt here; the leaderboard requires auth to read.
 */
export function TrickStats({ trickId }: { trickId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [best, setBest] = useState<Best | null>(null);
  const [history, setHistory] = useState<SavedDrill[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getDrillsForTrick(user.uid, trickId, 10),
      getLeaderboardForTrick(trickId, 10).catch(() => [] as LeaderboardEntry[]),
      getAllBests(user.uid),
    ])
      .then(([h, l, all]) => {
        if (cancelled) return;
        setBest(all.get(trickId) ?? null);
        setHistory(h);
        setLeaders(l);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, trickId]);

  const accuracyPct = useMemo(() => {
    if (!best || best.attempts === 0) return null;
    return Math.round((best.correct / (best.attempts * 5)) * 100);
  }, [best]);

  if (!user) {
    if (authLoading) return null;
    return (
      <div
        style={{
          background: "var(--bg-soft)",
          borderRadius: 16,
          padding: 24,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 14 }}>
          Sign in to time yourself on this trick, track your history, and see the
          global leaderboard.
        </p>
        <Link className="btn primary" href="/login">
          Sign in to practice <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hero-stats-row" style={{ marginTop: 32 }}>
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

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          <Clock size={14} style={{ display: "inline", marginRight: 6 }} />
          Your history <span className="count">· {history.length}</span>
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
            onClick={() => router.push(`/drill/${trickId}/results?d=${d.id}`)}
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
                ? formatShort(d.perQuestion.reduce((a, p) => a + p.ms, 0) / d.perQuestion.length)
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
                style={{ color: i < 3 ? "var(--ink)" : "var(--muted)", fontWeight: i < 3 ? 600 : 400 }}
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
    </>
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
