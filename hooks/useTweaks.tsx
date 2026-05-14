"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Tweaks } from "@/lib/types";

const STORAGE_KEY = "sense:tweaks";

const DEFAULTS: Tweaks = {
  theme: "sage",
  density: "comfortable",
  monoNumerals: false,
  soundEffects: true,
  haptics: true,
};

type TweaksContextValue = {
  tweaks: Tweaks;
  setTweaks: (next: Partial<Tweaks>) => void;
  visible: boolean;
  setVisible: (next: boolean) => void;
};

const TweaksContext = createContext<TweaksContextValue>({
  tweaks: DEFAULTS,
  setTweaks: () => {},
  visible: false,
  setVisible: () => {},
});

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaksState] = useState<Tweaks>(DEFAULTS);
  const [visible, setVisible] = useState(false);

  // Load on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Tweaks>;
        setTweaksState({ ...DEFAULTS, ...parsed });
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Reflect to <html data-*> attributes for the CSS to react to.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", tweaks.theme);
    root.setAttribute("data-mono-numerals", tweaks.monoNumerals ? "true" : "false");
    root.setAttribute("data-density", tweaks.density);
    root.setAttribute("data-sound", tweaks.soundEffects ? "on" : "off");
    root.setAttribute("data-haptics", tweaks.haptics ? "on" : "off");
  }, [tweaks]);

  const setTweaks = useCallback((next: Partial<Tweaks>) => {
    setTweaksState((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore quota errors
      }
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({ tweaks, setTweaks, visible, setVisible }),
    [tweaks, setTweaks, visible],
  );

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>;
}

export function useTweaks(): TweaksContextValue {
  return useContext(TweaksContext);
}
