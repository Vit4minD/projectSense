import type { GeneratedProblem } from "@/lib/types";
import { makeRng, randInt } from "./utils";

/**
 * Per-trick problem generators. Each returns a single (prompt, expected) pair.
 *
 * Prompts use Unicode operators (×, ÷, −, ²) that match the design's typography
 * exactly. The drill UI replaces standalone "×", "÷", "−" tokens with styled
 * <span class="op"> wrappers, and superscripts ² render as <sup>.
 *
 * `expected` is a number for arithmetic problems and a string for shape-based
 * answers (Roman numerals, etc.). The answer validator handles both.
 *
 * Coverage note: every trick id in TRICKS has a generator. For tricks 36-43
 * (word problems / misc) the generator is intentionally simple — Phase 1 ships
 * a usable baseline; Phase 2 will refine difficulty curves.
 */

type Generator = (rng: () => number) => GeneratedProblem;

const ROMAN_PAIRS: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
function toRoman(n: number): string {
  let out = "";
  let remaining = n;
  for (const [v, s] of ROMAN_PAIRS) {
    while (remaining >= v) {
      out += s;
      remaining -= v;
    }
  }
  return out;
}
function fromRoman(s: string): number {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAN_PAIRS.find(([, sym]) => sym === s[i])?.[0] ?? 0;
    const next = ROMAN_PAIRS.find(([, sym]) => sym === s[i + 1])?.[0] ?? 0;
    total += next > cur ? -cur : cur;
  }
  return total;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}
function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

