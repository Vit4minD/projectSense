"use client";

import type { RefObject } from "react";
import type { ZetamacState } from "@/lib/types";

type Props = {
  state: ZetamacState;
  inputRef: RefObject<HTMLInputElement | null>;
  onInput: (v: string) => void;
};

const OP_SYMBOL: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

export function ZetamacBoard({ state, inputRef, onInput }: Props) {
  const secs = Math.ceil(state.secondsLeft);
  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");
  const symbol = OP_SYMBOL[state.current.op] ?? state.current.op;
  return (
    <>
      <div className="zeta-top">
        <div className="zeta-score-chip">Score {state.score}</div>
        <div className="zeta-timer-chip">
          <span className="dot" />
          {mm}:{ss}
        </div>
      </div>
      <div className="zeta-body">
        <div className="zeta-problem">
          <span className="zeta-operand">{state.current.a}</span>
          <span className="zeta-op">{symbol}</span>
          <span className="zeta-operand">{state.current.b}</span>
          <span className="zeta-equals">=</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="zeta-input"
            value={state.input}
            onChange={(e) => onInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Answer"
          />
        </div>
        <p className="zeta-hint">type to answer · auto-advances on correct</p>
      </div>
    </>
  );
}
