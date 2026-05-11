import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  checkAnswer,
  defaultZetamacConfig,
  initialState,
  nextProblem,
  setInput,
  start,
  tick,
  validateConfig,
} from "@/lib/games/zetamac";
import { makeRng } from "@/lib/drill/utils";
import type { ZetamacConfig, ZetamacRange } from "@/lib/types";

describe("defaultZetamacConfig", () => {
  it("returns independent objects (mutating one does not affect another)", () => {
    const a = defaultZetamacConfig();
    const b = defaultZetamacConfig();
    (a.addRange as unknown as [number, number])[0] = 999;
    (a.operators as unknown as string[]).push("+");
    a.durationSeconds = 5;
    expect(b.addRange[0]).toBe(DEFAULT_CONFIG.addRange[0]);
    expect(b.operators.length).toBe(DEFAULT_CONFIG.operators.length);
    expect(b.durationSeconds).toBe(DEFAULT_CONFIG.durationSeconds);
  });

  it("matches the documented defaults", () => {
    const c = defaultZetamacConfig();
    expect(c.operators).toEqual(["+", "-", "*", "/"]);
    expect(c.durationSeconds).toBe(120);
    expect(c.addRange).toEqual([2, 100]);
    expect(c.subRange).toEqual([2, 100]);
    expect(c.mulARange).toEqual([2, 12]);
    expect(c.mulBRange).toEqual([2, 12]);
    expect(c.divDivisorRange).toEqual([2, 12]);
    expect(c.divQuotientRange).toEqual([2, 12]);
  });
});

