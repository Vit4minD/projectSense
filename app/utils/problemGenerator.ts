export const problemSet: { [key: number]: string } = {
  1: "n \\times 11",
  2: "n \\times 25",
  3: "n101",
  4: "n111",
  5: "n \\% x",
  6: "n - x",
  7: "n + x",
  8: "\\text{FOIL}",
  9: "\\text{SQUARES (10-41)}",
  10: "\\text{SQUARES (41-60)}",
  11: "\\text{Tens Trick}",
  12: "\\text{Sum of Arithmetic Series}",
  13: "\\text{Estimation}",
  14: "<100 \\text{ Multiplication}",
  15: ">100 \\text{ Multiplication}",
  16: "\\text{> / < } 100 \\text{ Multiplication}",
  17: "\\text{Dec/Frac Conversion}",
  18: "\\text{Dec Addition/Subtraction}",
  19: "\\text{Roman Numerals}",
  20: "\\text{Cubes}",
  21: "\\text{GCD}",
  22: "\\text{LCM}",
  23: "\\text{Conversion into Base 10}",
  24: "\\text{Conversion from Base 10}",
  25: "\\text{Conversion of Base 2, 4, 8}",
  26: "\\text{Sum of Integral Divisors}",
  27: "\\text{Sum of Prime Divisors}",
  28: "\\frac{x}{90}, \\frac{x}{99}, \\frac{x}{900}, \\frac{x}{990}",
  29: "\\text{Triangular Numbers}",
  30: "\\text{Pentagonal Numbers}",
  31: "\\text{Hexagonal Numbers}",
  32: "x^2 + (2x)^2",
  33: "x^2 + (3x)^2",
  34: "\\text{Complex Number Multiplication}",
  35: "\\text{Unit Conversions}",
  36: "x^2 + (x+1)^2",
  37: "\\frac{a}{b} + \\frac{b}{a}",
  38: "\\# \\text{ of distinct diagonals in a polygon}",
  39: "\\text{Sum of } n \\text{ cubes}",
  40: "\\text{Alternating Sum of } n \\text{ Squares}",
  41: "\\text{Mean/Median}",
  42: "\\text{Geometric Mean}",
  43: "\\text{Harmonic Mean}",
  44: "\\text{Estimating Square/Cube Roots}",
  45: "\\frac{x}{100} \\text{ of } y",
  46: "\\frac{a \\times b}{c}",
  47: "(a+b) \\times (a-b)",
  48: "\\text{Fibonacci Series}",
  49: "\\text{3 digit FOIL}",
  50: "\\text{3-digit Squares}",
  51: "\\text{3-digit Cubes}",
  52: "\\frac{x^3-y^3}{x-y}",
};

interface Trick {
  function: Function; // Adjust the type according to your actual use case
  probability: number; //higher = more common
  column: number;
  type: string;
}

export const problemFunction: { [key: string]: Trick } = {
  "1": {
    function: n11,
    probability: 1,
    column: 1,
    type: "",
  },
  "2": {
    function: n25,
    probability: 1,
    column: 1,
    type: "",
  },
  "3": {
    function: n101,
    probability: 1,
    column: 2,
    type: "",
  },
  "4": {
    function: n111,
    probability: 1,
    column: 2,
    type: "",
  },
  "5": {
    function: nmod,
    probability: 1,
    column: 1,
    type: "",
  },
  "6": {
    function: nminus,
    probability: 1,
    column: 1,
    type: "",
  },
  "7": {
    function: nplus,
    probability: 1,
    column: 1,
    type: "",
  },
  "8": {
    function: nFoil,
    probability: 2,
    column: 2,
    type: "",
  },
  "9": {
    function: nSq1,
    probability: 3,
    column: 1,
    type: "",
  },
  "10": {
    function: nSq2,
    probability: 1,
    column: 2,
    type: "",
  },
  "11": {
    function: nTens,
    probability: 3,
    column: 2,
    type: "",
  },
  "12": {
    function: nSum,
    probability: 2,
    column: 1,
    type: "",
  },
  "13": {
    // tentative
    function: nEstim,
    probability: 1,
    column: 1,
    type: "",
  },
  "14": {
    function: nless100,
    probability: 1,
    column: 1,
    type: "",
  },
  "15": {
    function: nmore100,
    probability: 1,
    column: 2,
    type: "",
  },
  "16": {
    function: nmix100,
    probability: 2,
    column: 2,
    type: "",
  },
  "17": {
    function: decandfrac,
    probability: 1,
    column: 1,
    type: "",
  },
  "18": {
    function: decAdditionandSub,
    probability: 1,
    column: 2,
    type: "",
  },
  "19": {
    function: romanNum,
    probability: 2,
    column: 1,
    type: "",
  },
  "20": {
    function: nCube,
    probability: 1,
    column: 2,
    type: "",
  },
  "21": {
    function: nGCD,
    probability: 2,
    column: 1,
    type: "",
  },
  "22": {
    function: nLCM,
    probability: 2,
    column: 1,
    type: "",
  },
  "23": {
    function: toBase10,
    probability: 1,
    column: 2,
    type: "",
  },
  "24": {
    function: toBaseX,
    probability: 1,
    column: 2,
    type: "",
  },
  "25": {
    function: base248,
    probability: 1,
    column: 2,
    type: "",
  },
  "26": {
    function: intdivisors,
    probability: 1,
    column: 2,
    type: "",
  },
  "27": {
    function: primeDiv,
    probability: 1,
    column: 2,
    type: "",
  },
  "28": {
    function: nover90,
    probability: 1,
    column: 2,
    type: "",
  },
  "29": {
    function: ntriangular,
    probability: 1,
    column: 2,
    type: "",
  },
  "30": {
    function: npentagonal,
    probability: 1,
    column: 3,
    type: "",
  },
  "31": {
    function: nhexagonal,
    probability: 1,
    column: 3,
    type: "",
  },
  "32": {
    function: nX22x2,
    probability: 1,
    column: 2,
    type: "",
  },
  "33": {
    function: nX23x2,
    probability: 1,
    column: 2,
    type: "",
  },
  "34": {
    function: complexNumber,
    probability: 1,
    column: 3,
    type: "",
  },
  "35": {
    function: unitConversion,
    probability: 1,
    column: 2,
    type: "",
  },
  "36": {
    function: xandx1,
    probability: 1,
    column: 2,
    type: "",
  },
  "37": {
    function: abab,
    probability: 1,
    column: 1,
    type: "",
  },
  "38": {
    function: ngon,
    probability: 1,
    column: 3,
    type: "",
  },
  "39": {
    function: sumofncub,
    probability: 1,
    column: 3,
    type: "",
  },
  "40": {
    function: alternatingsum,
    probability: 1,
    column: 3,
    type: "",
  },
  "41": {
    function: meanmedian,
    probability: 2,
    column: 1,
    type: "",
  },
  "42": {
    function: geometricmean,
    probability: 1,
    column: 3,
    type: "",
  },
  "43": {
    function: harmonicMean,
    probability: 1,
    column: 4,
    type: "",
  },
  "44": {
    // tentative
    function: estimation,
    probability: 1,
    column: 3,
    type: "",
  },
  "45": {
    function: x100ofy,
    probability: 1,
    column: 1,
    type: "",
  },
  "46": {
    function: aboverc,
    probability: 1,
    column: 2,
    type: "",
  },
  "47": {
    function: diffofsq,
    probability: 1,
    column: 2,
    type: "",
  },
  "48": {
    function: fib,
    probability: 1,
    column: 3,
    type: "",
  },
  "49": {
    function: tripledigit,
    probability: 1,
    column: 3,
    type: "",
  },
  "50": {
    function: tripdigitsq,
    probability: 1,
    column: 3,
    type: "",
  },
  "51": {
    function: tripdigitcube,
    probability: 1,
    column: 3,
    type: "",
  },
  "52": {
    function: xcubedycubed,
    probability: 1,
    column: 3,
    type: "",
  },
};

