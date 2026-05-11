"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import { subscribePublicRooms } from "@/lib/firebase/rooms";

export type PublicRoom = Room & { code: string };

export type UsePublicRoomsState = {
  rooms: PublicRoom[];
  loading: boolean;
};

export function usePublicRooms(): UsePublicRoomsState {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribePublicRooms((next) => {
      setRooms(next);
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return { rooms, loading };
}
