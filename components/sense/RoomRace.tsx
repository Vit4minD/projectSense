"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DrillProblem } from "@/components/sense/DrillProblem";
import { RoomLane } from "@/components/sense/RoomLane";
import { TRICKS } from "@/lib/data/tricks";
import { generate } from "@/lib/drill/problemGenerator";
import { equals } from "@/lib/drill/answerValidator";
import { formatTime } from "@/lib/drill/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTimer } from "@/hooks/useTimer";
import { endRace, incrementSolved } from "@/lib/firebase/rooms";
import type { GeneratedProblem, Room } from "@/lib/types";

type RoomRaceProps = {
  room: Room;
  code: string;
};

export function RoomRace({ room, code }: RoomRaceProps) {
  const { user } = useAuth();
  const timer = useTimer();
  const startedRef = useRef(false);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [answer, setAnswer] = useState("");
  const [shake, setShake] = useState(false);

  const problems = useMemo<GeneratedProblem[]>(() => {
    try {
      return generate(room.trickId, room.seed, room.questionCount);
    } catch {
      return [];
    }
  }, [room.trickId, room.seed, room.questionCount]);

  const trick = TRICKS.find((t) => t.id === room.trickId);
  const me = user ? room.players?.[user.uid] : undefined;
  const mySolved = me?.solved ?? 0;
  const current = problems[mySolved];
  const done = mySolved >= room.questionCount;

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      timer.start();
    }
    return () => {
      timer.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mySolved]);

  async function submit() {
    if (!user || !current || submittingRef.current || done) return;
    if (!equals(answer, current.expected)) {
      setShake(true);
      setTimeout(() => setShake(false), 320);
      setAnswer("");
      return;
    }
    submittingRef.current = true;
    try {
      const next = await incrementSolved(code, user.uid);
      setAnswer("");
      if (next >= room.questionCount) {
        await endRace(code, user.uid);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  const lanes = Object.entries(room.players ?? {}).sort(([, a], [, b]) => {
    if (b.solved !== a.solved) return b.solved - a.solved;
    const af = a.finishedAt ?? Number.POSITIVE_INFINITY;
    const bf = b.finishedAt ?? Number.POSITIVE_INFINITY;
    if (af !== bf) return af - bf;
    return (a.joinedAt ?? 0) - (b.joinedAt ?? 0);
  });

  return (
    <div className="main">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 4px 18px",
        }}
      >
        <div className="breadcrumb">
          <span style={{ color: "var(--muted)" }}>race / {code}</span>
          <span className="sep">/</span>
          <strong>{trick?.name ?? room.trickId}</strong>
        </div>
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-soft)",
            padding: "8px 14px",
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--negative)",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          />
          {formatTime(timer.elapsedMs)}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "var(--bg-soft)",
            borderRadius: 24,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            minHeight: 480,
          }}
        >
          <div
            className="caps"
            style={{
              color: "var(--accent-deep)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Question {Math.min(mySolved + 1, room.questionCount)} /{" "}
              {room.questionCount}
            </span>
            <span style={{ color: "var(--muted)" }}>
              {done ? "Waiting for finish…" : "Solve to advance"}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              minHeight: 220,
            }}
          >
            {done ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: 18,
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                }}
              >
                You solved all {room.questionCount}.
              </div>
            ) : current ? (
              <DrillProblem prompt={current.prompt} />
            ) : (
              <div style={{ color: "var(--muted)" }}>No problem.</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              ref={inputRef}
              className="drill-input"
              style={{
                animation: shake ? "shakeX 0.32s ease" : undefined,
                borderColor: shake ? "var(--negative)" : undefined,
              }}
              placeholder="—"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
              inputMode="numeric"
              disabled={done}
              aria-label="Your answer"
            />
            <div
              style={{
                display: "flex",
                gap: 12,
                color: "var(--muted)",
                fontSize: 12,
                alignItems: "center",
              }}
            >
              <span>
                <span className="kbd">↵</span> submit
              </span>
              <span>fastest to {room.questionCount} wins</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            className="caps"
            style={{
              color: "var(--accent-deep)",
              padding: "4px 6px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Standings</span>
            <span style={{ color: "var(--muted)" }}>{lanes.length}</span>
          </div>
          {lanes.map(([uid, p]) => (
            <RoomLane
              key={uid}
              uid={uid}
              player={p}
              ownUid={user?.uid ?? ""}
              total={room.questionCount}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
