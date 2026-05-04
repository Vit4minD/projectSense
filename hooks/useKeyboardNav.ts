"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = {
  h: "/",
  p: "/profile",
  ",": "/settings",
  l: "/leaderboard",
  m: "/multiplayer",
  t: "/test",
  g: "/games",
};

/**
 * Single-key navigation shortcuts. Active when no input/textarea is focused so
 * typing answers in the drill never re-routes. Phase 1 only wires "/" and "," —
 * later phases enable the rest as their pages ship.
 */
export function useKeyboardNav() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      const dest = ROUTES[e.key.toLowerCase()];
      if (dest) {
        e.preventDefault();
        router.push(dest);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
