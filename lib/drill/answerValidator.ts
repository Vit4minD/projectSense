import Fraction from "fraction.js";

/**
 * Robust equality between a user's typed input and the expected answer.
 *
 * Strategy:
 *   1. Strip whitespace and commas; reject empty input.
 *   2. If `expected` is a string, attempt direct case-insensitive match — useful
 *      for tricks like Roman numerals ("MCMXCIV"), base-N results, and mixed
 *      numbers, all of which are compared exactly.
 *   3. Otherwise parse both sides and compare as exact rationals when possible
 *      (fraction.js handles "3/8", "0.375", ".5", "-3/4", integers), else as
 *      floats within a small epsilon (scientific notation, long decimals).
 *
 * fraction.js is a ~8KB standalone dependency — far lighter on the client than
 * pulling the whole mathjs default instance into the drill/games routes.
 *
 * Returns false on any parse error; never throws.
 */
type Rational = { n: bigint; d: bigint; s: bigint };

export function equals(input: string, expected: number | string): boolean {
  const cleaned = input.replace(/\s+/g, "").replace(/,/g, "");
  if (!cleaned) return false;

  if (typeof expected === "string") {
    const expectedClean = expected.replace(/\s+/g, "").replace(/,/g, "");
    if (cleaned.toUpperCase() === expectedClean.toUpperCase()) return true;
    // Fall through and try numeric comparison in case it's a number-as-string.
  }

  const expectedNumStr = typeof expected === "number" ? String(expected) : expected;

  try {
    const a = parseFractionLike(cleaned);
    const b = parseFractionLike(expectedNumStr);
    if (a === null || b === null) return false;

    if (typeof a === "object" && typeof b === "object") {
      // Both rationals — exact cross-multiplication in BigInt (no float loss).
      return a.s * a.n * b.d === b.s * b.n * a.d;
    }
    const af = typeof a === "object" ? (Number(a.s) * Number(a.n)) / Number(a.d) : a;
    const bf = typeof b === "object" ? (Number(b.s) * Number(b.n)) / Number(b.d) : b;
    return Math.abs(af - bf) < 1e-9;
  } catch {
    return false;
  }
}

function parseFractionLike(raw: string): number | Rational | null {
  if (!raw) return null;
  // Exact rational first: integers, decimals, ".5", "-3/4", "n/d".
  try {
    const f = new Fraction(raw);
    return { n: BigInt(f.n), d: BigInt(f.d), s: BigInt(f.s) };
  } catch {
    // fall through to a plain numeric parse
  }
  const num = Number(raw);
  if (Number.isFinite(num)) return num;
  return null;
}
