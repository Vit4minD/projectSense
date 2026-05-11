import { add, divide, fraction, format, multiply, subtract } from "mathjs";
import { makeRng, randInt } from "@/lib/drill/utils";
import { HANDS_24 } from "@/lib/games/hands24";
import type {
  TwentyFourMove,
  TwentyFourOperator,
  TwentyFourState,
} from "@/lib/types";

export const INITIAL_SECONDS = 60;
export const BONUS_SECONDS_ON_SOLVE = 5;
export const POINTS_PER_SOLVE = 5;

type FractionLike = ReturnType<typeof fraction>;

function isFractionLike(value: unknown): value is FractionLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "n" in value &&
    "d" in value &&
    "s" in value
  );
}

// Display a Fraction as "n/d" or "n" when denominator is 1. Mirrors the
// expected output of legacy `String(evalResult)` for integer outcomes while
// preserving exact ratios for fractional ones.
function formatValue(value: FractionLike): string {
  const ratio = format(value, { fraction: "ratio" });
  if (typeof ratio !== "string") return String(value);
  const slash = ratio.indexOf("/");
  if (slash < 0) return ratio;
  const denom = ratio.slice(slash + 1);
  if (denom === "1") return ratio.slice(0, slash);
  return ratio;
}

function parseValue(display: string): FractionLike | null {
  try {
    const f = fraction(display) as FractionLike;
    if (!isFractionLike(f)) return null;
    return f;
  } catch {
    return null;
  }
}

function rngForHand(seed: number, solvedCount: number): () => number {
  return makeRng((seed + solvedCount) >>> 0);
}

export function pickHand(
  rng: () => number,
): readonly [number, number, number, number] {
  const idx = randInt(rng, 0, HANDS_24.length - 1);
  return HANDS_24[idx];
}

function newHand(seed: number, solvedCount: number): string[] {
  const tuple = pickHand(rngForHand(seed, solvedCount));
  return tuple.map((n) => String(n));
}

export function initialState(seed: number): TwentyFourState {
  return {
    seed,
    hand: newHand(seed, 0),
    history: [],
    selected: [],
    operator: null,
    score: 0,
    solvedCount: 0,
    secondsLeft: INITIAL_SECONDS,
    status: "idle",
    startedAt: null,
  };
}

export function start(state: TwentyFourState, now: number): TwentyFourState {
  if (state.status !== "idle") return state;
  return { ...state, status: "running", startedAt: now };
}

export function selectNumber(
  state: TwentyFourState,
  index: number,
): TwentyFourState {
  if (index < 0 || index >= state.hand.length) return state;
  const current = state.selected;
  const existing = current.indexOf(index);
  if (existing >= 0) {
    const next = current.filter((i) => i !== index);
    return { ...state, selected: next };
  }
  if (current.length < 2) {
    return { ...state, selected: [...current, index] };
  }
  // Drop oldest (first) and append the new one.
  return { ...state, selected: [current[1], index] };
}

export function setOperator(
  state: TwentyFourState,
  op: TwentyFourOperator,
): TwentyFourState {
  return { ...state, operator: op };
}

function applyOp(
  a: FractionLike,
  op: TwentyFourOperator,
  b: FractionLike,
): FractionLike | null {
  try {
    let result: unknown;
    if (op === "+") result = add(a, b);
    else if (op === "-") result = subtract(a, b);
    else if (op === "*") result = multiply(a, b);
    else result = divide(a, b);
    if (!isFractionLike(result)) return null;
    return result;
  } catch {
    return null;
  }
}

export type AttemptOutcome =
  | "incomplete"
  | "evaluated"
  | "solved"
  | "invalid"
  | "ended";

export function attemptCombine(state: TwentyFourState): {
  state: TwentyFourState;
  outcome: AttemptOutcome;
} {
  if (state.status !== "running") {
    return { state, outcome: "ended" };
  }
  if (state.selected.length !== 2 || state.operator === null) {
    return { state, outcome: "incomplete" };
  }
  const [i, j] = state.selected;
  const aStr = state.hand[i];
  const bStr = state.hand[j];
  const a = parseValue(aStr);
  const b = parseValue(bStr);
  if (a === null || b === null) {
    return { state, outcome: "invalid" };
  }
  const result = applyOp(a, state.operator, b);
  if (result === null) {
    return { state, outcome: "invalid" };
  }
  const resultStr = formatValue(result);

  const move: TwentyFourMove = {
    a: aStr,
    op: state.operator,
    b: bStr,
    result: resultStr,
  };

  const removedSet = new Set<number>([i, j]);
  const nextHand = state.hand.filter((_, idx) => !removedSet.has(idx));
  nextHand.push(resultStr);

  const baseNext: TwentyFourState = {
    ...state,
    hand: nextHand,
    history: [...state.history, move],
    selected: [],
    operator: null,
  };

  if (nextHand.length === 1) {
    const lone = parseValue(nextHand[0]);
    const isTwentyFour =
      lone !== null && Number(lone.d) === 1 && Number(lone.s) * Number(lone.n) === 24;
    if (isTwentyFour) {
      const nextSolvedCount = state.solvedCount + 1;
      return {
        state: {
          ...baseNext,
          score: state.score + POINTS_PER_SOLVE,
          solvedCount: nextSolvedCount,
          secondsLeft: state.secondsLeft + BONUS_SECONDS_ON_SOLVE,
          hand: newHand(state.seed, nextSolvedCount),
          history: [],
        },
        outcome: "solved",
      };
    }
  }

  return { state: baseNext, outcome: "evaluated" };
}

export function skipHand(
  state: TwentyFourState,
  rng: () => number,
): TwentyFourState {
  const tuple = pickHand(rng);
  return {
    ...state,
    hand: tuple.map((n) => String(n)),
    history: [],
    selected: [],
    operator: null,
  };
}

export function resetSelection(state: TwentyFourState): TwentyFourState {
  if (state.history.length === 0) {
    return { ...state, selected: [], operator: null };
  }
  return {
    ...state,
    hand: newHand(state.seed, state.solvedCount),
    history: [],
    selected: [],
    operator: null,
  };
}

export function tick(state: TwentyFourState, deltaMs: number): TwentyFourState {
  if (state.status === "ended") {
    return state;
  }
  const remaining = Math.max(0, state.secondsLeft - deltaMs / 1000);
  if (remaining <= 0 && state.status === "running") {
    return { ...state, secondsLeft: 0, status: "ended" };
  }
  return { ...state, secondsLeft: remaining };
}