export const videoMap: { [key: number]: string } = {
  51: "3-Digit_Cubes.mp4",
  37: "a_b+b_a.mp4",
  40: "Alternating_Sum_of_Squares.mp4",
  34: "Complex_Number_Multiplication.mp4",
  24: "Conversion_From_Base_10.mp4",
  23: "Conversion_Into_Base_10.mp4",
  8: "FOIL.mp4",
  42: "Geometric_Mean.mp4",
  43: "Harmonic_Mean.mp4",
  38: "Number_of_Distinct_Diagonals.mp4",
  15: "Over_100_Multiplication.mp4",
  16: "Over_Under_Multiplication.mp4",
  29: "Polygonal_Numbers.mp4",
  12: "Sum_of_Arithmetic_Series.mp4",
  26: "Sum_of_Intergral_Divisors.mp4",
  27: "Sum_of_Prime_Divisors.mp4",
  1: "Times_11.mp4",
  2: "Times_25.mp4",
  14: "Under_100_Multiplication.mp4",
  32: "x^2+(2x)^2.mp4",
  33: "x^2+(3x)^2.mp4",
  36: "x^2+(x+1)^2.mp4",
  10: "sq41-59.mp4",
  5: "nmodx.mp4",
  3: "n101.mp4",
};

function n11() {
  let num = Math.floor(Math.random() * (999 - 15 + 1)) + 15;
  return {
    body: `${num} \\times 11`,
    ans: "" + num * 11,
  };
}
function n25() {
  let num = Math.floor(Math.random() * (100 - 12 + 1)) + 12;
  return {
    body: `${num} \\times 25`,
    ans: "" + num * 25,
  };
}
function n101() {
  let num = 101 * (Math.floor(Math.random() * (999 - 50 + 1)) + 50);
  let nu = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
  if (Math.random() < 0.5) {
    return {
      body: `${num} \\div 101`,
      ans: "" + num / 101,
    };
  } else {
    return {
      body: `${nu} \\times 101`,
      ans: "" + nu * 101,
    };
  }
}
function n111() {
  let num = (Math.floor(Math.random() * (999 - 50 + 1)) + 50) * 111;
  let nu2 = Math.floor(Math.random() * (999 - 50 + 1)) + 50;
  if (Math.random() < 0.5) {
    return {
      body: `${num} \\div 111`,
      ans: "" + num / 111,
    };
  } else {
    return {
      body: `${nu2} \\times 111`,
      ans: "" + nu2 * 111,
    };
  }
}

function nmod() {
  let n = Math.floor(Math.random() * (99999 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (11 - 3 + 1)) + 3;
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `${n} \\text{ divided } \\newline \\text{by } ${x} \\text{ has}\\newline \\text{a remainder of } `
      : `${n} \\text{ divided by } ${x} \\text{ has a remainder of } `,
    ans: "" + (n % x),
  };
}
function nminus() {
  let n = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  let x = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  return {
    body: `${n} - ${x}`,
    ans: "" + (n - x),
  };
}

function nplus() {
  let n = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  let x = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  return {
    body: `${n} + ${x}`,
    ans: "" + (n + x),
  };
}

