import type { GeneratedProblem } from "@/lib/types";
import { makeRng, randInt } from "./utils";

/**
 * Per-trick problem generators for the legacy 52-trick catalog (IDs "1".."52").
 *
 * Each generator returns one (prompt, expected) pair. Prompts use Unicode
 * operators (×, ÷, −, ², ³, √, ∛) that the drill UI styles. `expected` is a
 * number for clean arithmetic problems, or a string for shape-based answers
 * (Roman numerals, fractions, mixed numbers, etc.). The answer validator's
 * round-trip rule is `equals(String(p.expected), p.expected) === true`, so
 * generators must emit `expected` in a form mathjs can parse OR a string that
 * direct-matches itself after whitespace stripping.
 *
 * All generators are deterministic via Mulberry32 (`makeRng(seed)`); the
 * problemGenerator test asserts same-seed → same problems.
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
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
/** Reduce numerator/denominator and return mixed-number string "w n/d" or "n/d" or "w". */
function toMixed(num: number, denom: number): string {
  const g = gcd(num, denom);
  const n = num / g;
  const d = denom / g;
  if (d === 1) return String(n);
  const w = Math.trunc(n / d);
  const r = Math.abs(n % d);
  if (w === 0) return `${n}/${d}`;
  if (r === 0) return String(w);
  return `${w} ${r}/${d}`;
}

/** Pick a random non-zero integer in [-10, 10] using rng. */
function nonzeroInt(r: () => number, min = -10, max = 10): number {
  let v: number;
  do {
    v = randInt(r, min, max);
  } while (v === 0);
  return v;
}

