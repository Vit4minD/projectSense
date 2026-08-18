"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeRng } from "@/lib/drill/utils";
import {
  attemptCombine,
  initialState,
  resetSelection,
  selectNumber,
  setOperator,
  skipHand,
  start,
  tick,
} from "@/lib/games/twentyFour";
import { celebrateCorrect } from "@/lib/effects";
import { trackEvent } from "@/lib/firebase/analytics";
import type { TwentyFourOperator, TwentyFourState } from "@/lib/types";

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

type UseTwentyFour = {
  state: TwentyFourState;
  solveFlash: boolean;
  startGame: () => void;
  selectIndex: (i: number) => void;
  pickOperator: (op: TwentyFourOperator) => void;
  combine: () => void;
  skip: () => void;
  resetMoves: () => void;
  restart: () => void;
};

export function useTwentyFour(): UseTwentyFour {
  const [state, setState] = useState<TwentyFourState>(() => initialState(randomSeed()));
  const [solveFlash, setSolveFlash] = useState(false);
  const endedReportedRef = useRef(false);

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
      void trackEvent("game_completed", {
        game: "twenty_four",
        score: state.score,
        solved_count: state.solvedCount,
      });
    }
    if (state.status !== "ended") {
      endedReportedRef.current = false;
    }
  }, [state.status, state.score, state.solvedCount]);

  const startGame = useCallback(() => {
    void trackEvent("game_started", { game: "twenty_four" });
    setState((prev) => start(prev, Date.now()));
  }, []);

  const selectIndex = useCallback((i: number) => {
    setState((prev) => selectNumber(prev, i));
  }, []);

  const pickOperator = useCallback((op: TwentyFourOperator) => {
    setState((prev) => setOperator(prev, op));
  }, []);

  const combine = useCallback(() => {
    setState((prev) => {
      const { state: next, outcome } = attemptCombine(prev);
      if (outcome === "solved") {
        celebrateCorrect();
        setSolveFlash(true);
        window.setTimeout(() => setSolveFlash(false), 600);
      }
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setState((prev) => skipHand(prev, makeRng(randomSeed())));
  }, []);

  const resetMoves = useCallback(() => {
    setState((prev) => resetSelection(prev));
  }, []);

  const restart = useCallback(() => {
    setState(initialState(randomSeed()));
    setSolveFlash(false);
  }, []);

  return useMemo(
    () => ({ state, solveFlash, startGame, selectIndex, pickOperator, combine, skip, resetMoves, restart }),
    [state, solveFlash, startGame, selectIndex, pickOperator, combine, skip, resetMoves, restart],
  );
}