function nFoil() {
  let n = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function nSq1() {
  let n = Math.floor(Math.random() * (40 - 10 + 1)) + 10;
  return {
    body: `${n} ^ 2`,
    ans: "" + n * n,
  };
}

function nSq2() {
  let n = Math.floor(Math.random() * (60 - 41 + 1)) + 41;
  return {
    body: `${n} ^ 2`,
    ans: "" + n * n,
  };
}

function nTens() {
  let tensDigit = Math.floor(Math.random() * 6) + 1;
  let nOnesDigit = Math.floor(Math.random() * 10) + 1;
  let xOnesDigit = 10 - nOnesDigit;

  let n = tensDigit * 10 + nOnesDigit;
  let x = tensDigit * 10 + xOnesDigit;

  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function nSum() {
  let n = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
  let x = Math.floor(Math.random() * (8 - 1 + 1)) + 1;

  return {
    body: `${x} + ${x * 2} + ${x * 3} + \\dots + ${x * n}`,
    ans: "" + x * ((n * (n + 1)) / 2),
  };
}

function nEstim() {
  let operation = Math.random() < 0.5 ? "multiply" : "divide";
  let num1, num2;
  let correctAnswer;

  if (operation === "multiply") {
    num1 = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    num2 = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    correctAnswer = num1 * num2;
  } else {
    num1 = Math.floor(Math.random() * 90000) + 10000;
    num2 = Math.floor(Math.random() * 900) + 100;
    correctAnswer = num1 / num2;
  }

  return {
    body:
      operation === "multiply"
        ? `${num1} \\times ${num2}`
        : `${num1} \\div ${num2}`,
    ans: correctAnswer,
  };
}

function nless100() {
  let n = Math.floor(Math.random() * (99 - 90 + 1)) + 90;
  let x = Math.floor(Math.random() * (99 - 80 + 1)) + 80;

  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function nmore100() {
  let n = Math.floor(Math.random() * (120 - 110 + 1)) + 101;
  let x = Math.floor(Math.random() * (120 - 100 + 1)) + 101;

  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function nmix100() {
  function getRandomN() {
    let n;
    do {
      n = Math.floor(Math.random() * (95 - 80 + 1)) + 80;
    } while (n === 100);
    return n;
  }
  function getRandomX() {
    let x;
    do {
      x = Math.floor(Math.random() * (115 - 100 + 1)) + 100;
    } while (x === 100);
    return x;
  }
  let n = getRandomN();
  let x = getRandomX();

  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function decandfrac() {
  if (Math.random() < 0.75) {
    return fractodec();
  } else {
    return decToFrac();
  }
}

function fractodec() {
  let fracarr = [7, 8, 9, 11, 16];
  let randomIndex = Math.floor(Math.random() * fracarr.length);
  let denominator = fracarr[randomIndex];
  const small = window.innerWidth <= 768;
  let numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
  let decimalValue = (numerator / denominator).toString();

  let answer;
  if (denominator === 8 || denominator === 16) {
    answer = (numerator / denominator).toString().replace(/^0\./, ".");
  } else {
    answer = decimalValue.includes(".")
      ? decimalValue
          .substring(0, decimalValue.indexOf(".") + 4)
          .replace(/^0+/, "")
      : decimalValue + ".000";
  }

  return {
    body: small
      ? ` \\text{  }${numerator}/${denominator}\\newline \\text{ (first three} \\newline \\text{decimals)}`
      : `${numerator}/${denominator} \\text{ (first three decimals)}`,
    ans: answer,
  };
}

function decToFrac() {
  const examples = [
    { decimal: 0.0625, fraction: "1/16" },
    { decimal: 0.0909, fraction: "1/11" },
    { decimal: 0.1111, fraction: "1/9" },
    { decimal: 0.125, fraction: "1/8" },
    { decimal: 0.142857, fraction: "1/7" },
    { decimal: 0.1818, fraction: "2/11" },
    { decimal: 0.2222, fraction: "2/9" },
    { decimal: 0.285714, fraction: "2/7" },
    { decimal: 0.1875, fraction: "3/16" },
    { decimal: 0.2727, fraction: "3/11" },
    { decimal: 0.375, fraction: "3/8" },
    { decimal: 0.4285714, fraction: "3/7" },
    { decimal: 0.3636, fraction: "4/11" },
    { decimal: 0.4444, fraction: "4/9" },
    { decimal: 0.5714, fraction: "4/7" },
    { decimal: 0.3125, fraction: "5/16" },
    { decimal: 0.4545, fraction: "5/11" },
    { decimal: 0.5555, fraction: "5/9" },
    { decimal: 0.625, fraction: "5/8" },
    { decimal: 0.714, fraction: "5/7" },
    { decimal: 0.5454, fraction: "6/11" },
    { decimal: 0.85714, fraction: "6/7" },
    { decimal: 0.4375, fraction: "7/16" },
    { decimal: 0.6363, fraction: "7/11" },
    { decimal: 0.7777, fraction: "7/9" },
    { decimal: 0.875, fraction: "7/8" },
    { decimal: 0.7272, fraction: "8/11" },
    { decimal: 0.8888, fraction: "8/9" },
    { decimal: 0.5625, fraction: "9/16" },
    { decimal: 0.8181, fraction: "9/11" },
    { decimal: 0.909, fraction: "10/11" },
    { decimal: 0.6875, fraction: "11/16" },
    { decimal: 0.8125, fraction: "13/16" },
    { decimal: 0.9375, fraction: "15/16" },
  ];

  const randomIndex = Math.floor(Math.random() * examples.length);
  const { decimal, fraction } = examples[randomIndex];
  const small = window.innerWidth <= 768;
  let percentage = (decimal * 100).toFixed(2);
  percentage = percentage.replace(/\.00$/, "");

  const isRepeating =
    decimal.toString().includes("...") ||
    examples.some((e) => e.decimal === decimal);

  const ans = isRepeating ? fraction : percentage;

  return {
    body: small
      ? `${percentage}\\% \\newline \\text{ as a fraction}`
      : `${percentage}\\% \\text{ as a fraction}`,
    ans: ans,
  };
}
function decAdditionandSub() {
  let n1 = Math.random() * 1000;
  let n2 = Math.random() * 1000;
  let operation = Math.random() < 0.5 ? "add" : "subtract";
  let x = n1.toFixed(2);
  let y = n2.toFixed(2);
  let result;
  if (operation === "add") {
    result = (parseFloat(x) + parseFloat(y)).toFixed(2);
    return {
      body: `${x} + ${y}`,
      ans: result,
    };
  } else {
    result = (parseFloat(x) - parseFloat(y)).toFixed(2);
    return {
      body: `${x} - ${y}`,
      ans: result,
    };
  }
}

function romanNum() {
  const romanNumerals: { [key: string]: number } = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  const small = window.innerWidth <= 768;
  const romanNumeralValues = [
    { value: 1000, numeral: "M" },
    { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" },
    { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];
  function toRoman(num: number): string {
    let result = "";
    for (const { value, numeral } of romanNumeralValues) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }
  const number = Math.floor(Math.random() * 3990) + 10;
  const romanNumeral = toRoman(number);
  function toArabic(roman: string): number {
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const current = romanNumerals[roman[i]];
      const next = romanNumerals[roman[i + 1]];
      if (next && current < next) {
        result -= current;
      } else {
        result += current;
      }
    }
    return result;
  }

  const arabicNumber = toArabic(romanNumeral);

  return {
    body: small
      ? `\\text{}${romanNumeral}\\newline \\text{ (in Arabic} \\newline \\text{Numeral)}`
      : `${romanNumeral} \\text{ (in Arabic Numeral)}`,
    ans: "" + arabicNumber,
  };
}
function nCube() {
  let n = Math.floor(Math.random() * (20 + 1)) + 1;

  return {
    body: `{${n} ^ 3}`,
    ans: "" + n * n * n,
  };
}
function nGCD() {
  function gcd(a: number, b: number) {
    while (b !== 0) {
      let temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  let n = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  let xx = gcd(n, x);

  while (xx === 1) {
    n = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    x = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    xx = gcd(n, x);
  }

  return {
    body: `\\text{GCD of } ${n} \\text{ and } ${x}`,
    ans: "" + xx,
  };
}

function nLCM() {
  function gcd(a: number, b: number): number {
    while (b !== 0) {
      let temp: number = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  function lcm(a: number, b: number): number {
    return (a * b) / gcd(a, b);
  }

  let n, x;
  do {
    n = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    x = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  } while (gcd(n, x) === 1);
  return {
    body: `\\text{LCM of } ${n} \\text{ and } ${x}`,
    ans: "" + lcm(n, x),
  };
}
function toBase10() {
  let operation = Math.floor(Math.random() * 8);
  const small = window.innerWidth <= 768;
  if (operation === 0) {
    let num = "";
    let length = Math.floor(Math.random() * 6) + 2;
    let firstDigit = Math.floor(Math.random() * 1) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 2);
      num += digit.toString();
    }
    let n = parseInt(num, 2);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 2} \\newline \\text{in base 10}`
        : `${num} \\text{ base 2 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 1) {
    let num = "";
    let length = Math.floor(Math.random() * 3) + 2;
    let firstDigit = Math.floor(Math.random() * 2) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 3);
      num += digit.toString();
    }
    let n = parseInt(num, 3);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 3} \\newline \\text{in base 10}`
        : `${num} \\text{ base 3 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 2) {
    let num = "";
    let length = Math.floor(Math.random() * 3) + 2;
    let firstDigit = Math.floor(Math.random() * 3) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 4);
      num += digit.toString();
    }
    let n = parseInt(num, 4);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 4} \\newline \\text{in base 10}`
        : `${num} \\text{ base 4 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 3) {
    let num = "";
    let length = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    let firstDigit = Math.floor(Math.random() * 2) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 5);
      num += digit.toString();
    }
    let n = parseInt(num, 5);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 5} \\newline \\text{in base 10}`
        : `${num} \\text{ base 5 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 4) {
    let num = "";
    let length = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    let firstDigit = Math.floor(Math.random() * 5) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 6);
      num += digit.toString();
    }
    let n = parseInt(num, 6);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 6} \\newline \\text{in base 10}`
        : `${num} \\text{ base 6 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 5) {
    let num = "";
    let length = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    let firstDigit = Math.floor(Math.random() * 6) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 7);
      num += digit.toString();
    }
    let n = parseInt(num, 7);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 7} \\newline \\text{in base 10}`
        : `${num} \\text{ base 7 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 6) {
    let num = "";
    let length = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    let firstDigit = Math.floor(Math.random() * 7) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 8);
      num += digit.toString();
    }
    let n = parseInt(num, 8);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 8} \\newline \\text{in base 10}`
        : `${num} \\text{ base 8 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }

  if (operation === 7) {
    let num = "";
    let length = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    let firstDigit = Math.floor(Math.random() * 8) + 1;
    num += firstDigit.toString();
    for (let i = 1; i < length; i++) {
      let digit = Math.floor(Math.random() * 9);
      num += digit.toString();
    }
    let n = parseInt(num, 9);
    let convertedToBase10 = parseInt(n.toString(), 10);
    return {
      body: small
        ? `${num} \\text{ base 9} \\newline \\text{in base 10}`
        : `${num} \\text{ base 9 in base 10}`,
      ans: convertedToBase10.toString(),
    };
  }
}

