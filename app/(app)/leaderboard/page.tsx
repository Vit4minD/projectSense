"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trophy } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { TRICKS } from "@/lib/data/tricks";
import { CATEGORIES } from "@/lib/data/categories";
import { getLeaderboardForTrick } from "@/lib/firebase/leaderboard";
import { formatTime } from "@/lib/drill/utils";
import type { LeaderboardEntry } from "@/lib/types";

const TOP_LIMIT = 50;

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string>(TRICKS[0].id);
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getLeaderboardForTrick(selected, TOP_LIMIT)
      .then((rows) => {
        if (!cancelled) {
          setEntries(rows);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const filteredTricks = useMemo(
    () =>
      TRICKS.filter(
        (t) => q === "" || t.name.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q),
      ),
    [q],
  );

  const selectedTrick = TRICKS.find((t) => t.id === selected);
  const selectedCategory = selectedTrick
    ? CATEGORIES.find((c) => c.key === selectedTrick.cat)?.label
    : "";

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Leaderboard", selectedTrick?.name ?? selected]}
        right={
          <button className="btn" type="button" onClick={() => router.push("/")}>
            All tricks
          </button>
        }
      />

      <section className="hero">
        <div>
          <h1 className="hero-title">
            Top times,{" "}
            <em>{selectedTrick?.name ?? "—"}</em>
          </h1>
          <p className="hero-sub">
            Global rankings update server-side after each new personal best. Visible to
            signed-in players; click any trick to switch.
          </p>
        </div>
        <div className="hero-visual">
          <Trophy size={160} style={{ color: "var(--ink)" }} />
        </div>
      </section>

      <div
        className="leaderboard-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <aside
          className="leaderboard-picker"
          style={{
            background: "var(--bg-soft)",
            borderRadius: 16,
            padding: 12,
            position: "sticky",
            top: 16,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
          }}
        >
          <div className="search" style={{ marginBottom: 8 }}>
            <Search size={14} />
            <input
              placeholder="Filter tricks…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredTricks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: selected === t.id ? "var(--bg-2)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  color: "inherit",
                  fontWeight: selected === t.id ? 600 : 400,
                  fontSize: 13,
                }}
              >
                <span className="mono" style={{ color: "var(--muted)" }}>
                  / {t.id}
                </span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="leaderboard-board">
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--bg-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div className="caps" style={{ color: "var(--muted)" }}>
              {selectedCategory} · trick / {selected}
            </div>
            <div className="caps" style={{ color: "var(--muted)" }}>
              {entries.length} on board
            </div>
          </div>

          {!loaded && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
              Loading…
            </div>
          )}
          {loaded && entries.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
              Be the first to set a time on this trick.
            </div>
          )}
          {entries.map((entry, i) => {
            const isYou = entry.uid === user?.uid;
            return (
              <div
                className="leaderboard-row"
                key={entry.uid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1.4fr 1fr 110px",
                  gap: 16,
                  padding: "12px 18px",
                  borderBottom: i < entries.length - 1 ? "1px solid var(--bg-2)" : "none",
                  alignItems: "center",
                  fontSize: 14,
                  background: isYou ? "var(--bg-2)" : "transparent",
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
                    <span
                      className="caps"
                      style={{ marginLeft: 8, color: "var(--muted)", fontSize: 10 }}
                    >
                      you
                    </span>
                  )}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  {entry.school || "—"}
                </span>
                <span className="mono" style={{ textAlign: "right" }}>
                  {formatTime(entry.bestMs).replace(/^00:/, "")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
