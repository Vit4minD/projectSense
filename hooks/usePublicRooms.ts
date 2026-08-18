"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribePublicRooms, type RoomIndexEntry } from "@/lib/firebase/rooms";

export type PublicRoom = RoomIndexEntry;

export type UsePublicRoomsState = {
  rooms: PublicRoom[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
};

export function usePublicRooms(): UsePublicRoomsState {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribePublicRooms(
        (next) => {
          setRooms(next);
          setError(null);
          setLoading(false);
        },
        (e) => {
          setError(e);
          setLoading(false);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load rooms."));
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [attempt]);

  return { rooms, loading, error, retry };
}
