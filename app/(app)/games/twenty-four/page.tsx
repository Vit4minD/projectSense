"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, RotateCcw, SkipForward } from "lucide-react";
import { TwentyFourBoard } from "@/components/sense/TwentyFourBoard";
import { useTwentyFour } from "@/hooks/useTwentyFour";
import type { TwentyFourOperator } from "@/lib/types";

const OPS: TwentyFourOperator[] = ["+", "-", "*", "/"];
const OP_LABEL: Record<TwentyFourOperator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

export default function TwentyFourPage() {
  const router = useRouter();
  const {
    state,
    solveFlash,
    startGame,
    selectIndex,
    pickOperator,
    skip,
    resetMoves,
    restart,
  } = useTwentyFour();

  useEffect(() => {
    if (state.status !== "running") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key;
      if (k >= "1" && k <= "4") {
        const idx = parseInt(k, 10) - 1;
        if (idx < state.hand.length) selectIndex(idx);
        e.preventDefault();
      } else if (k === "+") {
        pickOperator("+");
        e.preventDefault();
      } else if (k === "-") {
        pickOperator("-");
        e.preventDefault();
      } else if (k === "*" || k === "x" || k === "X") {
        pickOperator("*");
        e.preventDefault();
      } else if (k === "/") {
        pickOperator("/");
        e.preventDefault();
      } else if (k === "Backspace") {
        resetMoves();
        e.preventDefault();
      } else if (k === "Escape") {
        skip();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.status, state.hand.length, selectIndex, pickOperator, resetMoves, skip]);

  const secs = Math.ceil(state.secondsLeft);
  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");

  return (
    <div className="t24-shell">
      <div className="t24-top">
        <button type="button" className="t24-home-btn" onClick={() => router.push("/games")} aria-label="Back to games">
          <Home size={16} />
        </button>
        <div className="t24-score">Score {state.score}</div>
        <div className="t24-timer-chip">
          <span className="dot" />
          {mm}:{ss}
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="t24-skip-btn" onClick={skip} title="Skip hand (Esc)">
          <SkipForward size={14} /> Skip
        </button>
      </div>

      <div className="t24-body">
        <h1 className="t24-title">24</h1>
        <TwentyFourBoard state={state} solveFlash={solveFlash} onSelect={selectIndex} />
        {state.history.length > 0 && (
          <div className="t24-history">
            {state.history.map((m, i) => (
              <span key={i} className="t24-history-chip">
                {m.a} {OP_LABEL[m.op]} {m.b} = {m.result}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="t24-ops">
        {OPS.map((op) => (
          <button
            key={op}
            type="button"
            className={`t24-op ${state.operator === op ? "selected" : ""}`}
            onClick={() => pickOperator(op)}
            aria-label={`Operator ${OP_LABEL[op]}`}
          >
            {OP_LABEL[op]}
          </button>
        ))}
        <button
          type="button"
          className="t24-combine"
          onClick={resetMoves}
          title="Reset (Backspace)"
          aria-label="Reset"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {state.status === "idle" && (
        <div className="t24-start-overlay">
          <div className="t24-modal-card">
            <h2>Twenty-Four</h2>
            <p>
              Combine the 4 numbers with +, −, ×, ÷ to make 24. Solve as many as you can in 60s. Each
              solve adds 5 seconds.
            </p>
            <p className="t24-modal-keys">
              Keyboard: 1–4 select · +, −, *, / operator (auto-combines) · Backspace reset · Esc skip
            </p>
            <button type="button" className="t24-modal-btn primary" onClick={startGame}>
              Start
            </button>
          </div>
        </div>
      )}

      {state.status === "ended" && (
        <div className="t24-end-modal">
          <div className="t24-modal-card">
            <h2>Time&apos;s up</h2>
            <div className="t24-final-score">{state.score}</div>
            <p>{state.solvedCount} hand{state.solvedCount === 1 ? "" : "s"} solved</p>
            <div className="t24-modal-actions">
              <button type="button" className="t24-modal-btn primary" onClick={restart}>
                Play again
              </button>
              <button type="button" className="t24-modal-btn" onClick={() => router.push("/games")}>
                Back to games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
