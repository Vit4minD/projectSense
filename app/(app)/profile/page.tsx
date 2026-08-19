"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Award, ArrowRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { TopBar } from "@/components/sense/TopBar";
import { TrickCard } from "@/components/sense/TrickCard";
import { useAuth } from "@/hooks/useAuth";
import { getProfileStats, type ProfileStats } from "@/lib/firebase/profile";
import { getDb } from "@/lib/firebase/client";
import { TRICKS, getTrickById } from "@/lib/data/tricks";
import { formatTime } from "@/lib/drill/utils";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getProfileStats(user.uid),
      getDoc(doc(getDb(), "users", user.uid)).then((s) =>
        s.exists() ? (s.data() as UserProfile) : null,
      ),
    ])
      .then(([s, p]) => {
        if (cancelled) return;
        setStats(s);
        setProfile(p);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Account", "Profile"]}
        right={
          <button className="btn" type="button" onClick={() => router.push("/")}>
            All tricks
          </button>
        }
      />

      <section
        className="hero"
        style={{ alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div
            className="avatar"
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "var(--bg-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif, var(--display))",
              fontSize: 32,
              fontWeight: 600,
            }}
          >
            {profile?.avatarInitials || "S"}
          </div>
          <div>
            <h1 className="hero-title" style={{ fontSize: 36, lineHeight: 1.1 }}>
              {profile?.displayName || user?.displayName || "Sense Player"}
            </h1>
            <div className="hero-sub" style={{ fontSize: 14 }}>
              {profile?.school || "—"}
              {profile?.createdAt && (
                <>
                  {" · "}
                  member since{" "}
                  {profile.createdAt.toDate().toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="hero-stats-row">
        <div className="stat">
          <div className="label">Total drills</div>
          <div className="value">{stats?.totalDrills ?? "—"}</div>
          <div className="delta">{stats?.tricksPracticed ?? 0}/{TRICKS.length} tricks</div>
        </div>
        <div className="stat">
          <div className="label">Accuracy</div>
          <div className="value">
            {stats && stats.totalDrills > 0 ? `${Math.round(stats.accuracy * 100)}%` : "—"}
          </div>
          <div className="delta">{stats?.totalCorrect ?? 0} correct</div>
        </div>
        <div className="stat">
          <div className="label">Best time</div>
          <div className="value">
            {stats?.strongest[0]
              ? formatTime(stats.strongest[0].bestMs).replace(/^00:/, "")
              : "—"}
          </div>
          <div className="delta">
            {stats?.strongest[0]
              ? getTrickById(stats.strongest[0].trickId)?.name?.slice(0, 22) ?? "—"
              : "no times yet"}
          </div>
        </div>
        <div className="stat">
          <div className="label">Achievements</div>
          <div className="value">
            {stats ? `${stats.achievements.filter((a) => a.unlocked).length}/${stats.achievements.length}` : "—"}
          </div>
          <div className="delta">unlocked</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Last 7 days</h2>
      </div>
      <div
        style={{
          background: "var(--bg-soft)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <WeeklyChart values={stats?.weeklyMs ?? [0, 0, 0, 0, 0, 0, 0]} />
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          Strongest <span className="count">· {stats?.strongest.length ?? 0}</span>
        </h2>
      </div>
      <div style={{ background: "var(--bg-soft)", borderRadius: 16 }}>
        {!loaded && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            Loading…
          </div>
        )}
        {loaded && (!stats || stats.strongest.length === 0) && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            Drill any trick to set your first time.
          </div>
        )}
        {stats?.strongest.map((s, i) => {
          const trick = getTrickById(s.trickId);
          if (!trick) return null;
          return (
            <button
              key={s.trickId}
              type="button"
              onClick={() => router.push(`/trick/${s.trickId}`)}
              style={rowButtonStyle(i, stats.strongest.length)}
            >
              <span className="caps" style={{ color: "var(--muted)" }}>
                trick / {s.trickId}
              </span>
              <span style={{ fontWeight: 500 }}>{trick.name}</span>
              <span className="mono" style={{ textAlign: "right" }}>
                {formatTime(s.bestMs).replace(/^00:/, "")}
              </span>
              <ArrowRight size={14} style={{ color: "var(--muted)" }} />
            </button>
          );
        })}
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          Weakest <span className="count">· {stats?.weakest.length ?? 0}</span>
        </h2>
      </div>
      <div className="profile-weak-grid">
        {stats?.weakest.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 24,
              textAlign: "center",
              color: "var(--muted)",
              background: "var(--bg-soft)",
              borderRadius: 16,
            }}
          >
            Drill any trick at least twice to surface a weakness.
          </div>
        )}
        {stats?.weakest.map((w) => {
          const trick = TRICKS.find((t) => t.id === w.trickId);
          if (!trick) return null;
          return (
            <TrickCard
              key={w.trickId}
              trick={trick}
              onClick={() => router.push(`/trick/${w.trickId}`)}
            />
          );
        })}
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>
          <Award size={14} style={{ display: "inline", marginRight: 6 }} />
          Achievements{" "}
          <span className="count">
            · {stats ? stats.achievements.filter((a) => a.unlocked).length : 0}/
            {stats?.achievements.length ?? 0}
          </span>
        </h2>
      </div>
      <div
        className="profile-achievement-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {stats?.achievements.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 14,
              borderRadius: 12,
              background: a.unlocked ? "var(--bg-soft)" : "transparent",
              border: a.unlocked ? "1px solid var(--bg-2)" : "1px dashed var(--bg-2)",
              opacity: a.unlocked ? 1 : 0.55,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {a.unlocked ? <Award size={14} /> : <Lock size={14} />}
              {a.label}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
              {a.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function rowButtonStyle(i: number, total: number): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "100px 1fr 90px 20px",
    gap: 16,
    padding: "14px 18px",
    borderBottom: i < total - 1 ? "1px solid var(--bg-2)" : "none",
    alignItems: "center",
    fontSize: 14,
    width: "100%",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    color: "inherit",
  };
}

function WeeklyChart({ values }: { values: number[] }) {
  const labels = useDayLabels();
  const max = Math.max(1, ...values);
  const W = 560;
  const H = 120;
  const pad = 24;
  const step = (W - pad * 2) / (values.length - 1 || 1);
  const barW = step * 0.55;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="none"
      role="img"
      aria-label="Last 7 days drill time"
    >
      {values.map((v, i) => {
        const h = (v / max) * (H - pad * 2);
        const x = pad + i * step - barW / 2;
        const y = H - pad - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={3}
              fill="var(--accent, #cf6a37)"
              opacity={v > 0 ? 0.9 : 0.18}
            />
            <text
              x={pad + i * step}
              y={H - 6}
              fontSize={10}
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontFamily: "var(--mono)" }}
            >
              {labels[i]}
            </text>
            {v > 0 && (
              <text
                x={pad + i * step}
                y={y - 4}
                fontSize={10}
                textAnchor="middle"
                fill="var(--ink)"
                style={{ fontFamily: "var(--mono)" }}
              >
                {Math.round(v / 1000)}s
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function useDayLabels(): string[] {
  // Recompute on the client so that SSR / CSR labels can't desync.
  const [labels, setLabels] = useState<string[]>(["", "", "", "", "", "", ""]);
  useEffect(() => {
    const out: string[] = [];
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(fmt.format(d).slice(0, 3));
    }
    setLabels(out);
  }, []);
  return labels;
}