describe("validateConfig", () => {
  it("accepts the default config", () => {
    expect(validateConfig(defaultZetamacConfig())).toEqual({ ok: true });
  });

  it("rejects zero operators", () => {
    const c = defaultZetamacConfig();
    const broken: ZetamacConfig = { ...c, operators: [] };
    const result = validateConfig(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects duration 10 (too low)", () => {
    const c = defaultZetamacConfig();
    const result = validateConfig({ ...c, durationSeconds: 10 });
    expect(result.ok).toBe(false);
  });

  it("rejects duration 1000 (too high)", () => {
    const c = defaultZetamacConfig();
    const result = validateConfig({ ...c, durationSeconds: 1000 });
    expect(result.ok).toBe(false);
  });

  it("rejects range with min > max", () => {
    const c = defaultZetamacConfig();
    const bad: ZetamacRange = [50, 5] as const;
    const result = validateConfig({ ...c, addRange: bad });
    expect(result.ok).toBe(false);
  });

  it("rejects range with min < 1", () => {
    const c = defaultZetamacConfig();
    const bad: ZetamacRange = [0, 10] as const;
    const result = validateConfig({ ...c, mulARange: bad });
    expect(result.ok).toBe(false);
  });

  it("rejects range with max > 9999", () => {
    const c = defaultZetamacConfig();
    const bad: ZetamacRange = [2, 10000] as const;
    const result = validateConfig({ ...c, mulBRange: bad });
    expect(result.ok).toBe(false);
  });
});

describe("nextProblem", () => {
  it("is deterministic for the same seed + config", () => {
    const config = defaultZetamacConfig();
    const r1 = makeRng(42);
    const r2 = makeRng(42);
    const sequenceA = Array.from({ length: 20 }, () => nextProblem(r1, config));
    const sequenceB = Array.from({ length: 20 }, () => nextProblem(r2, config));
    expect(sequenceA).toEqual(sequenceB);
  });

  it("addition: both operands in addRange and answer = a + b", () => {
    const config: ZetamacConfig = { ...defaultZetamacConfig(), operators: ["+"] };
    const rng = makeRng(7);
    for (let i = 0; i < 200; i++) {
      const p = nextProblem(rng, config);
      expect(p.op).toBe("+");
      expect(p.a).toBeGreaterThanOrEqual(config.addRange[0]);
      expect(p.a).toBeLessThanOrEqual(config.addRange[1]);
      expect(p.b).toBeGreaterThanOrEqual(config.addRange[0]);
      expect(p.b).toBeLessThanOrEqual(config.addRange[1]);
      expect(p.answer).toBe(p.a + p.b);
    }
  });

  it("subtraction: answer is always non-negative over 200 iterations", () => {
    const config: ZetamacConfig = { ...defaultZetamacConfig(), operators: ["-"] };
    const rng = makeRng(13);
    for (let i = 0; i < 200; i++) {
      const p = nextProblem(rng, config);
      expect(p.op).toBe("-");
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeGreaterThanOrEqual(p.b);
      expect(p.answer).toBe(p.a - p.b);
    }
  });

  it("multiplication: a in [2,12], b in [2,12], answer = a * b", () => {
    const config: ZetamacConfig = { ...defaultZetamacConfig(), operators: ["*"] };
    const rng = makeRng(99);
    for (let i = 0; i < 200; i++) {
      const p = nextProblem(rng, config);
      expect(p.op).toBe("*");
      expect(p.a).toBeGreaterThanOrEqual(2);
      expect(p.a).toBeLessThanOrEqual(12);
      expect(p.b).toBeGreaterThanOrEqual(2);
      expect(p.b).toBeLessThanOrEqual(12);
      expect(p.answer).toBe(p.a * p.b);
    }
  });

  it("division: answer = quotient in [2,12], a / b = quotient exactly", () => {
    const config: ZetamacConfig = { ...defaultZetamacConfig(), operators: ["/"] };
    const rng = makeRng(123);
    for (let i = 0; i < 200; i++) {
      const p = nextProblem(rng, config);
      expect(p.op).toBe("/");
      expect(p.answer).toBeGreaterThanOrEqual(2);
      expect(p.answer).toBeLessThanOrEqual(12);
      expect(p.b).toBeGreaterThanOrEqual(2);
      expect(p.b).toBeLessThanOrEqual(12);
      expect(p.a % p.b).toBe(0);
      expect(p.a / p.b).toBe(p.answer);
    }
  });
});

describe("initialState", () => {
  it("creates an idle state with the initial problem and full timer", () => {
    const config = defaultZetamacConfig();
    const s = initialState(config, 1);
    expect(s.status).toBe("idle");
    expect(s.score).toBe(0);
    expect(s.input).toBe("");
    expect(s.secondsLeft).toBe(config.durationSeconds);
    expect(s.startedAt).toBeNull();
    expect(s.current).toBeDefined();
    expect(typeof s.current.answer).toBe("number");
  });
});

describe("start", () => {
  it("transitions idle -> running and stamps startedAt", () => {
    const s = initialState(defaultZetamacConfig(), 1);
    const started = start(s, 1234);
    expect(started.status).toBe("running");
    expect(started.startedAt).toBe(1234);
  });

  it("is a no-op when already running or ended", () => {
    const s = start(initialState(defaultZetamacConfig(), 1), 1000);
    const again = start(s, 2000);
    expect(again).toBe(s);

    const ended: typeof s = { ...s, status: "ended" };
    const tried = start(ended, 3000);
    expect(tried).toBe(ended);
  });
});

describe("setInput", () => {
  it("updates input without checking the answer", () => {
    const s = start(initialState(defaultZetamacConfig(), 1), 0);
    const next = setInput(s, "42");
    expect(next.input).toBe("42");
    expect(next.score).toBe(s.score);
    expect(next.current).toEqual(s.current);
  });
});

describe("checkAnswer", () => {
  it("correct: increments score, generates a new problem, clears input", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const s1 = setInput(s0, String(s0.current.answer));
    const result = checkAnswer(s1);
    expect(result.correct).toBe(true);
    expect(result.state.score).toBe(1);
    expect(result.state.input).toBe("");
    expect(result.state.current).not.toEqual(s0.current);
  });

  it("wrong: returns correct=false and does not change score or problem", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const wrong = String(s0.current.answer + 1);
    const s1 = setInput(s0, wrong);
    const result = checkAnswer(s1);
    expect(result.correct).toBe(false);
    expect(result.state).toBe(s1);
    expect(result.state.input).toBe(wrong);
    expect(result.state.score).toBe(0);
    expect(result.state.current).toEqual(s0.current);
  });

  it("non-numeric: returns correct=false with no state change", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const s1 = setInput(s0, "abc");
    const result = checkAnswer(s1);
    expect(result.correct).toBe(false);
    expect(result.state).toBe(s1);
  });

  it("empty input: returns correct=false with no state change", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const result = checkAnswer(s0);
    expect(result.correct).toBe(false);
    expect(result.state).toBe(s0);
  });

  it("no-op when status is not running (idle)", () => {
    const s = setInput(initialState(defaultZetamacConfig(), 1), String(0));
    const result = checkAnswer(s);
    expect(result.correct).toBe(false);
    expect(result.state).toBe(s);
  });

  it("no-op when status is ended", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const ended = tick(s0, s0.config.durationSeconds * 1000);
    expect(ended.status).toBe("ended");
    const tried = setInput(ended, String(s0.current.answer));
    const result = checkAnswer(tried);
    expect(result.correct).toBe(false);
    expect(result.state).toBe(tried);
  });
});

describe("tick", () => {
  it("decrements secondsLeft and ends the game at 0", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const half = tick(s0, 1000);
    expect(half.secondsLeft).toBe(s0.secondsLeft - 1);
    expect(half.status).toBe("running");
    const done = tick(s0, s0.config.durationSeconds * 1000);
    expect(done.secondsLeft).toBe(0);
    expect(done.status).toBe("ended");
  });

  it("stays at 0 once ended", () => {
    const s0 = start(initialState(defaultZetamacConfig(), 1), 0);
    const done = tick(s0, s0.config.durationSeconds * 1000);
    const again = tick(done, 5000);
    expect(again.secondsLeft).toBe(0);
    expect(again.status).toBe("ended");
  });
});
