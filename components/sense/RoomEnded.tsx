"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Play, LogOut, Loader2 } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { TRICKS } from "@/lib/data/tricks";
import { useAuth } from "@/hooks/useAuth";
import { deleteRoom, leaveRoom, resetRoom } from "@/lib/firebase/rooms";
import { trackEvent } from "@/lib/firebase/analytics";
import type { Room } from "@/lib/types";

type RoomEndedProps = {
  room: Room;
  code: string;
};

const AUTO_DELETE_MS = 30_000;

export function RoomEnded({ room, code }: RoomEndedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [restarting, setRestarting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isHost = !!user && room.host === user.uid;
  const trick = TRICKS.find((t) => t.id === room.trickId);
  const winner = room.winnerUid ? room.players?.[room.winnerUid] : null;

  const standings = Object.entries(room.players ?? {}).sort(([, a], [, b]) => {
    if (b.solved !== a.solved) return b.solved - a.solved;
    const af = a.finishedAt ?? Number.POSITIVE_INFINITY;
    const bf = b.finishedAt ?? Number.POSITIVE_INFINITY;
    return af - bf;
  });

  useEffect(() => {
    const t = setTimeout(() => {
      deleteRoom(code).catch(() => {
        // idempotent: silent
      });
    }, AUTO_DELETE_MS);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (!user) return;
    void trackEvent("multiplayer_game_completed", {
      trick_id: room.trickId,
      players_count: Object.keys(room.players ?? {}).length,
      won: room.winnerUid === user.uid,
    });
    // Fire once per mount of the ended view, per user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function onPlayAgain() {
    if (!user || !isHost) return;
    setRestarting(true);
    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      await resetRoom(code, user.uid, seed);
    } finally {
      setRestarting(false);
    }
  }

  async function onLeave() {
    if (!user) return;
    setLeaving(true);
    try {
      await leaveRoom(code, user.uid);
    } finally {
      router.push("/multiplayer");
    }
  }

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Multiplayer", `Room ${code}`, "Results"]}
        right={
          <button
            className="btn ghost"
            type="button"
            onClick={onLeave}
            disabled={leaving}
          >
            <LogOut size={14} /> Back to menu
          </button>
        }
      />

      <section className="hero">
        <div>
          <div
            className="caps"
            style={{ color: "var(--accent-deep)", marginBottom: 12 }}
          >
            Race over · {trick?.name ?? room.trickId}
          </div>
          <h1 className="hero-title">
            <em>{winner?.displayName ?? "No one"}</em>
            <br />
            wins.
          </h1>
          <p className="hero-sub">
            First to {room.questionCount} on {trick?.name ?? "this trick"}.
            Room will auto-close in 30 seconds.
          </p>
          <div className="hero-cta">
            {isHost && (
              <button
                className="btn primary"
                type="button"
                onClick={onPlayAgain}
                disabled={restarting}
              >
                {restarting ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Play size={14} />
                )}
                Play again
              </button>
            )}
            <button className="btn" type="button" onClick={onLeave}>
              <LogOut size={14} /> Back to menu
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <Crown
            size={180}
            style={{ color: "var(--ink)" }}
            strokeWidth={1.5}
          />
        </div>
      </section>

      <div
        className="room-final-board"
        style={{
          background: "var(--bg-soft)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--bg-2)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <div className="caps" style={{ color: "var(--muted)" }}>
            Final standings
          </div>
          <div className="caps" style={{ color: "var(--muted)" }}>
            {standings.length} racers
          </div>
        </div>
        {standings.map(([uid, p], i) => {
          const isYou = !!user && uid === user.uid;
          const isWinner = uid === room.winnerUid;
          return (
            <div
              className="room-final-row"
              key={uid}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 36px 1fr 80px 90px",
                gap: 14,
                padding: "12px 18px",
                borderBottom:
                  i < standings.length - 1 ? "1px solid var(--bg-2)" : "none",
                alignItems: "center",
                fontSize: 14,
                background: isYou ? "var(--bg-2)" : "transparent",
              }}
            >
              <span
                className="mono"
                style={{
                  color: i < 3 ? "var(--ink)" : "var(--muted)",
                  fontWeight: i < 3 ? 700 : 400,
                }}
              >
                #{i + 1}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isWinner ? "var(--ink)" : "var(--accent)",
                  color: isWinner ? "var(--bg-raised)" : "var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {p.avatarInitials || "?"}
              </div>
              <span style={{ fontWeight: isYou ? 700 : 500 }}>
                {p.displayName || "Anonymous"}
                {isYou && (
                  <span
                    className="caps"
                    style={{
                      marginLeft: 8,
                      color: "var(--muted)",
                      fontSize: 10,
                    }}
                  >
                    you
                  </span>
                )}
                {isWinner && (
                  <span
                    className="caps"
                    style={{
                      marginLeft: 8,
                      color: "var(--accent-deep)",
                      fontSize: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Crown size={11} /> winner
                  </span>
                )}
              </span>
              <span
                className="mono"
                style={{ color: "var(--muted)", fontSize: 12 }}
              >
                {p.solved}/{room.questionCount}
              </span>
              <span
                className="mono"
                style={{ textAlign: "right", fontSize: 12 }}
              >
                {p.finishedAt ? "finished" : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