const GENERATORS: Record<string, Generator> = {
  // 1 — Multiplying by 11 (REUSE: "01")
  "1": (r) => {
    const n = randInt(r, 12, 99);
    return { prompt: `${n} × 11`, expected: n * 11 };
  },

  // 2 — Multiplying by 25 (REUSE: "05" reduced to ×25)
  "2": (r) => {
    const n = randInt(r, 12, 199);
    return { prompt: `${n} × 25`, expected: n * 25 };
  },

  // 3 — Multiplying by 101 (REUSE: "06"; legacy randomly picks ÷101 or ×101)
  "3": (r) => {
    if (r() < 0.5) {
      const q = randInt(r, 50, 999);
      return { prompt: `${q * 101} ÷ 101`, expected: q };
    }
    const n = randInt(r, 100, 999);
    return { prompt: `${n} × 101`, expected: n * 101 };
  },

  // 4 — Multiplying by 111 (PORT)
  "4": (r) => {
    if (r() < 0.5) {
      const q = randInt(r, 50, 999);
      return { prompt: `${q * 111} ÷ 111`, expected: q };
    }
    const n = randInt(r, 50, 999);
    return { prompt: `${n} × 111`, expected: n * 111 };
  },

  // 5 — Remainder of n divided by x (PORT)
  "5": (r) => {
    const n = randInt(r, 100, 9999);
    const x = randInt(r, 3, 11);
    return { prompt: `${n} mod ${x}`, expected: n % x };
  },

  // 6 — 4-digit subtraction (PORT)
  "6": (r) => {
    const a = randInt(r, 1000, 9999);
    const b = randInt(r, 1000, 9999);
    return { prompt: `${a} − ${b}`, expected: a - b };
  },

  // 7 — 4-digit addition (PORT)
  "7": (r) => {
    const a = randInt(r, 1000, 9999);
    const b = randInt(r, 1000, 9999);
    return { prompt: `${a} + ${b}`, expected: a + b };
  },

  // 8 — FOIL: two 2-digit ints (REUSE: "07")
  "8": (r) => {
    const a = randInt(r, 10, 99);
    const b = randInt(r, 10, 99);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 9 — Squares 10-40 (REUSE: "02" generalised)
  "9": (r) => {
    const n = randInt(r, 10, 40);
    return { prompt: `${n}²`, expected: n * n };
  },

  // 10 — Squares 41-60 (PORT)
  "10": (r) => {
    const n = randInt(r, 41, 60);
    return { prompt: `${n}²`, expected: n * n };
  },

  // 11 — Tens trick: same tens digit, ones sum to 10 (REUSE: "04" replaced)
  "11": (r) => {
    const tens = randInt(r, 1, 6);
    const ones = randInt(r, 1, 9);
    const a = tens * 10 + ones;
    const b = tens * 10 + (10 - ones);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 12 — Sum of arithmetic series x + 2x + ... + nx (REUSE: "33" generalized)
  "12": (r) => {
    const n = randInt(r, 5, 25);
    const x = randInt(r, 1, 4);
    return { prompt: `${x} + ${x * 2} + ${x * 3} + … + ${x * n}`, expected: x * ((n * (n + 1)) / 2) };
  },

  // 13 — Estimation: pick problems with exact-integer answers (PORT, but ranges chosen so answer is exact)
  "13": (r) => {
    if (r() < 0.5) {
      // Multiplication of two 3-digit numbers (exact)
      const a = randInt(r, 100, 999);
      const b = randInt(r, 100, 999);
      return { prompt: `${a} × ${b}`, expected: a * b };
    }
    // Division: ensure clean integer quotient by constructing dividend = q * d
    const d = randInt(r, 100, 999);
    const q = randInt(r, 100, 999);
    return { prompt: `${d * q} ÷ ${d}`, expected: q };
  },

  // 14 — <100 multiplication (90-99) (PORT)
  "14": (r) => {
    const a = randInt(r, 90, 99);
    const b = randInt(r, 90, 99);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 15 — >100 multiplication (110-119 × 100-119) (REUSE: "03" relocated)
  "15": (r) => {
    const a = randInt(r, 110, 119);
    const b = randInt(r, 100, 119);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 16 — Mixed </> 100 multiplication (PORT)
  "16": (r) => {
    const a = randInt(r, 90, 95);
    const b = randInt(r, 101, 115);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 17 — Decimal/fraction conversion (REUSE: "11" generalised)
  // Numerator/denominator chosen so that mathjs's fraction() parses both directions exactly.
  "17": (r) => {
    // Use denominators in {2,4,5,8,10,16,20,25} which give terminating decimals.
    const denoms = [2, 4, 5, 8, 10, 16, 20, 25];
    const denom = denoms[randInt(r, 0, denoms.length - 1)];
    const num = randInt(r, 1, denom - 1);
    if (r() < 0.5) {
      // fraction → decimal
      return { prompt: `${num}/${denom} as decimal`, expected: num / denom };
    }
    // decimal → fraction (return reduced fraction string)
    const g = gcd(num, denom);
    return { prompt: `${num / denom} as fraction`, expected: `${num / g}/${denom / g}` };
  },

  // 18 — Decimal addition/subtraction (PORT, integer-cents to keep validator happy)
  "18": (r) => {
    // Work in integer cents to avoid float drift; emit decimals to two places.
    const a = randInt(r, 100, 99999); // cents
    const b = randInt(r, 100, 99999);
    const aStr = (a / 100).toFixed(2);
    const bStr = (b / 100).toFixed(2);
    if (r() < 0.5) {
      return { prompt: `${aStr} + ${bStr}`, expected: (a + b) / 100 };
    }
    return { prompt: `${aStr} − ${bStr}`, expected: (a - b) / 100 };
  },

  // 19 — Roman numerals (REUSE: "39")
  "19": (r) => {
    const n = randInt(r, 10, 1999);
    return { prompt: `${toRoman(n)} =`, expected: n };
  },

  // 20 — Cubes n³, n in 1-20 (REUSE: "19" forward direction)
  "20": (r) => {
    const n = randInt(r, 1, 20);
    return { prompt: `${n}³`, expected: n * n * n };
  },

  // 21 — GCD (REUSE: "24")
  "21": (r) => {
    let n = 0, x = 0, g = 1;
    // Constructive: build via a common factor so gcd > 1 always
    g = randInt(r, 2, 12);
    n = g * randInt(r, 2, 9);
    x = g * randInt(r, 2, 9);
    return { prompt: `GCD(${n}, ${x})`, expected: gcd(n, x) };
  },

  // 22 — LCM (PORT)
  "22": (r) => {
    let n: number, x: number;
    let attempts = 0;
    do {
      n = randInt(r, 10, 50);
      x = randInt(r, 10, 50);
      attempts++;
    } while (gcd(n, x) === 1 && attempts < 8);
    return { prompt: `LCM(${n}, ${x})`, expected: lcm(n, x) };
  },

  // 23 — Conversion INTO base 10 (REUSE/PORT: "22" generalized to any base)
  "23": (r) => {
    const base = randInt(r, 2, 9);
    // Choose a target value in [base, base^4 - 1] then express in that base.
    const value = randInt(r, base, Math.min(2000, Math.pow(base, 4) - 1));
    return { prompt: `${value.toString(base)}₍${base}₎ → base 10`, expected: value };
  },

  // 24 — Conversion FROM base 10 (PORT)
  "24": (r) => {
    const base = randInt(r, 2, 9);
    const value = randInt(r, 10, 499);
    return { prompt: `${value} → base ${base}`, expected: value.toString(base) };
  },

  // 25 — Conversion among bases 2/4/8 (PORT; emit answer in target base)
  "25": (r) => {
    const choices: [number, number][] = [
      [8, 2], [8, 4], [2, 8], [2, 4], [4, 2], [4, 8],
    ];
    const [from, to] = choices[randInt(r, 0, choices.length - 1)];
    const value = randInt(r, from, Math.pow(from, 4) - 1);
    const fromStr = value.toString(from);
    const toStr = value.toString(to);
    return { prompt: `${fromStr}₍${from}₎ → base ${to}`, expected: toStr };
  },

  // 26 — Sum of integral divisors σ(n) (REUSE: "25")
  "26": (r) => {
    const n = randInt(r, 12, 100);
    let s = 0;
    for (let i = 1; i <= n; i++) if (n % i === 0) s += i;
    return { prompt: `σ(${n})`, expected: s };
  },

  // 27 — Sum of prime divisors of n (PORT)
  "27": (r) => {
    const n = randInt(r, 4, 130);
    let s = 0;
    for (let i = 2; i <= n; i++) {
      if (n % i === 0 && isPrime(i)) s += i;
    }
    return { prompt: `Sum of prime divisors of ${n}`, expected: s };
  },

  // 28 — Repeating fractions x/90, x/99, x/900, x/990 (PORT)
  // Answer: value as a number; mathjs fraction("0.0xx") will round-trip cleanly.
  "28": (r) => {
    const choice = randInt(r, 0, 3);
    if (choice === 0) {
      const n = randInt(r, 1, 89);
      // first 3 decimal digits of n/90
      const truncated = Math.floor((n / 90) * 1000) / 1000;
      return { prompt: `First 3 decimals of ${n}/90`, expected: truncated };
    } else if (choice === 1) {
      const n = randInt(r, 1, 899);
      const truncated = Math.floor((n / 900) * 1000) / 1000;
      return { prompt: `First 3 decimals of ${n}/900`, expected: truncated };
    } else if (choice === 2) {
      const n = randInt(r, 1, 98);
      const truncated = Math.floor((n / 99) * 1000) / 1000;
      return { prompt: `First 3 decimals of ${n}/99`, expected: truncated };
    } else {
      const n = randInt(r, 1, 989);
      const truncated = Math.floor((n / 990) * 1000) / 1000;
      return { prompt: `First 3 decimals of ${n}/990`, expected: truncated };
    }
  },

  // 29 — Triangular numbers T_n = n(n+1)/2 (PORT)
  "29": (r) => {
    const n = randInt(r, 5, 30);
    return { prompt: `${n}th triangular number`, expected: (n * (n + 1)) / 2 };
  },

  // 30 — Pentagonal numbers P_n = n(3n-1)/2 (PORT)
  "30": (r) => {
    const n = randInt(r, 5, 30);
    return { prompt: `${n}th pentagonal number`, expected: (n * (3 * n - 1)) / 2 };
  },

  // 31 — Hexagonal numbers H_n = n(2n-1) (PORT)
  "31": (r) => {
    const n = randInt(r, 5, 30);
    return { prompt: `${n}th hexagonal number`, expected: n * (2 * n - 1) };
  },

  // 32 — x² + (2x)² = 5x² (PORT)
  "32": (r) => {
    const n = randInt(r, 5, 25);
    return { prompt: `${n}² + ${2 * n}²`, expected: 5 * n * n };
  },

  // 33 — x² + (3x)² = 10x² (PORT)
  "33": (r) => {
    const n = randInt(r, 5, 25);
    return { prompt: `${n}² + ${3 * n}²`, expected: 10 * n * n };
  },

  // 34 — Complex multiplication: emit (a+b) where (a+bi)(c+di) = a' + b'i (PORT)
  "34": (r) => {
    const a = nonzeroInt(r);
    const b = nonzeroInt(r);
    const c = nonzeroInt(r);
    const d = nonzeroInt(r);
    const real = a * c - b * d;
    const imag = a * d + b * c;
    const fmt = (x: number, im = false) => {
      const sign = x >= 0 ? "+" : "−";
      const v = Math.abs(x);
      return im ? ` ${sign} ${v}i` : `${x}`;
    };
    const left = `(${fmt(a)}${fmt(b, true)})`;
    const right = `(${fmt(c)}${fmt(d, true)})`;
    return { prompt: `${left}${right} = a + bi, a + b =`, expected: real + imag };
  },

  // 35 — Unit conversions (REUSE: "42" replaced with legacy volume conversions)
  // Pick conversions that yield integer-cup/quart/etc. answers.
  "35": (r) => {
    // Each entry: [fromUnit, toUnit, multiplier, valueRange]
    type Conv = { from: string; to: string; mul: number; pickValue: (rr: () => number) => number };
    const convs: Conv[] = [
      { from: "bushels", to: "pecks", mul: 4, pickValue: (rr) => randInt(rr, 2, 50) },
      { from: "gallons", to: "quarts", mul: 4, pickValue: (rr) => randInt(rr, 2, 30) },
      { from: "gallons", to: "pints", mul: 8, pickValue: (rr) => randInt(rr, 2, 20) },
      { from: "gallons", to: "cups", mul: 16, pickValue: (rr) => randInt(rr, 2, 15) },
      { from: "quarts", to: "pints", mul: 2, pickValue: (rr) => randInt(rr, 2, 50) },
      { from: "quarts", to: "cups", mul: 4, pickValue: (rr) => randInt(rr, 2, 25) },
      { from: "pints", to: "cups", mul: 2, pickValue: (rr) => randInt(rr, 2, 50) },
      { from: "pecks", to: "bushels", mul: 0.25, pickValue: (rr) => randInt(rr, 1, 25) * 4 },
      { from: "quarts", to: "gallons", mul: 0.25, pickValue: (rr) => randInt(rr, 1, 25) * 4 },
      { from: "cups", to: "quarts", mul: 0.25, pickValue: (rr) => randInt(rr, 1, 25) * 4 },
    ];
    const c = convs[randInt(r, 0, convs.length - 1)];
    const v = c.pickValue(r);
    return { prompt: `${v} ${c.from} = ? ${c.to}`, expected: v * c.mul };
  },

  // 36 — x² + (x+1)² (PORT)
  "36": (r) => {
    const n = randInt(r, 5, 25);
    return { prompt: `${n}² + ${n + 1}²`, expected: n * n + (n + 1) * (n + 1) };
  },

  // 37 — a/b + b/a (PORT). Answer: (a²+b²)/(ab) as mixed-number string.
  "37": (r) => {
    let a: number, b: number;
    let attempts = 0;
    do {
      a = randInt(r, 2, 9);
      b = randInt(r, 2, 9);
      attempts++;
    } while ((a === b || gcd(a, b) !== 1) && attempts < 10);
    if (a === b) b = a + 1; // safety net; gcd(a,a+1)=1
    const num = a * a + b * b;
    const den = a * b;
    return { prompt: `${a}/${b} + ${b}/${a}`, expected: toMixed(num, den) };
  },

  // 38 — Distinct diagonals in a polygon: n(n-3)/2 (PORT)
  "38": (r) => {
    const polys: Array<{ n: number; name: string }> = [
      { n: 4, name: "Square" },
      { n: 5, name: "Pentagon" },
      { n: 6, name: "Hexagon" },
      { n: 7, name: "Heptagon" },
      { n: 8, name: "Octagon" },
      { n: 9, name: "Nonagon" },
      { n: 10, name: "Decagon" },
      { n: 12, name: "Dodecagon" },
    ];
    const p = polys[randInt(r, 0, polys.length - 1)];
    return { prompt: `Diagonals in a ${p.name}`, expected: (p.n * (p.n - 3)) / 2 };
  },

  // 39 — Sum of n cubes = (n(n+1)/2)² (PORT)
  "39": (r) => {
    const n = randInt(r, 5, 20);
    return { prompt: `1³ + 2³ + … + ${n}³`, expected: ((n * (n + 1)) / 2) ** 2 };
  },

  // 40 — Alternating sum of n squares (PORT)
  "40": (r) => {
    const n = randInt(r, 5, 20);
    const startsNeg = r() < 0.5;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      let sign = i % 2 === 0 ? -1 : 1;
      if (startsNeg) sign *= -1;
      sum += sign * i * i;
    }
    const lead = startsNeg ? "−1²" : "1²";
    const second = startsNeg ? " + 2²" : " − 2²";
    const third = startsNeg ? " − 3²" : " + 3²";
    const last = (startsNeg ? n % 2 === 0 : n % 2 !== 0) ? `+ ${n}²` : `− ${n}²`;
    return { prompt: `${lead}${second}${third} … ${last}`, expected: sum };
  },

  // 41 — Mean / Median (PORT). Pick whichever has a clean answer.
  "41": (r) => {
    if (r() < 0.5) {
      // Mean: pick count and integers so sum is divisible by count.
      const count = randInt(r, 4, 6);
      const target = randInt(r, 10, 40);
      // Pick `count - 1` random numbers, then choose the last to hit target * count.
      const nums: number[] = [];
      let sum = 0;
      for (let i = 0; i < count - 1; i++) {
        const v = randInt(r, 5, 50);
        nums.push(v);
        sum += v;
      }
      const last = target * count - sum;
      // If last isn't in a sane range, just use a synthetic equal-mean set.
      if (last < 1 || last > 99) {
        const filler: number[] = [];
        for (let i = 0; i < count; i++) filler.push(target);
        return { prompt: `Mean of ${filler.join(", ")}`, expected: target };
      }
      nums.push(last);
      return { prompt: `Mean of ${nums.join(", ")}`, expected: target };
    }
    // Median: odd count, single-digit positives → median is exact integer.
    const count = 2 * randInt(r, 3, 5) + 1; // 7, 9, 11
    const nums: number[] = [];
    for (let i = 0; i < count; i++) nums.push(randInt(r, 1, 9));
    const sorted = [...nums].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)];
    return { prompt: `Median of ${nums.join(", ")}`, expected: median };
  },

  // 42 — Geometric mean (PORT). Always pick a, b with √(ab) ∈ ℤ.
  "42": (r) => {
    if (r() < 0.5) {
      // Three numbers n, 2n, 4n: GM = ∛(8n³) = 2n
      const n = randInt(r, 2, 20);
      return { prompt: `Geometric mean of ${n}, ${2 * n}, ${4 * n}`, expected: 2 * n };
    }
    // Two numbers: n × (perfect square × n) → √ is integer.
    const n = randInt(r, 2, 20);
    const sq = [4, 9, 16, 25, 36, 49, 64][randInt(r, 0, 6)];
    const other = n * sq;
    const ans = Math.round(Math.sqrt(n * other));
    return { prompt: `Geometric mean of ${n}, ${other}`, expected: ans };
  },

  // 43 — Harmonic mean (PORT). Answer as exact mixed-number string.
  "43": (r) => {
    const count = randInt(r, 2, 3);
    const nums: number[] = [];
    for (let i = 0; i < count; i++) nums.push(randInt(r, 1, 9));
    // HM = count / Σ(1/x_i) = count * (Π x_i) / (Σ Π_{j≠i} x_j)
    let prodAll = 1;
    for (const x of nums) prodAll *= x;
    let denomSum = 0;
    for (let i = 0; i < nums.length; i++) {
      let term = 1;
      for (let j = 0; j < nums.length; j++) if (j !== i) term *= nums[j];
      denomSum += term;
    }
    const num = count * prodAll;
    const den = denomSum;
    return { prompt: `Harmonic mean of ${nums.join(", ")}`, expected: toMixed(num, den) };
  },

  // 44 — Estimating square/cube roots: pick perfect squares/cubes (PORT)
  "44": (r) => {
    if (r() < 0.5) {
      const n = randInt(r, 100, 200); // n² in [10000, 40000]
      return { prompt: `√${n * n}`, expected: n };
    }
    const n = randInt(r, 50, 999); // n³ in legacy range
    return { prompt: `∛${n * n * n}`, expected: n };
  },

  // 45 — x/100 of y (REUSE: "15"). Pick x and y such that x*y is divisible by 100.
  "45": (r) => {
    // Pick y as a multiple of 4 or 5 to keep answer numeric-clean.
    const y = randInt(r, 10, 99);
    const x = randInt(r, 1, 99);
    const result = (x * y) / 100;
    return { prompt: `${x}% of ${y}`, expected: Math.round(result * 100) / 100 };
  },

  // 46 — (a × b)/c with a, b coprime to c → mixed-number string (REUSE: "14")
  "46": (r) => {
    let a: number, b: number, c: number;
    let attempts = 0;
    do {
      a = randInt(r, 10, 30);
      b = randInt(r, 10, 30);
      c = randInt(r, 10, 30);
      attempts++;
    } while ((a === b || a === c || b === c || gcd(a, c) !== 1) && attempts < 12);
    return { prompt: `${a} × ${b}/${c}`, expected: toMixed(a * b, c) };
  },

  // 47 — (a + b)(a − b) [presented as a² − b²] (REUSE: "29")
  "47": (r) => {
    const tens = randInt(r, 1, 5);
    const onesA = randInt(r, 0, 9);
    let onesB: number;
    do { onesB = randInt(r, 0, 9); } while (onesB === onesA);
    const a = tens * 10 + onesA;
    const b = tens * 10 + onesB;
    return { prompt: `${a}² − ${b}²`, expected: a * a - b * b };
  },

  // 48 — Custom Fibonacci series sum (REUSE: "35" form, ported to legacy variant)
  "48": (r) => {
    const numTerms = randInt(r, 6, 10);
    const f1 = randInt(r, 1, 20);
    const f2 = randInt(r, 1, 20);
    const seq = [f1, f2];
    for (let i = 2; i < numTerms; i++) seq.push(seq[i - 1] + seq[i - 2]);
    const sum = seq.reduce((acc, v) => acc + v, 0);
    const head = seq.slice(0, 3).join(" + ");
    const tail = seq.slice(-2).join(" + ");
    return { prompt: `${head} + … + ${tail}`, expected: sum };
  },

  // 49 — 3-digit FOIL (PORT)
  "49": (r) => {
    const a = randInt(r, 100, 999);
    const b = randInt(r, 100, 999);
    return { prompt: `${a} × ${b}`, expected: a * b };
  },

  // 50 — 3-digit squares of (100*x + b) (PORT)
  "50": (r) => {
    const x = randInt(r, 1, 10);
    const b = randInt(r, 1, 20);
    const num = 100 * x + b;
    return { prompt: `${num}²`, expected: num * num };
  },

  // 51 — 3-digit cubes of (100*x + b), x ∈ 1..4, b ∈ 1..10 (PORT)
  "51": (r) => {
    const x = randInt(r, 1, 4);
    const b = randInt(r, 1, 10);
    const num = 100 * x + b;
    return { prompt: `${num}³`, expected: num * num * num };
  },

  // 52 — (x³ − y³)/(x − y) = x² + xy + y² (PORT)
  "52": (r) => {
    const x = randInt(r, 1, 15);
    let y = randInt(r, 1, 15);
    if (x === y) y = (y % 15) + 1;
    return { prompt: `(${x}³ − ${y}³) / (${x} − ${y})`, expected: x * x + x * y + y * y };
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
