"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkAnswer,
  defaultZetamacConfig,
  initialState,
  setInput as setInputCore,
  start,
  tick,
  validateConfig,
} from "@/lib/games/zetamac";
import type { ZetamacConfig, ZetamacState } from "@/lib/types";

const CONFIG_KEY = "zetamac:config:v2";
const HIGHSCORE_KEY = "zetamac:highscore:v1";

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function loadConfig(): ZetamacConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultZetamacConfig();
    const parsed = JSON.parse(raw) as ZetamacConfig;
    const check = validateConfig(parsed);
    if (!check.ok) return defaultZetamacConfig();
    return parsed;
  } catch {
    return defaultZetamacConfig();
  }
}

function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

type UseZetamac = {
  state: ZetamacState;
  config: ZetamacConfig;
  highScore: number;
  configError: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  updateConfig: (next: ZetamacConfig) => void;
  resetConfig: () => void;
  startGame: () => void;
  setInputValue: (v: string) => void;
  restart: () => void;
  goToConfig: () => void;
};

export function useZetamac(): UseZetamac {
  const [config, setConfig] = useState<ZetamacConfig>(() => defaultZetamacConfig());
  const [state, setState] = useState<ZetamacState>(() => initialState(defaultZetamacConfig(), randomSeed()));
  const [highScore, setHighScore] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endedReportedRef = useRef(false);

  useEffect(() => {
    const loaded = loadConfig();
    setConfig(loaded);
    setState(initialState(loaded, randomSeed()));
    setHighScore(loadHighScore());
  }, []);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => {
      setState((prev) => tick(prev, 250));
    }, 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status === "ended" && !endedReportedRef.current) {
      endedReportedRef.current = true;
      const final = state.score;
      if (final > highScore) {
        setHighScore(final);
        try {
          localStorage.setItem(HIGHSCORE_KEY, String(final));
        } catch {
          // ignore
        }
      }
      console.log("[zetamac] completed", { score: final, highScore });
    }
    if (state.status !== "ended") {
      endedReportedRef.current = false;
    }
  }, [state.status, state.score, highScore]);

  const updateConfig = useCallback((next: ZetamacConfig) => {
    const check = validateConfig(next);
    if (!check.ok) {
      setConfigError(check.message);
      return;
    }
    setConfigError(null);
    setConfig(next);
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setState(initialState(next, randomSeed()));
  }, []);

  const resetConfig = useCallback(() => {
    updateConfig(defaultZetamacConfig());
  }, [updateConfig]);

  const startGame = useCallback(() => {
    setState((prev) => start(prev, Date.now()));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const setInputValue = useCallback((v: string) => {
    setState((prev) => {
      const withInput = setInputCore(prev, v);
      const { state: next, correct } = checkAnswer(withInput);
      return correct ? next : withInput;
    });
  }, []);

  const restart = useCallback(() => {
    setState(initialState(config, randomSeed()));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [config]);

  const goToConfig = useCallback(() => {
    setState(initialState(config, randomSeed()));
  }, [config]);

  return useMemo(
    () => ({
      state,
      config,
      highScore,
      configError,
      inputRef,
      updateConfig,
      resetConfig,
      startGame,
      setInputValue,
      restart,
      goToConfig,
    }),
    [state, config, highScore, configError, updateConfig, resetConfig, startGame, setInputValue, restart, goToConfig],
  );
}
