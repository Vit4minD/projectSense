"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import { subscribeRoom } from "@/lib/firebase/rooms";

export type UseRoomState = {
  room: Room | null;
  loading: boolean;
  error: Error | null;
};

export function useRoom(code: string | null): UseRoomState {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(code));
  const [error, setError] = useState<Error | null>(null);

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
      unsubscribe = subscribeRoom(code, (next) => {
        setRoom(next);
        setLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [code]);

  return { room, loading, error };
}
