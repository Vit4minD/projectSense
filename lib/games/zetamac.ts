import { makeRng, randInt } from "@/lib/drill/utils";
import type {
  ZetamacConfig,
  ZetamacOperator,
  ZetamacProblem,
  ZetamacRange,
  ZetamacState,
} from "@/lib/types";

export const DEFAULT_CONFIG: ZetamacConfig = {
  operators: ["+", "-", "*", "/"],
  durationSeconds: 120,
  addRange: [2, 100],
  subRange: [2, 100],
  mulARange: [2, 12],
  mulBRange: [2, 12],
  divDivisorRange: [2, 12],
  divQuotientRange: [2, 12],
};

function cloneRange(r: ZetamacRange): ZetamacRange {
  return [r[0], r[1]] as const;
}

export function defaultZetamacConfig(): ZetamacConfig {
  return {
    operators: [...DEFAULT_CONFIG.operators],
    durationSeconds: DEFAULT_CONFIG.durationSeconds,
    addRange: cloneRange(DEFAULT_CONFIG.addRange),
    subRange: cloneRange(DEFAULT_CONFIG.subRange),
    mulARange: cloneRange(DEFAULT_CONFIG.mulARange),
    mulBRange: cloneRange(DEFAULT_CONFIG.mulBRange),
    divDivisorRange: cloneRange(DEFAULT_CONFIG.divDivisorRange),
    divQuotientRange: cloneRange(DEFAULT_CONFIG.divQuotientRange),
  };
}

function isValidRange(r: ZetamacRange): boolean {
  const [lo, hi] = r;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return false;
  if (lo > hi) return false;
  if (lo < 1 || hi < 1) return false;
  if (lo > 9999 || hi > 9999) return false;
  return true;
}

export function validateConfig(
  config: ZetamacConfig,
): { ok: true } | { ok: false; message: string } {
  if (!config.operators || config.operators.length < 1) {
    return { ok: false, message: "At least one operator is required." };
  }
  const d = config.durationSeconds;
  if (!Number.isInteger(d) || d < 30 || d > 900) {
    return { ok: false, message: "Duration must be an integer between 30 and 900 seconds." };
  }
  const ranges: Array<[string, ZetamacRange]> = [
    ["addRange", config.addRange],
    ["subRange", config.subRange],
    ["mulARange", config.mulARange],
    ["mulBRange", config.mulBRange],
    ["divDivisorRange", config.divDivisorRange],
    ["divQuotientRange", config.divQuotientRange],
  ];
  for (const [name, range] of ranges) {
    if (!isValidRange(range)) {
      return { ok: false, message: `${name} is invalid: must have 1 <= min <= max <= 9999.` };
    }
  }
  return { ok: true };
}

export function nextProblem(rng: () => number, config: ZetamacConfig): ZetamacProblem {
  const ops = config.operators;
  const op: ZetamacOperator = ops[Math.floor(rng() * ops.length)];

  if (op === "+") {
    const a = randInt(rng, config.addRange[0], config.addRange[1]);
    const b = randInt(rng, config.addRange[0], config.addRange[1]);
    return { a, op, b, answer: a + b };
  }
  if (op === "-") {
    let a = randInt(rng, config.subRange[0], config.subRange[1]);
    let b = randInt(rng, config.subRange[0], config.subRange[1]);
    if (a < b) [a, b] = [b, a];
    return { a, op, b, answer: a - b };
  }
  if (op === "*") {
    const a = randInt(rng, config.mulARange[0], config.mulARange[1]);
    const b = randInt(rng, config.mulBRange[0], config.mulBRange[1]);
    return { a, op, b, answer: a * b };
  }
  const divisor = randInt(rng, config.divDivisorRange[0], config.divDivisorRange[1]);
  const quotient = randInt(rng, config.divQuotientRange[0], config.divQuotientRange[1]);
  return { a: divisor * quotient, op, b: divisor, answer: quotient };
}

function rngForScore(seed: number, score: number): () => number {
  return makeRng((seed + score * 0x9e3779b1) >>> 0);
}

export function initialState(config: ZetamacConfig, seed: number): ZetamacState {
  const rng = rngForScore(seed, 0);
  return {
    config,
    seed,
    current: nextProblem(rng, config),
    input: "",
    score: 0,
    secondsLeft: config.durationSeconds,
    status: "idle",
    startedAt: null,
  };
}

export function start(state: ZetamacState, now: number): ZetamacState {
  if (state.status !== "idle") return state;
  return { ...state, status: "running", startedAt: now };
}

export function setInput(state: ZetamacState, input: string): ZetamacState {
  return { ...state, input };
}

export function checkAnswer(
  state: ZetamacState,
): { state: ZetamacState; correct: boolean } {
  if (state.status !== "running") {
    return { state, correct: false };
  }
  const trimmed = state.input.trim();
  if (trimmed === "") {
    return { state, correct: false };
  }
  const parsed = parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return { state, correct: false };
  }
  if (parsed !== state.current.answer) {
    return { state, correct: false };
  }
  const nextScore = state.score + 1;
  const rng = rngForScore(state.seed, nextScore);
  return {
    state: {
      ...state,
      score: nextScore,
      current: nextProblem(rng, state.config),
      input: "",
    },
    correct: true,
  };
}

export function tick(state: ZetamacState, deltaMs: number): ZetamacState {
  const remaining = Math.max(0, state.secondsLeft - deltaMs / 1000);
  if (remaining <= 0 && state.status === "running") {
    return { ...state, secondsLeft: 0, status: "ended" };
  }
  if (remaining <= 0 && state.status === "ended") {
    return { ...state, secondsLeft: 0 };
  }
  return { ...state, secondsLeft: remaining };
}
