import { describe, expect, it } from "vitest";
import { generate, supportedTrickIds } from "@/lib/drill/problemGenerator";
import { equals } from "@/lib/drill/answerValidator";
import { TRICKS } from "@/lib/data/tricks";

describe("problemGenerator", () => {
  it("supports every trick in TRICKS", () => {
    const supported = new Set(supportedTrickIds());
    for (const t of TRICKS) {
      expect(supported.has(t.id), `trick ${t.id} (${t.name}) needs a generator`).toBe(true);
    }
  });

  it("is deterministic given the same seed", () => {
    const a = generate("1", 42, 5);
    const b = generate("1", 42, 5);
    expect(a).toEqual(b);
  });

  it("returns different problems for different seeds", () => {
    const a = generate("1", 1, 5);
    const b = generate("1", 2, 5);
    expect(a).not.toEqual(b);
  });

  it("each generator produces valid problem objects across 10 seeds", () => {
    const ids = supportedTrickIds();
    for (const id of ids) {
      for (let seed = 0; seed < 10; seed++) {
        const problems = generate(id, seed, 5);
        expect(problems).toHaveLength(5);
        for (const p of problems) {
          expect(typeof p.prompt).toBe("string");
          expect(p.prompt.length).toBeGreaterThan(0);
          expect(["number", "string"]).toContain(typeof p.expected);
        }
      }
    }
  });

  it("expected answers self-validate via the answer validator", () => {
    // For each numeric expected value, calling equals(String(expected), expected)
    // must be true. Catches mismatches between generator output and validator parsing.
    // Coverage: 52 ids × 10 seeds × 5 problems = 2600 round-trips.
    const ids = supportedTrickIds();
    for (const id of ids) {
      for (let seed = 0; seed < 10; seed++) {
        const problems = generate(id, seed, 5);
        for (const p of problems) {
          const userInput = typeof p.expected === "number" ? String(p.expected) : p.expected;
          expect(
            equals(userInput, p.expected),
            `trick ${id} seed ${seed}: validator could not match "${userInput}" against expected ${p.expected}`,
          ).toBe(true);
        }
      }
    }
  });

  it("throws on unknown trick id", () => {
    expect(() => generate("999", 0)).toThrow();
  });
});
