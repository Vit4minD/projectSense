"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, KeyRound, Plus, Search, Swords, Users } from "lucide-react";
import { TopBar } from "@/components/sense/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { usePublicRooms } from "@/hooks/usePublicRooms";
import { TRICKS } from "@/lib/data/tricks";
import { createRoom, joinRoom } from "@/lib/firebase/rooms";
import { generateRoomCode, normalizeRoomCode } from "@/lib/multiplayer/roomCode";
import type { RoomVisibility } from "@/lib/types";

function deriveIdentity(user: { displayName: string | null; email: string | null }) {
  const displayName =
    user.displayName?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "Player";
  const avatarInitials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "P";
  return { displayName, avatarInitials };
}

function trickName(trickId: string): string {
  return TRICKS.find((t) => t.id === trickId)?.name ?? `Trick ${trickId}`;
}

export default function MultiplayerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    retry: retryRooms,
  } = usePublicRooms();

  const [showCreate, setShowCreate] = useState(false);
  const [createTrickId, setCreateTrickId] = useState<string>(TRICKS[0].id);
  const [createVisibility, setCreateVisibility] = useState<RoomVisibility>("public");
  const [trickQuery, setTrickQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [publicJoiningCode, setPublicJoiningCode] = useState<string | null>(null);

  const filteredTricks = useMemo(() => {
    if (trickQuery === "") return TRICKS;
    const q = trickQuery.toLowerCase();
    return TRICKS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.id.includes(q),
    );
  }, [trickQuery]);

  async function handleCreate() {
    if (!user || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { displayName, avatarInitials } = deriveIdentity(user);
      const code = generateRoomCode();
      const seed = Math.floor(Math.random() * 2 ** 31);
      await createRoom({
        code,
        host: user.uid,
        hostDisplayName: displayName,
        hostAvatarInitials: avatarInitials,
        trickId: createTrickId,
        seed,
        visibility: createVisibility,
      });
      router.push(`/multiplayer/${code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create room.");
      setCreating(false);
    }
  }

  async function handleJoinByCode() {
    if (!user || joining) return;
    const normalized = normalizeRoomCode(joinCode);
    if (!normalized) {
      setJoinError("Invalid code. 5 characters, letters & digits only.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const { displayName, avatarInitials } = deriveIdentity(user);
      await joinRoom({
        code: normalized,
        uid: user.uid,
        displayName,
        avatarInitials,
      });
      router.push(`/multiplayer/${normalized}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join room.");
      setJoining(false);
    }
  }

  async function handleJoinPublic(code: string) {
    if (!user || publicJoiningCode) return;
    setPublicJoiningCode(code);
    try {
      const { displayName, avatarInitials } = deriveIdentity(user);
      await joinRoom({
        code,
        uid: user.uid,
        displayName,
        avatarInitials,
      });
      router.push(`/multiplayer/${code}`);
    } catch {
      setPublicJoiningCode(null);
    }
  }

  return (
    <div className="main">
      <TopBar
        crumbs={["sense", "Multiplayer", "Lobby"]}
        right={
          <button className="btn" type="button" onClick={() => router.push("/")}>
            All tricks
          </button>
        }
      />

      <section className="hero">
        <div>
          <h1 className="hero-title">
            Race friends.
            <br />
            <em>Five questions.</em>
          </h1>
          <p className="hero-sub">
            Create a room, send the code, and sprint through a synchronized drill.
            First to finish wins the lane.
          </p>
          <div className="hero-cta">
            <button
              className="btn accent"
              type="button"
              onClick={() => {
                setShowCreate((v) => !v);
                setCreateError(null);
              }}
            >
              <Plus size={12} /> {showCreate ? "Hide create panel" : "Create a room"}
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <Swords size={140} style={{ color: "var(--ink)" }} />
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <ActionCard
          icon={<Plus size={16} />}
          label="Create room"
          desc="Pick a trick, share a code."
          actionLabel={showCreate ? "Close" : "Open"}
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError(null);
          }}
          highlight={showCreate}
        />
        <ActionCard
          icon={<KeyRound size={16} />}
          label="Join by code"
          desc="Got a 5-character invite?"
        >
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div className="search" style={{ flex: 1, maxWidth: "none" }}>
              <KeyRound size={14} />
              <input
                placeholder="e.g. K7P3R"
                value={joinCode}
                maxLength={5}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  if (joinError) setJoinError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinByCode();
                }}
                style={{
                  textTransform: "uppercase",
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                }}
              />
            </div>
            <button
              className="btn primary"
              type="button"
              onClick={handleJoinByCode}
              disabled={joining || joinCode.trim() === ""}
              style={{ opacity: joining || joinCode.trim() === "" ? 0.55 : 1 }}
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
          {joinError && (
            <p style={{ color: "var(--negative)", fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              {joinError}
            </p>
          )}
        </ActionCard>
        <ActionCard
          icon={<Globe size={16} />}
          label="Find public game"
          desc={`${rooms.length} room${rooms.length === 1 ? "" : "s"} open right now.`}
          actionLabel="See list"
          onClick={() => {
            const el = document.getElementById("public-games");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {showCreate && (
        <div
          style={{
            background: "var(--bg-soft)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
              New room
            </h3>
            <span className="caps" style={{ color: "var(--muted)" }}>
              5 questions · best total time wins
            </span>
          </div>

          <div>
            <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
              Trick
            </div>
            <div className="search" style={{ marginBottom: 10, maxWidth: 360 }}>
              <Search size={14} />
              <input
                placeholder="Filter tricks…"
                value={trickQuery}
                onChange={(e) => setTrickQuery(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 6,
                maxHeight: 220,
                overflowY: "auto",
                padding: 4,
                background: "var(--bg-raised)",
                borderRadius: 12,
              }}
            >
              {filteredTricks.map((t) => {
                const active = t.id === createTrickId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCreateTrickId(t.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg-raised)" : "var(--ink)",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        color: active ? "var(--accent)" : "var(--muted)",
                      }}
                    >
                      / {t.id}
                    </span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
              {filteredTricks.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: 12,
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 12,
                  }}
                >
                  No matches.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="caps" style={{ color: "var(--muted)", marginBottom: 8 }}>
              Visibility
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <VisibilityChip
                value="public"
                current={createVisibility}
                onClick={() => setCreateVisibility("public")}
                label="Public"
                hint="anyone can join"
              />
              <VisibilityChip
                value="private"
                current={createVisibility}
                onClick={() => setCreateVisibility("private")}
                label="Private"
                hint="invite by code"
              />
            </div>
          </div>

          {createError && (
            <p style={{ color: "var(--negative)", fontSize: 13, margin: 0 }}>{createError}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setShowCreate(false)}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={handleCreate}
              disabled={creating}
              style={{ opacity: creating ? 0.6 : 1 }}
            >
              {creating ? "Creating…" : "Create room"}
            </button>
          </div>
        </div>
      )}

      <div className="section-head" id="public-games">
        <h2>
          Public games <span className="count">· {rooms.length}</span>
        </h2>
      </div>

      <div style={{ background: "var(--bg-soft)", borderRadius: 16 }}>
        {roomsLoading && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
            Loading rooms…
          </div>
        )}
        {!roomsLoading && roomsError && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
            <p style={{ margin: "0 0 12px" }}>
              Couldn&apos;t load open rooms.
            </p>
            <button className="btn primary" type="button" onClick={retryRooms}>
              Retry
            </button>
          </div>
        )}
        {!roomsLoading && !roomsError && rooms.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
            No open rooms — be the first to create one.
          </div>
        )}
        {!roomsLoading &&
          !roomsError &&
          rooms.map((r, i) => {
            const isJoining = publicJoiningCode === r.code;
            return (
              <div
                key={r.code}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1.4fr 1.4fr 120px 120px",
                  gap: 16,
                  padding: "14px 18px",
                  borderBottom: i < rooms.length - 1 ? "1px solid var(--bg-2)" : "none",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <span
                  className="mono"
                  style={{ fontWeight: 700, letterSpacing: "0.08em" }}
                >
                  {r.code}
                </span>
                <span
                  className="mono"
                  style={{
                    color: "var(--muted)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={r.host}
                >
                  host · {r.host.slice(0, 8)}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {trickName(r.trickId)}
                </span>
                <span
                  className="mono"
                  style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)" }}
                >
                  <Users size={12} />
                  {r.playerCount}
                </span>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => handleJoinPublic(r.code)}
                  disabled={Boolean(publicJoiningCode)}
                  style={{
                    justifySelf: "end",
                    opacity: publicJoiningCode && !isJoining ? 0.45 : 1,
                  }}
                >
                  {isJoining ? "Joining…" : "Join"}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

type ActionCardProps = {
  icon: React.ReactNode;
  label: string;
  desc: string;
  actionLabel?: string;
  onClick?: () => void;
  highlight?: boolean;
  children?: React.ReactNode;
};

function ActionCard({
  icon,
  label,
  desc,
  actionLabel,
  onClick,
  highlight,
  children,
}: ActionCardProps) {
  return (
    <div
      style={{
        background: highlight ? "var(--ink)" : "var(--bg-soft)",
        color: highlight ? "var(--bg-raised)" : "var(--ink)",
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 140,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: highlight ? "var(--accent)" : "var(--accent-deep)",
        }}
      >
        {icon}
        <span className="caps">{label}</span>
      </div>
      <div
        style={{
          fontSize: 15,
          color: highlight ? "color-mix(in oklab, var(--bg-raised) 75%, transparent)" : "var(--muted)",
        }}
      >
        {desc}
      </div>
      {children}
      {actionLabel && (
        <button
          className="btn"
          type="button"
          onClick={onClick}
          style={{
            marginTop: "auto",
            alignSelf: "flex-start",
            background: highlight ? "var(--accent)" : "var(--bg-raised)",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

type VisibilityChipProps = {
  value: RoomVisibility;
  current: RoomVisibility;
  onClick: () => void;
  label: string;
  hint: string;
};

function VisibilityChip({ value, current, onClick, label, hint }: VisibilityChipProps) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        background: active ? "var(--ink)" : "var(--bg-raised)",
        color: active ? "var(--bg-raised)" : "var(--ink)",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontWeight: 400,
          opacity: 0.7,
          fontSize: 12,
        }}
      >
        {hint}
      </span>
    </button>
  );
}
