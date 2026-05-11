import { Trophy } from "lucide-react";
import type { RoomPlayer } from "@/lib/types";

type RoomLaneProps = {
  player: RoomPlayer;
  uid: string;
  ownUid: string;
  total?: number;
};

export function RoomLane({ player, uid, ownUid, total = 5 }: RoomLaneProps) {
  const isYou = uid === ownUid;
  const done = player.solved >= total;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 14,
        background: isYou ? "var(--bg-2)" : "var(--bg-soft)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: done ? "var(--ink)" : "var(--accent)",
          color: done ? "var(--bg-raised)" : "var(--ink)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "-0.02em",
        }}
      >
        {player.avatarInitials || "?"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div
          style={{
            fontWeight: isYou ? 700 : 600,
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {player.displayName || "Anonymous"}
          {isYou && (
            <span
              className="caps"
              style={{ marginLeft: 8, color: "var(--muted)", fontSize: 10 }}
            >
              you
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background:
                  i < player.solved ? "var(--ink)" : "var(--bg-raised)",
                transition: "background 200ms ease",
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {done ? (
          <span
            className="caps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--accent-deep)",
              background: "var(--bg-raised)",
              padding: "4px 8px",
              borderRadius: 999,
              fontSize: 10,
            }}
          >
            <Trophy size={12} /> done
          </span>
        ) : (
          <span
            className="mono"
            style={{ color: "var(--muted)", fontSize: 12 }}
          >
            {player.solved}/{total}
          </span>
        )}
      </div>
    </div>
  );
}
