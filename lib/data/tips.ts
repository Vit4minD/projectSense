type Tip = { tip: string; mnemonic?: string };

/**
 * Tips for the legacy 52-trick catalog. Keyed by bare numeric ID "1".."52".
 */
export const TIPS: Record<string, Tip> = {
  "1": {
    tip: "Spread the digits, then add the gap. 48×11 → 4_8 → 4+8 = 12 → carry → 528.",
    mnemonic: "split, sum, settle",
  },
  "2": {
    tip: "×25 = ÷4, then ×100. 76×25 → 76÷4 = 19, ×100 = 1900. For odd numerators, multiply numerator by 100 then divide by 4.",
    mnemonic: "÷4 then ×100",
  },
  "3": {
    tip: "×101 = write the 2-digit number twice. 57×101 → 5757. For 3-digit n, the answer is n shifted left two and added to n: e.g., 235×101 = 23735.",
  },
  "4": {
    tip: "×111 splits as ×100 + ×10 + ×1. For two-digit ab×111 the middle digits are a + (a+b) + b carried. Memorise the pattern for fast answers.",
  },
  "5": {
    tip: "Cast out the divisor's largest multiple. 537 mod 7 → 7·76 = 532 → remainder 5. Use divisibility rules to land near a multiple quickly.",
  },
  "6": {
    tip: "Subtract from left to right, borrowing only when needed. Or round one term up and adjust at the end: 5821 − 2944 = 5821 − 3000 + 56 = 2877.",
  },
  "7": {
    tip: "Add from left to right, carrying as you go. Use friendly rounding: 3471 + 5829 = 3471 + 5800 + 29 = 9300, recheck units.",
  },
  "8": {
    tip: "FOIL across tens and ones: (10a+b)(10c+d) = 100ac + 10(ad+bc) + bd. Compute the three pieces, sum carefully.",
    mnemonic: "tens·tens, cross, ones·ones",
  },
  "9": {
    tip: "Squares 10–40: use (a+b)² = a² + 2ab + b² with a as nearest multiple of 10. e.g., 27² = 25² + 2·25·2 + 2² = 625 + 100 + 4 = 729.",
  },
  "10": {
    tip: "Squares 41–60: pivot on 50. (50+k)² = 2500 + 100k + k². 53² = 2500 + 300 + 9 = 2809. (50−k)² = 2500 − 100k + k².",
    mnemonic: "pivot on 50",
  },
  "11": {
    tip: "When tens match and ones sum to 10: answer is tens·(tens+1)·100 + ones·ones. 63×67 → 6·7·100 + 3·7 = 4200 + 21 = 4221.",
    mnemonic: "n·(n+1) | ones·ones",
  },
  "12": {
    tip: "x + 2x + … + nx = x · n(n+1)/2. Compute the triangle number, then scale.",
  },
  "13": {
    tip: "Estimate by rounding both numbers to two significant figures. Multiply, then refine with the remaining error terms.",
  },
  "14": {
    tip: "Two numbers near 100 from below: ab = (a − (100−b))·100 + (100−a)(100−b). 94×97 → (94−3)·100 + 6·3 = 9118.",
  },
  "15": {
    tip: "Two numbers above 100: ab = (a + (b−100))·100 + (a−100)(b−100). 112×116 → (112+16)·100 + 12·16 = 12800 + 192 = 12992.",
  },
  "16": {
    tip: "One above, one below: ab = (a + (b−100))·100 − (100−a)(b−100). 94×108 → (94+8)·100 − 6·8 = 10200 − 48 = 10152.",
  },
  "17": {
    tip: "Memorise common decimals: 1/8 = 0.125, 5/8 = 0.625, 1/16 = 0.0625. For decimal-to-fraction, look at the denominator-determining digits.",
  },
  "18": {
    tip: "Align the decimal points, treat as integers in the same scale, then place the decimal back.",
  },
  "19": {
    tip: "M=1000, D=500, C=100, L=50, X=10, V=5, I=1. Smaller before larger subtracts (IV=4, IX=9, XL=40, etc.).",
  },
  "20": {
    tip: "Memorise cubes 1–10: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000. For 11..20 use (10+k)³ = 1000 + 300k + 30k² + k³.",
    mnemonic: "10+k expansion",
  },
  "21": {
    tip: "Euclidean algorithm: gcd(a,b) = gcd(b, a mod b). Reduce until the remainder is 0; the previous value is the GCD.",
  },
  "22": {
    tip: "LCM(a,b) = a·b / GCD(a,b). Compute GCD first, then divide once.",
    mnemonic: "ab/gcd",
  },
  "23": {
    tip: "Each digit times its base raised to its position. 1011₂ = 1·8 + 0·4 + 1·2 + 1 = 11.",
  },
  "24": {
    tip: "Repeatedly divide by the target base; record remainders bottom-up. 53 ÷ 4 = 13 r1, 13 ÷ 4 = 3 r1, 3 ÷ 4 = 0 r3 → 311₄.",
  },
  "25": {
    tip: "Bases 2/4/8 align via binary. 1 base-4 digit = 2 binary digits; 1 base-8 digit = 3 binary digits. Convert through base 2 to bridge.",
  },
  "26": {
    tip: "σ is multiplicative. Factor n, then σ(p^k) = (p^(k+1) − 1)/(p − 1). σ(72) = σ(8)·σ(9) = 15·13 = 195.",
  },
  "27": {
    tip: "Factor n into primes; sum each distinct prime once. 60 = 2²·3·5 → 2 + 3 + 5 = 10.",
  },
  "28": {
    tip: "x/9 repeats every 1 digit, x/99 every 2, x/999 every 3. The pattern of a/(10^k − 10^j) is the rotation of a's digits — read the first three repeating digits directly.",
  },
  "29": {
    tip: "T_n = n(n+1)/2. T_12 = 12·13/2 = 78.",
    mnemonic: "n(n+1)/2",
  },
  "30": {
    tip: "P_n = n(3n−1)/2. Compute 3n−1 first, multiply by n, halve.",
  },
  "31": {
    tip: "H_n = n(2n−1). Equal to T_(2n−1). H_7 = 7·13 = 91.",
  },
  "32": {
    tip: "x² + (2x)² = 5x². Square x and multiply by 5.",
    mnemonic: "5x²",
  },
  "33": {
    tip: "x² + (3x)² = 10x². Square x then append a zero.",
    mnemonic: "10x²",
  },
  "34": {
    tip: "(a+bi)(c+di) = (ac−bd) + (ad+bc)i. Real part = ac − bd, imaginary = ad + bc; sum a + b = (ac − bd) + (ad + bc).",
  },
  "35": {
    tip: "Cups, pints, quarts, gallons each double or halve neatly. 1 gal = 4 qt = 8 pt = 16 cups; 1 bushel = 4 pecks.",
  },
  "36": {
    tip: "x² + (x+1)² = 2x² + 2x + 1. Or use the closed form 2x(x+1)+1 — twice the triangle number gap, plus one.",
  },
  "37": {
    tip: "a/b + b/a = (a² + b²)/(ab) = 2 + (a−b)²/(ab). The integer part is always 2 when gcd(a,b)=1; the fractional part is (a−b)² over ab.",
    mnemonic: "2 plus (a−b)²/(ab)",
  },
  "38": {
    tip: "Diagonals in an n-gon: n(n−3)/2. Each vertex connects to n−3 others, halve to undo double-count.",
  },
  "39": {
    tip: "1³ + 2³ + … + n³ = (n(n+1)/2)² — the square of the triangular number.",
    mnemonic: "(T_n)²",
  },
  "40": {
    tip: "Alternating sum 1² − 2² + 3² − … = (−1)^(n+1) · n(n+1)/2. Sign tracks parity; magnitude is the n-th triangular number.",
  },
  "41": {
    tip: "Mean: sum / count. For median, sort first; middle of odd, average of two middles for even.",
  },
  "42": {
    tip: "GM(a, b) = √(ab). For three: GM = ∛(abc). Pick perfect-square products to compute fast.",
    mnemonic: "√(ab)",
  },
  "43": {
    tip: "HM(a, b) = 2ab/(a+b). For n values: n / Σ(1/x_i). Compute the reciprocal sum first, then invert.",
    mnemonic: "n over reciprocal-sum",
  },
  "44": {
    tip: "Bracket between known squares (or cubes). For √17956: between 130² = 16900 and 140² = 19600 → it's near 134. Refine.",
  },
  "45": {
    tip: "x% of y = (x·y)/100. Use the swap: a% of b = b% of a when one side is friendlier.",
    mnemonic: "swap, then easier",
  },
  "46": {
    tip: "Compute a·b first, then divide by c. If c | a·b, exact integer; otherwise express as a mixed number.",
  },
  "47": {
    tip: "a² − b² = (a+b)(a−b). 37² − 33² = 70·4 = 280.",
    mnemonic: "sum × difference",
  },
  "48": {
    tip: "For a custom Fibonacci-like sequence, the sum of the first n terms equals (S_(n+2) − second_term) where S is the running term, or compute directly.",
  },
  "49": {
    tip: "3-digit FOIL: split as (100a + b)(100c + d). Compute 10000ac + 100(ad + bc) + bd carefully — the middle term is the trickiest.",
  },
  "50": {
    tip: "(100x + b)² = 10000x² + 200xb + b². For x small, the leading and middle pieces are easy; b² fills the units.",
  },
  "51": {
    tip: "(100x + b)³ = 1000000x³ + 30000x²b + 300xb² + b³. Tedious but mechanical when x ≤ 4 and b ≤ 10.",
  },
  "52": {
    tip: "(x³ − y³)/(x − y) = x² + xy + y². Memorise the factoring identity and skip the division entirely.",
    mnemonic: "x² + xy + y²",
  },
};

export function getTip(trickId: string): Tip | undefined {
  return TIPS[trickId];
}
