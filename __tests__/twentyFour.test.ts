import { describe, expect, it } from "vitest";
import { HANDS_24 } from "@/lib/games/hands24";
import {
  BONUS_SECONDS_ON_SOLVE,
  INITIAL_SECONDS,
  POINTS_PER_SOLVE,
  attemptCombine,
  initialState,
  pickHand,
  resetSelection,
  selectNumber,
  setOperator,
  skipHand,
  start,
  tick,
} from "@/lib/games/twentyFour";
import { makeRng } from "@/lib/drill/utils";

// Seed sourced empirically: pickHand(makeRng(7723)) returns [6,6,6,6].
const SIX_SEED = 7723;

describe("HANDS_24", () => {
  it("contains the full set of legacy solvable hands", () => {
    // Legacy worktree-analytics/app/twenty-four/dict.ts has 1362 entries.
    // The phase-3 spec mentioned 681, but the legacy source has 1362 unique
    // multisets and that is what gets ported here.
    expect(HANDS_24.length).toBe(1362);
  });

  it("each entry is a 4-tuple of integers in [1,13]", () => {
    for (const tuple of HANDS_24) {
      expect(tuple).toHaveLength(4);
      for (const n of tuple) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(13);
      }
    }
  });

  it("has no duplicate multisets", () => {
    const seen = new Set<string>();
    for (const tuple of HANDS_24) {
      const key = [...tuple].sort((a, b) => a - b).join(",");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("pickHand", () => {
  it("is deterministic for a given seed", () => {
    const a = pickHand(makeRng(123));
    const b = pickHand(makeRng(123));
    expect(a).toEqual(b);
  });

  it("returns a tuple drawn from HANDS_24", () => {
    const tuple = pickHand(makeRng(42));
    expect(HANDS_24).toContainEqual(tuple);
  });
});

describe("initialState", () => {
  it("is deterministic for a given seed", () => {
    const a = initialState(SIX_SEED);
    const b = initialState(SIX_SEED);
    expect(a).toEqual(b);
  });

  it("sets the expected defaults", () => {
    const s = initialState(SIX_SEED);
    expect(s.hand).toEqual(["6", "6", "6", "6"]);
    expect(s.history).toEqual([]);
    expect(s.selected).toEqual([]);
    expect(s.operator).toBeNull();
    expect(s.score).toBe(0);
    expect(s.solvedCount).toBe(0);
    expect(s.secondsLeft).toBe(INITIAL_SECONDS);
    expect(s.status).toBe("idle");
    expect(s.startedAt).toBeNull();
  });
});

describe("start", () => {
  it("transitions idle to running and records startedAt", () => {
    const s = initialState(SIX_SEED);
    const t = start(s, 1000);
    expect(t.status).toBe("running");
    expect(t.startedAt).toBe(1000);
  });

  it("is a no-op when already running or ended", () => {
    const running = start(initialState(SIX_SEED), 1000);
    expect(start(running, 2000)).toBe(running);
  });
});

describe("selectNumber", () => {
  it("toggles a single selection", () => {
    const s = start(initialState(SIX_SEED), 0);
    const a = selectNumber(s, 0);
    expect(a.selected).toEqual([0]);
    const b = selectNumber(a, 0);
    expect(b.selected).toEqual([]);
  });

  it("allows two selections, then drops the oldest on a third", () => {
    const s = start(initialState(SIX_SEED), 0);
    const a = selectNumber(s, 0);
    const b = selectNumber(a, 1);
    expect(b.selected).toEqual([0, 1]);
    const c = selectNumber(b, 2);
    expect(c.selected).toEqual([1, 2]);
  });

  it("preserves operator across selection changes", () => {
    const s = setOperator(start(initialState(SIX_SEED), 0), "+");
    const a = selectNumber(s, 0);
    expect(a.operator).toBe("+");
    const b = selectNumber(a, 1);
    expect(b.operator).toBe("+");
  });
});

describe("setOperator", () => {
  it("replaces an existing operator", () => {
    const s = start(initialState(SIX_SEED), 0);
    const a = setOperator(s, "+");
    expect(a.operator).toBe("+");
    const b = setOperator(a, "*");
    expect(b.operator).toBe("*");
  });
});

describe("attemptCombine", () => {
  it("returns 'incomplete' if operator or selection is missing", () => {
    const s = start(initialState(SIX_SEED), 0);
    const r1 = attemptCombine(s);
    expect(r1.outcome).toBe("incomplete");
    expect(r1.state).toBe(s);

    const withOp = setOperator(s, "+");
    const r2 = attemptCombine(withOp);
    expect(r2.outcome).toBe("incomplete");

    const oneSelected = selectNumber(withOp, 0);
    const r3 = attemptCombine(oneSelected);
    expect(r3.outcome).toBe("incomplete");
  });

  it("returns 'ended' if the game is not running", () => {
    const s = initialState(SIX_SEED);
    const r = attemptCombine(s);
    expect(r.outcome).toBe("ended");
  });

  it("evaluates a single combine on [6,6,6,6] with '+'", () => {
    const s = start(initialState(SIX_SEED), 0);
    const a = setOperator(selectNumber(selectNumber(s, 0), 1), "+");
    const r = attemptCombine(a);
    expect(r.outcome).toBe("evaluated");
    expect(r.state.hand).toEqual(["6", "6", "12"]);
    expect(r.state.selected).toEqual([]);
    expect(r.state.operator).toBeNull();
    expect(r.state.history).toHaveLength(1);
  });

  it("reaches 24 on [6,6,6,6] via three additions and reports 'solved'", () => {
    let s = start(initialState(SIX_SEED), 0);
    // 6 + 6 = 12  →  ["6", "6", "12"]
    s = attemptCombine(setOperator(selectNumber(selectNumber(s, 0), 1), "+")).state;
    expect(s.hand).toEqual(["6", "6", "12"]);
    // 6 + 6 = 12  →  ["12", "12"]
    s = attemptCombine(setOperator(selectNumber(selectNumber(s, 0), 1), "+")).state;
    expect(s.hand).toEqual(["12", "12"]);
    // 12 + 12 = 24  →  solved
    const finalAttempt = attemptCombine(
      setOperator(selectNumber(selectNumber(s, 0), 1), "+"),
    );
    expect(finalAttempt.outcome).toBe("solved");
    expect(finalAttempt.state.score).toBe(POINTS_PER_SOLVE);
    expect(finalAttempt.state.solvedCount).toBe(1);
    expect(finalAttempt.state.secondsLeft).toBe(
      INITIAL_SECONDS + BONUS_SECONDS_ON_SOLVE,
    );
    expect(finalAttempt.state.history).toEqual([]);
    expect(finalAttempt.state.hand).toHaveLength(4);
  });

  it("returns 'invalid' on division by zero", () => {
    // Stub a state with literal "0" entries so divide-by-zero is reachable.
    const base = start(initialState(SIX_SEED), 0);
    const zeroState = {
      ...base,
      hand: ["0", "0", "0", "0"],
      selected: [0, 1],
      operator: "/" as const,
    };
    const r = attemptCombine(zeroState);
    expect(r.outcome).toBe("invalid");
    expect(r.state).toBe(zeroState);
  });

  it("evaluates without reaching 24 yields 'evaluated' even when hand is length 1", () => {
    const base = start(initialState(SIX_SEED), 0);
    const twoState = {
      ...base,
      hand: ["10", "10"],
      selected: [0, 1],
      operator: "+" as const,
    };
    const r = attemptCombine(twoState);
    expect(r.outcome).toBe("evaluated");
    expect(r.state.hand).toEqual(["20"]);
    expect(r.state.score).toBe(0);
    expect(r.state.solvedCount).toBe(0);
  });

  it("preserves fractional results as ratios", () => {
    const base = start(initialState(SIX_SEED), 0);
    const fractionState = {
      ...base,
      hand: ["1", "3", "9", "9"],
      selected: [0, 1],
      operator: "/" as const,
    };
    const r = attemptCombine(fractionState);
    expect(r.outcome).toBe("evaluated");
    expect(r.state.hand).toEqual(["9", "9", "1/3"]);
  });
});

describe("skipHand", () => {
  it("replaces the hand and clears selection/operator/history", () => {
    let s = start(initialState(SIX_SEED), 0);
    s = setOperator(selectNumber(s, 0), "+");
    const next = skipHand(s, makeRng(42));
    expect(next.selected).toEqual([]);
    expect(next.operator).toBeNull();
    expect(next.history).toEqual([]);
    expect(next.hand).toHaveLength(4);
    expect(next.score).toBe(s.score);
  });
});

describe("resetSelection", () => {
  it("clears selection and operator when history is empty", () => {
    const s = setOperator(selectNumber(start(initialState(SIX_SEED), 0), 0), "+");
    const r = resetSelection(s);
    expect(r.selected).toEqual([]);
    expect(r.operator).toBeNull();
    expect(r.hand).toEqual(s.hand);
  });

  it("restores the original hand after a combine", () => {
    let s = start(initialState(SIX_SEED), 0);
    s = attemptCombine(
      setOperator(selectNumber(selectNumber(s, 0), 1), "+"),
    ).state;
    expect(s.hand).toEqual(["6", "6", "12"]);
    const r = resetSelection(s);
    expect(r.hand).toEqual(["6", "6", "6", "6"]);
    expect(r.history).toEqual([]);
    expect(r.selected).toEqual([]);
    expect(r.operator).toBeNull();
  });
});

describe("tick", () => {
  it("decrements secondsLeft by deltaMs / 1000", () => {
    const s = start(initialState(SIX_SEED), 0);
    const a = tick(s, 30_000);
    expect(a.secondsLeft).toBe(30);
    expect(a.status).toBe("running");
  });

  it("transitions to 'ended' and floors at 0 when time runs out", () => {
    let s = start(initialState(SIX_SEED), 0);
    s = tick(s, 30_000);
    const b = tick(s, 35_000);
    expect(b.secondsLeft).toBe(0);
    expect(b.status).toBe("ended");
  });

  it("does not change an ended state", () => {
    let s = start(initialState(SIX_SEED), 0);
    s = tick(s, 70_000);
    expect(s.status).toBe("ended");
    expect(s.secondsLeft).toBe(0);
    const b = tick(s, 1000);
    expect(b).toBe(s);
  });
});
