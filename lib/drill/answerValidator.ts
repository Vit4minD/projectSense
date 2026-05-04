import { evaluate, fraction, Fraction } from "mathjs";

/**
 * Robust equality between a user's typed input and the expected answer.
 *
 * Strategy:
 *   1. Strip whitespace and commas; reject empty input.
 *   2. If `expected` is a string, attempt direct case-insensitive match — useful
 *      for tricks like "Roman numerals" or "MCMXCIV".
 *   3. Otherwise parse both sides via mathjs (handles "3/8", "0.375", "5e-2",
 *      mixed numbers as "1 1/2" rendered as "1+1/2", etc.) and compare as
 *      rationals when possible, else as floats within a small epsilon.
 *
 * Returns false on any parse error; never throws.
 */
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
      // Both rationals — compare cross-multiplication; Number() is safe because
      // mathjs returns small integers for parseable user input.
      const an = Number(a.s) * Number(a.n);
      const ad = Number(a.d);
      const bn = Number(b.s) * Number(b.n);
      const bd = Number(b.d);
      return an * bd === bn * ad;
    }
    const af = typeof a === "object" ? (Number(a.s) * Number(a.n)) / Number(a.d) : a;
    const bf = typeof b === "object" ? (Number(b.s) * Number(b.n)) / Number(b.d) : b;
    return Math.abs(af - bf) < 1e-9;
  } catch {
    return false;
  }
}

function parseFractionLike(raw: string): number | Fraction | null {
  if (!raw) return null;
  // "1_3/4" → "1+3/4"
  const normalized = raw.replace(/_/g, "+");
  // Try fraction first for exact rational comparison.
  try {
    const f = fraction(normalized) as Fraction;
    const n = Number(f.n);
    const d = Number(f.d);
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return f;
  } catch {
    // fall through to evaluate
  }
  try {
    const result = evaluate(normalized);
    if (typeof result === "number" && Number.isFinite(result)) return result;
  } catch {
    // fall through
  }
  return null;
}