function toBaseX() {
  let x: number = Math.floor(Math.random() * (9 - 2 + 1)) + 2;
  if(x === 2) {
    let n: number = Math.floor(Math.random() * (256 - 10 + 1)) + 10;
  }
  let n: number = Math.floor(Math.random() * (999 - 10 + 1)) + 10;
  const small = window.innerWidth <= 768;
  function convertToBaseX(number: number, base: number): string {
    let result: string = "";
    while (number > 0) {
      result = (number % base).toString() + result;
      number = Math.floor(number / base);
    }
    return result;
  }
  let result: string = convertToBaseX(n, x);
  return {
    body: small
      ? `${n} \\text{ base 10} \\newline \\text{in base ${x}}`
      : `${n} \\text{ base 10 in base ${x}}`,
    ans: `${result}`,
  };
}
function base248() {
  let conversionResult: string;
  let result: string;
  let randomFunctionIndex: number = Math.floor(Math.random() * 6);
  let randomNumberBase8: number = Math.floor(Math.random() * 512);
  let randomNumberBase2: number = Math.floor(Math.random() * 1024);
  let randomNumberBase4: number = Math.floor(Math.random() * 256);
  const small = window.innerWidth <= 768;
  function base8to2(base8: string): string {
    return parseInt(base8, 8).toString(2);
  }

  function base8to4(base8: string): string {
    return parseInt(base8, 8).toString(4);
  }

  function base2to4(base2: string): string {
    return parseInt(base2, 2).toString(4);
  }

  function base2to8(base2: string): string {
    return parseInt(base2, 2).toString(8);
  }

  function base4to2(base4: string): string {
    return parseInt(base4, 4).toString(2);
  }

  function base4to8(base4: string): string {
    return parseInt(base4, 4).toString(8);
  }

  if (randomFunctionIndex === 0) {
    let base8Number: string = randomNumberBase8.toString(8);
    conversionResult = small
      ? `${base8Number} \\text{ in base 8 } \\newline \\text{in base 2}`
      : `${base8Number} \\text{ in base 8 in base 2}`;
    result = base8to2(base8Number);
  } else if (randomFunctionIndex === 1) {
    let base8Number: string = randomNumberBase8.toString(8);
    conversionResult = small
      ? `${base8Number}  \\text{ in base 8 } \\newline \\text{in base 4}`
      : `${base8Number} \\text{ in base 8 in base 4}`;
    result = base8to4(base8Number);
  } else if (randomFunctionIndex === 2) {
    let base2Number: string = randomNumberBase2.toString(2);
    conversionResult = small
      ? `${base2Number} \\newline \\text{ in base 2 } \\newline \\text{in base 8}`
      : `${base2Number} \\text{ in base 2 in base 8}`;
    result = base2to8(base2Number);
  } else if (randomFunctionIndex === 3) {
    let base2Number: string = randomNumberBase2.toString(2);
    conversionResult = small
      ? `${base2Number} \\newline \\text{ in base 2 } \\newline \\text{in base 4}`
      : `${base2Number} \\text{ in base 2 in base 4}`;
    result = base2to4(base2Number);
  } else if (randomFunctionIndex === 4) {
    let base4Number: string = randomNumberBase4.toString(4);
    conversionResult = small
      ? `${base4Number} \\text{ in base 4 } \\newline \\text{in base 2}`
      : `${base4Number} \\text{ in base 4 in base 2}`;
    result = base4to2(base4Number);
  } else if (randomFunctionIndex === 5) {
    let base4Number: string = randomNumberBase4.toString(4);
    conversionResult = small
      ? `${base4Number}  \\text{ in base 4 } \\newline \\text{in base 8}`
      : `${base4Number} \\text{ in base 4 in base 8}`;
    result = base4to8(base4Number);
  } else {
    conversionResult = "Invalid function index";
    result = "";
  }

  return {
    body: conversionResult,
    ans: result,
  };
}
function intdivisors() {
  let n = Math.floor(Math.random() * 100 - 12 + 1) + 12;
  let sum = 0;
  const small = window.innerWidth <= 768;
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) {
      sum += i;
    }
  }
  return {
    body: small
      ? `\\text{The sum of the positive}\\newline \\text{integral divisors of } ${n}`
      : `\\text{The sum of the positive integral divisors of } ${n}`,
    ans: "" + sum,
  };
}

