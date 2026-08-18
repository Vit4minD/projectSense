"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import { subscribeRoom } from "@/lib/firebase/rooms";

export type UseRoomState = {
  room: Room | null;
  loading: boolean;
};

export function useRoom(code: string | null): UseRoomState {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(code));

  useEffect(() => {
    if (!code) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setRoom(null);
    setLoading(true);

    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeRoom(code, (next) => {
        setRoom(next);
        setLoading(false);
      });
    } catch {
      // Subscription failed to attach; stop the loading state so the room
      // page can fall back to its "room not found" view.
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [code]);

  return { room, loading };
}
