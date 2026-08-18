"use client";

import { useCallback, useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import { subscribeRoom } from "@/lib/firebase/rooms";

export type UseRoomState = {
  room: Room | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
};

export function useRoom(code: string | null): UseRoomState {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(code));
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!code) {
      setRoom(null);
      setLoading(false);
      setError(null);
      return;
    }

    setRoom(null);
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeRoom(
        code,
        (next) => {
          setRoom(next);
          setError(null);
          setLoading(false);
        },
        (e) => {
          // Permission denied / network drop: surface it so the page can show a
          // retry affordance instead of spinning forever.
          setError(e);
          setLoading(false);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load room."));
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [code, attempt]);

  return { room, loading, error, retry };
}