function primeDiv() {
  let n: number = Math.floor(Math.random() * 130) + 1;
  const small = window.innerWidth <= 768;
  function isPrime(num: number): boolean {
    if (num <= 1) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
      if (num % i === 0) return false;
    }
    return true;
  }
  let sum: number = 0;
  for (let i = 1; i <= n; i++) {
    if (n % i === 0 && isPrime(i)) {
      sum += i;
    }
  }
  return {
    body: small
      ? `\\text{The sum of the prime} \\newline \\text{divisors of }${n}`
      : `\\text{The sum of the prime divisors of }${n}`,
    ans: "" + sum,
  };
}

function nover90() {
  let randomValue = Math.floor(Math.random() * 4);
  let n, result, truncatedResult;
  const small = window.innerWidth <= 768;
  if (randomValue === 0) {
    n = Math.floor(Math.random() * 89) + 1;
    result = n / 90;
    truncatedResult = Math.floor(result * 1000) / 1000;
    return {
      body: small
        ? `\\text{What are the first}\\newline \\text{3 digits of } \\frac{${n}}{90}  `
        : `\\text{What are the first 3 digits of }  \\frac{${n}}{90}  `,
      ans: truncatedResult.toString().substring(1, 5),
    };
  } else if (randomValue === 1) {
    n = Math.floor(Math.random() * 899) + 1;
    result = n / 900;
    truncatedResult = Math.floor(result * 1000) / 1000;
    return {
      body: small
        ? `\\text{What are the first}\\newline \\text{3 digits of } \\frac{${n}}{900}  `
        : `\\text{What are the first 3 digits of }  \\frac{${n}}{900}  `,
      ans: truncatedResult.toString().substring(1, 5),
    };
  } else if (randomValue === 2) {
    n = Math.floor(Math.random() * 98) + 1;
    result = n / 99;
    truncatedResult = Math.floor(result * 1000) / 1000;
    return {
      body: small
        ? `\\text{What are the first}\\newline \\text{3 digits of } \\frac{${n}}{99}  `
        : `\\text{What are the first 3 digits of }  \\frac{${n}}{99}  `,
      ans: truncatedResult.toString().substring(1, 5),
    };
  } else {
    n = Math.floor(Math.random() * 989) + 1;
    result = n / 990;
    truncatedResult = Math.floor(result * 1000) / 1000;
    return {
      body: small
        ? `\\text{What are the first}\\newline \\text{3 digits of } \\frac{${n}}{990}  `
        : `\\text{What are the first 3 digits of }  \\frac{${n}}{990}  `,
      ans: truncatedResult.toString().substring(1, 5),
    };
  }
}

