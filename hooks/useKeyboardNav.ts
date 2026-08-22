"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { appShortcutsBlocked } from "@/lib/keyboard";

const ROUTES: Record<string, string> = {
  h: "/",
  p: "/profile",
  l: "/leaderboard",
  m: "/multiplayer",
  t: "/test",
  g: "/games",
};

/**
 * Single-key navigation shortcuts. Active when no input/textarea is focused so
 * typing answers in the drill never re-routes, and only for un-modified keys so
 * browser shortcuts (Cmd/Ctrl+P print, Cmd/Ctrl+L address bar, etc.) still work.
 */
export function useKeyboardNav() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (appShortcutsBlocked(e)) return;
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