const GENERATORS: Record<string, Generator> = {
  // 01 — Multiplying by 11 (n in 10..99)
  "01": (r) => {
    const n = randInt(r, 12, 99);
    return { prompt: `${n} × 11`, expected: n * 11 };
  },
  // 02 — Squaring numbers ending in 5
  "02": (r) => {
    const n = randInt(r, 1, 9) * 10 + 5;
    return { prompt: `${n}²`, expected: n * n };
  },
  // 03 — Multiplying two 2-digits near 100
  "03": (r) => {
    const a = randInt(r, 90, 99);
    const b = randInt(r, 90, 99);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },
  // 04 — Multiplying teens (13..19 × 13..19)
  "04": (r) => {
    const a = randInt(r, 12, 19);
    const b = randInt(r, 12, 19);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },
  // 05 — Multiplying by 25, 50, 75
  "05": (r) => {
    const a = randInt(r, 16, 199);
    const m = [25, 50, 75][randInt(r, 0, 2)];
    return { prompt: `${a} × ${m}`, expected: a * m };
  },
  // 06 — Multiplying by 101
  "06": (r) => {
    const n = randInt(r, 12, 99);
    return { prompt: `${n} × 101`, expected: n * 101 };
  },
  // 07 — General two-digit multiplication
  "07": (r) => {
    const a = randInt(r, 21, 89);
    const b = randInt(r, 21, 89);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },
  // 08 — Dividing by 5, 25, 125 (clean integer results)
  "08": (r) => {
    const m = [5, 25, 125][randInt(r, 0, 2)];
    const q = randInt(r, 4, 200);
    const dividend = q * m;
    return { prompt: `${dividend} ÷ ${m}`, expected: q };
  },
  // 09 — Divisibility shortcut: produce dividend, ask integer quotient
  "09": (r) => {
    const div = [3, 4, 6, 7, 8, 9, 11][randInt(r, 0, 6)];
    const q = randInt(r, 12, 999);
    return { prompt: `${q * div} ÷ ${div}`, expected: q };
  },
  // 10 — Long division yielding a 3-decimal rounded value
  "10": (r) => {
    const denom = [3, 6, 7, 9, 11, 12, 13][randInt(r, 0, 6)];
    const num = randInt(r, 1, denom - 1);
    return { prompt: `${num} ÷ ${denom}`, expected: Math.round((num / denom) * 1000) / 1000 };
  },
  // 11 — Fractions → decimals (clean fractions, 3-decimal rounding)
  "11": (r) => {
    const denom = [2, 4, 5, 8, 10, 16, 20][randInt(r, 0, 6)];
    const num = randInt(r, 1, denom - 1);
    return { prompt: `${num}/${denom} =`, expected: Math.round((num / denom) * 1000) / 1000 };
  },
  // 12 — Adding unlike denominators (return decimal-rounded answer)
  "12": (r) => {
    const a = randInt(r, 2, 9);
    const b = randInt(r, 2, 9);
    const da = randInt(r, 2, 9);
    const db = randInt(r, 2, 9);
    const num = a * db + b * da;
    const denom = da * db;
    return { prompt: `${a}/${da} + ${b}/${db}`, expected: Math.round((num / denom) * 1000) / 1000 };
  },
  // 13 — Multiplying mixed numbers (decimal answer)
  "13": (r) => {
    const a = randInt(r, 1, 5);
    const b = randInt(r, 1, 5);
    const da = randInt(r, 2, 5);
    const db = randInt(r, 2, 5);
    const v = (a + 1 / da) * (b + 1 / db);
    return { prompt: `(${a}+1/${da}) × (${b}+1/${db})`, expected: Math.round(v * 1000) / 1000 };
  },
  // 14 — Fraction of a number (clean integer)
  "14": (r) => {
    const denom = [2, 3, 4, 5, 8][randInt(r, 0, 4)];
    const num = randInt(r, 1, denom - 1);
    const k = randInt(r, 2, 30) * denom;
    return { prompt: `${num}/${denom} of ${k}`, expected: (num * k) / denom };
  },
  // 15 — Percent swap trick (commutative percent-of)
  "15": (r) => {
    const a = randInt(r, 4, 96);
    const b = randInt(r, 4, 96);
    return { prompt: `${a}% of ${b}`, expected: Math.round(((a * b) / 100) * 100) / 100 };
  },
  // 16 — Sales tax / tip (one-decimal percent)
  "16": (r) => {
    const pct = randInt(r, 4, 15) + (randInt(r, 0, 99) / 100);
    const v = randInt(r, 20, 250);
    return { prompt: `${pct.toFixed(2)}% of ${v}`, expected: Math.round(((pct * v) / 100) * 100) / 100 };
  },
  // 17 — Successive percents (compound)
  "17": (r) => {
    const p1 = randInt(r, 5, 50);
    const p2 = randInt(r, 5, 50);
    const v = randInt(r, 50, 500);
    const after = v * (1 + p1 / 100) * (1 + p2 / 100);
    return { prompt: `${v}, +${p1}% then +${p2}%`, expected: Math.round(after * 100) / 100 };
  },
  // 18 — Square roots (perfect squares)
  "18": (r) => {
    const n = randInt(r, 4, 50);
    return { prompt: `√${n * n}`, expected: n };
  },
  // 19 — Cube roots (perfect cubes)
  "19": (r) => {
    const n = randInt(r, 2, 15);
    return { prompt: `∛${n * n * n}`, expected: n };
  },
  // 20 — Powers of 2
  "20": (r) => {
    const k = randInt(r, 4, 14);
    return { prompt: `2^${k}`, expected: 2 ** k };
  },
  // 21 — Small powers
  "21": (r) => {
    const base = randInt(r, 2, 9);
    const exp = randInt(r, 3, 5);
    return { prompt: `${base}^${exp}`, expected: base ** exp };
  },
  // 22 — Binary → decimal
  "22": (r) => {
    const n = randInt(r, 5, 255);
    return { prompt: `${n.toString(2)}₂ =`, expected: n };
  },
  // 23 — Hex → decimal
  "23": (r) => {
    const n = randInt(r, 16, 4095);
    return { prompt: `${n.toString(16).toUpperCase()}₁₆ =`, expected: n };
  },
  // 24 — GCD shortcuts
  "24": (r) => {
    const g = randInt(r, 2, 24);
    const a = g * randInt(r, 2, 12);
    const b = g * randInt(r, 2, 12);
    return { prompt: `GCD(${a}, ${b})`, expected: gcd(a, b) };
  },
  // 25 — Sum of divisors σ(n) (small n)
  "25": (r) => {
    const n = randInt(r, 12, 100);
    let s = 0;
    for (let i = 1; i <= n; i++) if (n % i === 0) s += i;
    return { prompt: `σ(${n})`, expected: s };
  },
  // 26 — Remainder patterns: a^k mod m
  "26": (r) => {
    const a = randInt(r, 2, 9);
    const k = randInt(r, 5, 20);
    const m = randInt(r, 3, 11);
    let v = 1;
    for (let i = 0; i < k; i++) v = (v * a) % m;
    return { prompt: `${a}^${k} mod ${m}`, expected: v };
  },
  // 27 — Linear equation solve (ax + b = c)
  "27": (r) => {
    const a = randInt(r, 2, 9);
    const x = randInt(r, 2, 19);
    const b = randInt(r, 1, 30);
    return { prompt: `${a}x + ${b} = ${a * x + b}`, expected: x };
  },
  // 28 — System of 2 equations (return x)
  "28": (r) => {
    const x = randInt(r, 2, 12);
    const y = randInt(r, 2, 12);
    const sum = x + y;
    const diff = x - y;
    return { prompt: `x+y=${sum}, x−y=${diff}`, expected: x };
  },
  // 29 — Difference of squares
  "29": (r) => {
    const a = randInt(r, 30, 80);
    const b = a - randInt(r, 2, 10);
    return { prompt: `${a}² − ${b}²`, expected: a * a - b * b };
  },
  // 30 — Pythagorean triples (return hypotenuse)
  "30": (r) => {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [6, 8, 10]];
    const [a, b, c] = triples[randInt(r, 0, triples.length - 1)];
    return { prompt: `legs ${a}, ${b} → hypotenuse`, expected: c };
  },
  // 31 — Circle area (use π = 3.14, round to one decimal)
  "31": (r) => {
    const radius = randInt(r, 3, 20);
    const v = 3.14 * radius * radius;
    return { prompt: `r = ${radius}, A ≈ (π=3.14)`, expected: Math.round(v * 10) / 10 };
  },
  // 32 — Polygon interior angle sum
  "32": (r) => {
    const n = randInt(r, 3, 12);
    return { prompt: `${n}-gon interior ∑ =`, expected: (n - 2) * 180 };
  },
  // 33 — Arithmetic series sum 1 + 3 + ... + (2n-1) = n²
  "33": (r) => {
    const n = randInt(r, 5, 30);
    return { prompt: `1+3+5+…+${2 * n - 1}`, expected: n * n };
  },
  // 34 — Geometric series 1 + 2 + ... + 2^n = 2^(n+1) − 1
  "34": (r) => {
    const n = randInt(r, 4, 10);
    return { prompt: `1+2+4+…+${2 ** n}`, expected: 2 ** (n + 1) - 1 };
  },
  // 35 — Sum of first k Fibonacci = F(k+2) − 1
  "35": (r) => {
    const k = randInt(r, 4, 10);
    const fib = [0, 1];
    for (let i = 2; i <= k + 2; i++) fib.push(fib[i - 1] + fib[i - 2]);
    return { prompt: `F₁+F₂+…+F${k}`, expected: fib[k + 2] - 1 };
  },
  // 36 — Rate × time = distance
  "36": (r) => {
    const rate = randInt(r, 20, 80);
    const hours = randInt(r, 2, 6);
    const halves = randInt(r, 0, 1) === 1 ? 0.5 : 0;
    return { prompt: `${rate} mph × ${hours + halves} hr`, expected: rate * (hours + halves) };
  },
  // 37 — Mixture (weighted average)
  "37": (r) => {
    const v1 = randInt(r, 10, 80);
    const v2 = randInt(r, 10, 80);
    return { prompt: `avg of ${v1}%, ${v2}%`, expected: (v1 + v2) / 2 };
  },
  // 38 — Combined work rates (1/a + 1/b → time)
  "38": (r) => {
    const a = randInt(r, 2, 8);
    const b = randInt(r, 2, 8);
    const t = (a * b) / (a + b);
    return { prompt: `${a}h & ${b}h → together`, expected: Math.round(t * 100) / 100 };
  },
  // 39 — Roman numerals
  "39": (r) => {
    const n = randInt(r, 4, 1999);
    return { prompt: `Roman: ${toRoman(n)} =`, expected: n };
  },
  // 40 — Calendar day-of-week (Zeller's congruence). Returns 0=Sat, 1=Sun, ..., 6=Fri
  "40": (r) => {
    let y = randInt(r, 2000, 2099);
    let m = randInt(r, 1, 12);
    const d = randInt(r, 1, 28);
    if (m < 3) {
      m += 12;
      y -= 1;
    }
    const K = y % 100;
    const J = Math.floor(y / 100);
    const dow = (d + Math.floor((13 * (m + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) - 2 * J + 700) % 7;
    return { prompt: `dow ${m > 12 ? m - 12 : m}/${d}/${y < 100 ? y + 1 : y} (0=Sat..6=Fri)`, expected: dow };
  },
  // 41 — Clock angles (hour-minute, in degrees)
  "41": (r) => {
    const h = randInt(r, 1, 12);
    const m = randInt(r, 0, 11) * 5;
    const angle = Math.abs(30 * h - (11 * m) / 2);
    const result = Math.min(angle, 360 - angle);
    return { prompt: `angle at ${h}:${m.toString().padStart(2, "0")}`, expected: Math.round(result * 10) / 10 };
  },
  // 42 — Unit conversion (feet → inches)
  "42": (r) => {
    const ft = randInt(r, 2, 30);
    const halves = randInt(r, 0, 1) === 1 ? 0.5 : 0;
    return { prompt: `${ft + halves} ft → in`, expected: (ft + halves) * 12 };
  },
  // 43 — Reciprocal of a small decimal
  "43": (r) => {
    const choices = [0.125, 0.25, 0.5, 0.2, 0.4, 0.625, 0.75, 0.8];
    const v = choices[randInt(r, 0, choices.length - 1)];
    return { prompt: `1 / ${v}`, expected: Math.round((1 / v) * 1000) / 1000 };
  },
};

/** Generate `count` problems for a trick. Same `seed` always yields the same set. */
export function generate(trickId: string, seed: number, count: number = 5): GeneratedProblem[] {
  const gen = GENERATORS[trickId];
  if (!gen) {
    throw new Error(`No generator for trick "${trickId}"`);
  }
  const rng = makeRng(seed);
  return Array.from({ length: count }, () => gen(rng));
}

/** Used by tests to walk every supported id without depending on tricks.ts. */
export function supportedTrickIds(): string[] {
  return Object.keys(GENERATORS);
}

export { fromRoman };