function ntriangular() {
  let n = Math.floor(Math.random() * 25 - 5 + 1) + 5;
  let x = (n * (n + 1)) / 2;
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `\\text{What is the } ${n}\\text{th} \\newline \\text{trinagular} \\newline \\text{number}`
      : `\\text{What is the } ${n}\\text{th} \\text{ triangular number}`,
    ans: "" + x,
  };
}

function npentagonal() {
  let n = Math.floor(Math.random() * 25 - 5 + 1) + 5;
  let x = (n * (3 * n - 1)) / 2;
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `\\text{What is the } ${n}\\text{th} \\newline \\text{pentagonal} \\newline \\text{number}`
      : `\\text{What is the } ${n}\\text{th} \\text{ pentagonal number}`,
    ans: "" + x,
  };
}

function nhexagonal() {
  let n = Math.floor(Math.random() * 25 - 5 + 1) + 5;
  let x = n * (2 * n - 1);
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `\\text{What is the } ${n}\\text{th} \\newline \\text{hexagonal} \\newline \\text{number}`
      : `\\text{What is the } ${n}\\text{th} \\text{ hexagonal number}`,
    ans: "" + x,
  };
}

function nX22x2() {
  let n = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
  let squaredN = `${n}\u00B2`;
  let squaredNN = `${2 * n}\u00B2`;
  return {
    body: "" + squaredN + " + " + squaredNN,
    ans: "" + n * n * 5,
  };
}
function nX23x2() {
  let n = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
  let squaredN = `${n}\u00B2`;
  let squaredNN = `${3 * n}\u00B2`;
  return {
    body: "" + squaredN + " + " + squaredNN,
    ans: "" + n * n * 10,
  };
}
function complexNumber() {
  function getRandomNonZeroInt() {
    let num;
    do {
      num = Math.floor(Math.random() * 21) - 10;
    } while (num === 0);
    return num;
  }
  let a = getRandomNonZeroInt();
  let b = getRandomNonZeroInt();
  let c = getRandomNonZeroInt();
  let d = getRandomNonZeroInt();
  const small = window.innerWidth <= 768;
  let realPart = a * c - b * d;
  let imaginaryPart = a * d + b * c;
  let sum = realPart + imaginaryPart;
  let bFormatted = b >= 0 ? `+ ${b}i` : `- ${Math.abs(b)}i`;
  let dFormatted = d >= 0 ? `+ ${d}i` : `- ${Math.abs(d)}i`;
  return {
    body: small
      ? `(${a} ${bFormatted})(${c} ${dFormatted})` +
        " \\newline \\text{ a + b }"
      : `(${a} ${bFormatted})(${c} ${dFormatted})` + "  \\text{ = a + bi. a + b }",
    ans: "" + sum,
  };
}
function unitConversion() {
  const conversions: { [fromUnit: string]: { [toUnit: string]: number } } = {
    bushels: { pecks: 4 },
    pecks: { bushels: 0.25 },
    gallons: { quarts: 4, pints: 8, cups: 16, pecks: 0.25 },
    quarts: { gallons: 0.25, pints: 2, cups: 4, pecks: 0.0625 },
    pints: { gallons: 0.125, quarts: 0.5, cups: 2, pecks: 0.03125 },
    cups: { gallons: 0.0625, quarts: 0.25, pints: 0.5, pecks: 0.015625 },
  };
  const small = window.innerWidth <= 768;
  const units = Object.keys(conversions);
  const fromUnit = units[Math.floor(Math.random() * units.length)];
  const toUnits = Object.keys(conversions[fromUnit]);
  const toUnit = toUnits[Math.floor(Math.random() * toUnits.length)];
  const value = Math.floor(Math.random() * 100) + 2;

  let convertedValue = value * conversions[fromUnit][toUnit];

  const validEndings = [0, 0.25, 0.5, 0.75];
  const integerPart = Math.floor(convertedValue);
  let fractionalPart = convertedValue - integerPart;

  let exactFractionalPart =
    validEndings.find((v) => Math.abs(fractionalPart - v) < 0.0001) ?? 0;
  convertedValue = integerPart + exactFractionalPart;

  const formattedValue = Number.isInteger(convertedValue)
    ? convertedValue.toString()
    : convertedValue
        .toFixed(2)
        .replace(/\.00$/, "")
        .replace(/\.([1-9])0$/, ".$1");

  return {
    body: small
      ? `\\text{ How many } ${toUnit} \\newline \\text{ are in }  ${value} \\text{ } ${fromUnit}?`
      : `\\text{ How many } ${toUnit}  \\text{ are in } ${value}\\text{ } ${fromUnit}?`,
    ans: formattedValue,
  };
}

function xandx1() {
  let n = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
  let squaredN = `${n}\u00B2`;
  let squaredNN = `${n + 1}\u00B2`;

  return {
    body: squaredN + " + " + squaredNN,
    ans: "" + n * n + (n + 1) * (n + 1),
  };
}

