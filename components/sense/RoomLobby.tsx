"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Crown, LogOut, Play, Loader2, Check } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { TRICKS } from "@/lib/data/tricks";
import { useAuth } from "@/hooks/useAuth";
import {
  leaveRoom,
  setTrick,
  setVisibility,
  startRace,
} from "@/lib/firebase/rooms";
import type { Room } from "@/lib/types";

type RoomLobbyProps = {
  room: Room;
  code: string;
};

export function RoomLobby({ room, code }: RoomLobbyProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isHost = !!user && room.host === user.uid;
  const trick = TRICKS.find((t) => t.id === room.trickId);
  const players = Object.entries(room.players ?? {}).sort(
    (a, b) => (a[1].joinedAt ?? 0) - (b[1].joinedAt ?? 0),
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function onChangeTrick(nextId: string) {
    if (!user || !isHost) return;
    const seed = Math.floor(Math.random() * 1_000_000);
    await setTrick(code, user.uid, nextId, seed);
  }

  async function onToggleVisibility() {
    if (!user || !isHost) return;
    await setVisibility(
      code,
      user.uid,
      room.visibility === "public" ? "private" : "public",
    );
  }

  async function onStart() {
    if (!user || !isHost) return;
    setStarting(true);
    try {
      await startRace(code, user.uid);
    } finally {
      setStarting(false);
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
        crumbs={["sense", "Multiplayer", `Room ${code}`]}
        right={
          <button
            className="btn ghost"
            type="button"
            onClick={onLeave}
            disabled={leaving}
          >
            <LogOut size={14} /> Leave
          </button>
        }
      />

      <section className="hero">
        <div>
          <div
            className="caps"
            style={{ color: "var(--accent-deep)", marginBottom: 12 }}
          >
            Lobby ·{" "}
            <span style={{ color: "var(--muted)" }}>
              {room.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>
          <h1 className="hero-title">
            Room{" "}
            <em
              className="mono"
              style={{ fontStyle: "normal", color: "var(--accent-2)" }}
            >
              {code}
            </em>
          </h1>
          <p className="hero-sub">
            {trick ? trick.name : "Pick a trick"}. First to{" "}
            {room.questionCount} wins.
          </p>
          <div className="hero-cta">
            <button
              className="btn"
              type="button"
              onClick={copyCode}
              aria-label="Copy room code"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy code"}
            </button>
            {isHost && (
              <button
                className="btn primary"
                type="button"
                onClick={onStart}
                disabled={starting || players.length < 1}
              >
                {starting ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Play size={14} />
                )}
                Start race <span className="kbd">↵</span>
              </button>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <span className="big-num">{players.length}</span>
        </div>
      </section>

      <div
        className="room-lobby-grid"
        style={{
          display: "grid",
          gridTemplateColumns: isHost ? "1fr 1fr" : "1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          className="room-players-panel"
          style={{
            background: "var(--bg-soft)",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div
            className="caps"
            style={{
              color: "var(--accent-deep)",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Players</span>
            <span style={{ color: "var(--muted)" }}>{players.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {players.map(([uid, p]) => {
              const isYou = !!user && uid === user.uid;
              const isPlayerHost = uid === room.host;
              return (
                <div
                  key={uid}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: isYou
                      ? "var(--bg-2)"
                      : "var(--bg-raised)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      color: "var(--ink)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {p.avatarInitials || "?"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: isYou ? 700 : 600,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
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
                    </div>
                  </div>
                  {isPlayerHost && (
                    <span
                      className="caps"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--accent-deep)",
                        fontSize: 10,
                      }}
                    >
                      <Crown size={12} /> host
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isHost && (
          <div
            className="room-controls-panel"
            style={{
              background: "var(--bg-soft)",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              className="caps"
              style={{ color: "var(--accent-deep)" }}
            >
              Host controls
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                htmlFor="lobby-trick"
                className="caps"
                style={{ color: "var(--muted)", fontSize: 10 }}
              >
                Trick
              </label>
              <select
                id="lobby-trick"
                value={room.trickId}
                onChange={(e) => onChangeTrick(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--bg-2)",
                  background: "var(--bg-raised)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {TRICKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                className="caps"
                style={{ color: "var(--muted)", fontSize: 10 }}
              >
                Visibility
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`chip ${room.visibility === "public" ? "active" : ""}`}
                  onClick={() =>
                    room.visibility !== "public" && onToggleVisibility()
                  }
                >
                  Public
                </button>
                <button
                  type="button"
                  className={`chip ${room.visibility === "private" ? "active" : ""}`}
                  onClick={() =>
                    room.visibility !== "private" && onToggleVisibility()
                  }
                >
                  Private
                </button>
              </div>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {room.visibility === "public"
                  ? "Listed in the public rooms feed."
                  : "Only joinable by code."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
