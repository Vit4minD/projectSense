import { describe, expect, it } from "vitest";
import { equals } from "@/lib/drill/answerValidator";

describe("answerValidator.equals", () => {
  it("matches plain integers", () => {
    expect(equals("528", 528)).toBe(true);
    expect(equals("528", 529)).toBe(false);
  });

  it("ignores commas in user input", () => {
    expect(equals("1,045", 1045)).toBe(true);
    expect(equals("12,345", 12345)).toBe(true);
  });

  it("ignores leading/trailing whitespace", () => {
    expect(equals("  47 ", 47)).toBe(true);
  });

  it("rejects empty input", () => {
    expect(equals("", 0)).toBe(false);
    expect(equals("   ", 5)).toBe(false);
  });

  it("matches decimals", () => {
    expect(equals("0.625", 0.625)).toBe(true);
    expect(equals(".625", 0.625)).toBe(true);
    expect(equals("0.624", 0.625)).toBe(false);
  });

  it("matches fractions to decimals", () => {
    expect(equals("5/8", 0.625)).toBe(true);
    expect(equals("3/4", 0.75)).toBe(true);
  });

  it("matches fractions to fractions", () => {
    expect(equals("1/2", "1/2")).toBe(true);
    expect(equals("2/4", "1/2")).toBe(true); // equivalent
  });

  it("falls back to exact string for non-numeric expected", () => {
    expect(equals("MCMXCIV", "MCMXCIV")).toBe(true);
    expect(equals("mcmxciv", "MCMXCIV")).toBe(true); // case-insensitive
    expect(equals("MCMXC", "MCMXCIV")).toBe(false);
  });

  it("does not throw on garbage input", () => {
    expect(equals("not a number", 5)).toBe(false);
    expect(equals("()@#", 5)).toBe(false);
  });

  it("handles negatives", () => {
    expect(equals("-7", -7)).toBe(true);
    expect(equals("- 7", -7)).toBe(true);
  });
});