function abab() {
  let n = Math.floor(Math.random() * 14) + 2;
  let x = Math.floor(Math.random() * 14) + 2;

  while (n === x || (n - x) ** 2 >= n * x) {
    x = Math.floor(Math.random() * 14) + 2;
  }

  let numerator = (n - x) ** 2;
  let denominator = n * x;

  function gcd(a: number, b: number): number {
    while (b !== 0) {
      let temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  let gcdValue = gcd(numerator, denominator);

  numerator /= gcdValue;
  denominator /= gcdValue;

  return {
    body: `\\frac{${n}}{${x}} \\text{ + }\\frac{${x}}{${n}}`,
    ans: "2 " + numerator + "/" + denominator,
  };
}

function ngon() {
  const polygons = [
    { sides: 4, name: "Square" },
    { sides: 5, name: "Pentagon" },
    { sides: 6, name: "Hexagon" },
    { sides: 7, name: "Heptagon" },
    { sides: 8, name: "Octagon" },
    { sides: 9, name: "Nonagon" },
    { sides: 10, name: "Decagon" },
  ];
  const small = window.innerWidth <= 768;
  let randomIndex = Math.floor(Math.random() * polygons.length);
  let selectedPolygon = polygons[randomIndex];
  let diagonals = (selectedPolygon.sides * (selectedPolygon.sides - 3)) / 2;

  return {
    body: small
      ? `\\text{  Number of } \\newline \\text{diagonals in a } \\newline ${selectedPolygon.name}`
      : `\\text{Number of diagonals in a } ${selectedPolygon.name}`,
    ans: "" + diagonals,
  };
}

function sumofncub() {
  let n = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
  let squaredN = `${n}\u{00B3}`;
  let sum = ((n * (n + 1)) / 2) ** 2;
  return {
    body: "1\u{00B2} + 2\u{00B2} + 3\u{00B2} + ... + " + squaredN,
    ans: "" + sum,
  };
}
function alternatingsum() {
  let n = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
  let sum = 0;
  let sequence = "";
  const superscript2 = "\u00B2";
  let startsWithNegative = Math.random() < 0.5;
  let terms = [];

  for (let i = 1; i <= n; i++) {
    let sign = i % 2 === 0 ? -1 : 1;
    if (startsWithNegative) {
      sign *= -1;
    }
    let term = sign * Math.pow(i, 2);
    sum += term;
    terms.push(`${sign === 1 ? "+" : "-"}${i}${superscript2}`);
  }

  if (terms[0][0] === "+") {
    terms[0] = terms[0].substring(1);
  }

  if (n > 4) {
    sequence = terms.slice(0, 3).join(" ") + " ... " + terms[n - 1];
  } else {
    sequence = terms.join(" ");
  }

  return {
    body: sequence,
    ans: "" + sum,
  };
}

function calculateMean() {
  let count = Math.floor(Math.random() * 3) + 4;
  let numbers = [];
  let sum = 0;

  for (let i = 0; i < count - 1; i++) {
    let randomTwoDigit = Math.floor(Math.random() * 30) + 10;
    sum += randomTwoDigit;
    numbers.push(randomTwoDigit);
  }

  let preliminaryMean = sum / (count - 1);
  let targetMean = Math.round(preliminaryMean * 2) / 2;
  let requiredSum = targetMean * count;
  let lastNumber = requiredSum - sum;

  if (lastNumber < 10 || lastNumber > 99) {
    lastNumber = Math.max(10, Math.min(99, lastNumber));
    requiredSum = sum + lastNumber;
    targetMean = Math.round((requiredSum / count) * 2) / 2;
  }
  const small = window.innerWidth <= 768;
  numbers.push(lastNumber);
  sum += lastNumber;
  let mean = sum / count;

  return {
    body: small
      ? `\\text{The mean of }\\newline  ${numbers}\\newline  \\text{ is}`
      : `\\text{The mean of }  ${numbers} \\text{ is}`,
    ans: "" + mean,
  };
}

function calculateMedian() {
  let count = Math.floor(Math.random() * 5) + 7;
  let numbers = [];
  for (let i = 0; i < count; i++) {
    let randomSingleDigit = Math.floor(Math.random() * 9) + 1;
    numbers.push(randomSingleDigit);
  }

  let middle = Math.floor(numbers.length / 2);
  let median;
  if (numbers.length % 2 === 0) {
    median = (numbers[middle - 1] + numbers[middle]) / 2;
  } else {
    median = numbers[middle];
  }
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `\\text{The median of }\\newline  ${numbers} \\newline \\text{ is}`
      : `\\text{The median of }  ${numbers} \\text{ is}`,
    ans: "" + median,
  };
}
function meanmedian() {
  let randomChoice = Math.random();
  if (randomChoice < 0.5) {
    return calculateMean();
  } else {
    return calculateMedian();
  }
}

function geometricmean() {
  const isSmallScreen = window.innerWidth <= 768;

  let n = Math.floor(Math.random() * 22 - 4 + 1) + 4;
  let numbers = [4, 9, 16, 25, 36, 49, 64];
  let isThreeNumbers = Math.random() < 0.5;
  let randomIndex1 = Math.floor(Math.random() * numbers.length);

  if (isThreeNumbers) {
    let supern1 = n * 2;
    let supern2 = n * 4;
    let answer = 2 * n;
    return {
      body: isSmallScreen
        ? `\\text{What is the geometric} \\newline \\text{mean beoftween} \\newline ${n}  \\text{, } ${supern1} \\newline \\text{, and } ${supern2}?`
        : `\\text{What is the geometric mean of } ${n} \\text{, } ${supern1} \\text{, and } ${supern2}?`,
      ans: "" + answer,
    };
  } else {
    let supern = n * numbers[randomIndex1];
    return {
      body: isSmallScreen
        ? `\\text{What is the geometric} \\newline \\text{mean of} \\newline ${n}  \\text{ and } ${supern}?`
        : `\\text{What is the geometric mean of } ${n} \\text{ and } ${supern}?`,
      ans: "" + Math.sqrt(n * supern),
    };
  }
}
function harmonicMean() {
  function gcd(a: number, b: number): number {
    while (b !== 0) {
      let temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  function toMixedNumber(numerator: number, denominator: number): string {
    if (numerator === 0) {
      return "0";
    }

    let wholePart = Math.floor(numerator / denominator);
    let remainder = numerator % denominator;
    if (remainder === 0) {
      return "" + wholePart;
    } else {
      return "" + wholePart + " " + remainder + "/" + denominator;
    }
  }

  let count = Math.floor(Math.random() * 2) + 2;
  let numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * 9) + 1);
  }

  function calculateHarmonicMean(numbers: number[]): number {
    let sumReciprocals = numbers.reduce((acc, num) => acc + 1 / num, 0);
    return numbers.length / sumReciprocals;
  }

  let harmonicMeanValue = calculateHarmonicMean(numbers);

  let precision = 100000;
  let fractionalPart = harmonicMeanValue - Math.floor(harmonicMeanValue);
  let numerator = Math.round(fractionalPart * precision);
  let denominator = precision;
  let gcdValue = gcd(numerator, denominator);
  numerator /= gcdValue;
  denominator /= gcdValue;
  let wholePart = Math.floor(harmonicMeanValue);
  numerator += wholePart * denominator;
  gcdValue = gcd(numerator, denominator);
  numerator /= gcdValue;
  denominator /= gcdValue;
  let mixedNumber = toMixedNumber(numerator, denominator);
  const small = window.innerWidth <= 768;
  return {
    body: small
      ? `\\text{What is the harmonic mean} \\newline  \\text{of } ${numbers.join(
          `\\text{, } `
        )} \\text{(mixed number)}`
      : `\\text{What is the harmonic mean of } ${numbers.join(
          `\\text{, } `
        )} \\text{ (mixed number)}`,
    ans: mixedNumber,
  };
}

