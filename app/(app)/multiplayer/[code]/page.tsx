"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRoom } from "@/hooks/useRoom";
import { RoomLobby } from "@/components/sense/RoomLobby";
import { RoomRace } from "@/components/sense/RoomRace";
import { RoomEnded } from "@/components/sense/RoomEnded";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const code = (params.code ?? "").toUpperCase();
  const { room, loading } = useRoom(code || null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (loading || authLoading) {
    return (
      <div className="main">
        <p style={{ color: "var(--muted)", padding: 24 }}>Loading…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="main">
        <section className="hero">
          <div>
            <h1 className="hero-title">
              Room <em>not found</em>
            </h1>
            <p className="hero-sub">
              No room with code <span className="mono">{code}</span> exists, or
              it has already ended.
            </p>
            <div className="hero-cta">
              <button
                className="btn primary"
                type="button"
                onClick={() => router.push("/multiplayer")}
              >
                Back to multiplayer
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (room.state === "lobby") return <RoomLobby room={room} code={code} />;
  if (room.state === "racing") return <RoomRace room={room} code={code} />;
  return <RoomEnded room={room} code={code} />;
}
