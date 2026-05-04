"use client";

import { useEffect, useRef, useState } from "react";

export type TimerState = {
  elapsedMs: number;
  perQuestionMs: number[];
  start: () => void;
  markQuestion: () => void;
  stop: () => number;
  reset: () => void;
};

/**
 * High-resolution timer driven by requestAnimationFrame. Used for drill timing
 * where we need sub-100ms accuracy.
 *
 * Caller controls when to start, advance per-question, and stop. The hook
 * returns elapsed total + a per-question array (slices between markQuestion).
 */
export function useTimer(): TimerState {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [perQuestionMs, setPerQuestionMs] = useState<number[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const lastMarkRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const tick = (now: number) => {
    if (!runningRef.current || startedAtRef.current === null) return;
    setElapsedMs(now - startedAtRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    startedAtRef.current = performance.now();
    lastMarkRef.current = 0;
    setElapsedMs(0);
    setPerQuestionMs([]);
    rafRef.current = requestAnimationFrame(tick);
  };

  const markQuestion = () => {
    if (startedAtRef.current === null) return;
    const now = performance.now() - startedAtRef.current;
    setPerQuestionMs((arr) => [...arr, now - lastMarkRef.current]);
    lastMarkRef.current = now;
  };

  const stop = (): number => {
    runningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (startedAtRef.current === null) return 0;
    const final = performance.now() - startedAtRef.current;
    setElapsedMs(final);
    return final;
  };

  const reset = () => {
    runningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startedAtRef.current = null;
    lastMarkRef.current = 0;
    setElapsedMs(0);
    setPerQuestionMs([]);
  };

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return { elapsedMs, perQuestionMs, start, markQuestion, stop, reset };
}