function estimation() {
  function cuberoot() {
    let hugeNumber =
      Math.floor(Math.random() * (Math.pow(10, 9) - 100000 + 1)) + 100000;
    let cubeRoot = Math.cbrt(hugeNumber);
    return {
      body: `³√${hugeNumber}`,
      ans: `${cubeRoot}`,
    };
  }

  function sqaureroot() {
    let smallerNumber = Math.floor(Math.random() * (40000 - 10000 + 1)) + 10000;
    let squareRoot = Math.sqrt(smallerNumber);
    return {
      body: `√${smallerNumber}`,
      ans: `${squareRoot}`,
    };
  }

  if (Math.random() < 0.5) {
    return cuberoot();
  } else {
    return sqaureroot();
  }
}

function x100ofy() {
  let twoDigitNumber = Math.floor(Math.random() * 90) + 10;
  let percentage = Math.floor(Math.random() * 100) + 1;
  let result = (percentage / 100) * twoDigitNumber;
  return {
    body: `${percentage}\\% \\text{ of } ${twoDigitNumber}`,
    ans: "" + result,
  };
}

function aboverc() {
  function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getCloseRandomInt(
    base: number,
    min: number,
    max: number,
    range: number
  ): number {
    let result;
    do {
      result = getRandomInt(
        Math.max(min, base - range),
        Math.min(max, base + range)
      );
    } while (result === base);
    return result;
  }

  let a = getRandomInt(10, 30);
  let b = getCloseRandomInt(a, 10, 30, 5);
  let c = getCloseRandomInt(b, 10, 30, 5);

  let body = `${a} \\times \\frac{${b}}{${c}}`;
  let ans = `${(a * b) / c}`;
  let numerator = a * b;
  let gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
  let commonDivisor = gcd(numerator, c);
  numerator /= commonDivisor;
  c /= commonDivisor;

  let integerPart = Math.floor(numerator / c);
  let remainder = numerator % c;
  let mixedNumber =
    integerPart > 0
      ? "" + integerPart + " " + remainder + "/" + c
      : "" + remainder + "/" + c;

  return {
    body: body,
    ans: "" + mixedNumber,
  };
}

function diffofsq() {
  function generateNumbersWithSameTensDigit() {
    let tensDigit = Math.floor(Math.random() * 9) + 1;
    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    let number1 = tensDigit * 10 + a;
    let number2 = tensDigit * 10 + b;
    return {
      number1: number1,
      number2: number2,
    };
  }

  let numbers = generateNumbersWithSameTensDigit();

  let num1 = numbers.number1;
  let num2 = numbers.number2;

  let difference = num1 * num1 - num2 * num2;
  let body = `${num1}² - ${num2}²`;
  let ans = difference;

  return {
    body: body,
    ans: "" + ans,
  };
}

function fib() {
  function generateCustomFibonacciSequence() {
    let numTerms = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
    let firstTerm = Math.floor(Math.random() * 20) + 1;
    let secondTerm = Math.floor(Math.random() * 20) + 1;

    let sequence = [firstTerm, secondTerm];

    for (let i = 2; i < numTerms; i++) {
      sequence.push(sequence[i - 1] + sequence[i - 2]);
    }

    return sequence;
  }

  let fibonacciSequence = generateCustomFibonacciSequence();

  function calculateCustomSum(sequence: number[]) {
    let sum = 0;
    for (let i = 0; i < sequence.length; i++) {
      sum += sequence[i];
    }
    return sum;
  }
  let sum = calculateCustomSum(fibonacciSequence);

  let body =
    fibonacciSequence.slice(0, 3).join(" + ") +
    `\\text{+ ... }` +
    "+ " +
    fibonacciSequence.slice(-2).join(" + ");

  return {
    body: body,
    ans: "" + sum,
  };
}

function tripledigit() {
  let n = Math.floor(Math.random() * 999 - 100 + 1) + 100;
  let x = Math.floor(Math.random() * 999 - 100 + 1) + 100;

  return {
    body: `${n} \\times ${x}`,
    ans: "" + n * x,
  };
}

function tripdigitsq() {
  let n = 100;
  let x = Math.floor(Math.random() * 10) + 1;
  let b = Math.floor(Math.random() * 21) + 1;
  let num = n * x + b;
  return {
    body: `${num}²`,
    ans: "" + Math.pow(num, 2),
  };
}
function tripdigitcube() {
  let n = 100;
  let x = Math.floor(Math.random() * 10) + 1;
  let b = Math.floor(Math.random() * 16) + 1;
  let num = n * x + b;
  return {
    body: `${num}³`,
    ans: "" + Math.pow(num, 3),
  };
}

function xcubedycubed() {
  let x = Math.floor(Math.random() * 16) + 1;
  let y = Math.floor(Math.random() * 16) + 1;
  let xx = Math.pow(x, 3);
  let yy = Math.pow(y, 3);
  let diff = x - y;
  return {
    body: "(" + `${x}³` + " - " + `${y}³` + ")/(" + x + "-" + y + ")",
    ans: "" + (xx - yy) / diff,
  };
}
