export const problemSet: { [key: number]: string } = {
  1: "\\(n \\times 11\\)",
  2: "\\(n \\times 25\\)",
  3: "\\(\\frac{n}{101}\\)",
  4: "\\(\\frac{n}{111}\\)",
  5: "\\(n  \\%  x\\)",
  6: "\\(n - x\\)",
  7: "\\(n + x\\)",
  8: "\\(NN \\times XX\\)",
  9: "\\(\\text{SQUARES}\\)",
  10: "\\(\\text{Tens Trick}\\)",
  11: "\\(\\Sigma : \\frac{n(n+1)}{2}\\)",
  12: "\\(\\text{Estimation}\\)",
  13: "\\(<100 \\text{ Multiplication}\\)",
  14: "\\(>100 \\text{ Multiplication}\\)",
  15: "\\(\\pm< 100 \\text{ Multiplication}\\)",
  16: "\\(\\text{Dec/Frac Conversion}\\)",
  17: "\\(\\text{Dec Addition/Subtraction}\\)",
  18: "\\(\\text{Roman Numerals}\\)",
  19: "\\(\\text{Cubes}\\)",
  20: "\\(\\text{GCD}\\)",
  21: "\\(\\text{LCM}\\)",
  22: "\\(\\text{Conversion into Base 10}\\)",
  23: "\\(\\text{Conversion from Base 10}\\)",
  24: "\\(\\text{Conversion of Base 2, 4, 8}\\)",
  25: "\\(\\text{Sum of Integral Divisors}\\)",
  26: "\\(\\text{Sum of Prime Divisors}\\)",
  27: "\\(\\frac{x}{90}, \\frac{x}{99}, \\frac{x}{900}, \\frac{x}{990}\\)",
  28: "\\(\\text{Triangular Numbers}\\)",
  29: "\\(\\text{Pentagonal Numbers}\\)",
  30: "\\(\\text{Hexagonal Numbers}\\)",
  31: "\\(x^2 + (2x)^2\\)",
  32: "\\(x^2 + (3x)^2\\)",
  33: "\\(\\text{Complex Number Multiplication}\\)",
  34: "\\(\\text{Unit Conversions}\\)",
  35: "\\(x^2 + (x+1)^2\\)",
  36: "\\(\\frac{a}{b} + \\frac{b}{a}\\)",
  37: "\\(\\# \\text{ of distinct diagonals in a polygon}\\)",
  38: "\\(\\text{Sum of } n \\text{ Squares}\\)",
  39: "\\(\\text{Alternating Sum of } n \\text{ Squares}\\)",
  40: "\\(\\text{Mean/Median}\\)",
  41: "\\(\\text{Geometric Mean}\\)",
  42: "\\(\\text{Harmonic Mean}\\)",
  43: "\\(\\text{Estimating Square/Cube Roots}\\)",
  44: "\\(\\frac{x}{100} \\text{ of } y\\)",
  45: "\\(\\frac{a \\times b}{c}\\)",
  46: "\\((a+b) \\times (a-b)\\)",
  47: "\\(\\text{Fibonacci Series}\\)",
  48: "\\(\\text{Special Sum of Squares}\\)",
  49: "\\(\\text{3-digit Squares}\\)",
  50: "\\(\\text{3-digit Cubes}\\)",
  51: "\\(\\frac{x^3-y^3}{x-y}\\)",
};

export const problemFunction: { [key: string]: Function } = {
  "1": n11,
  "2": n25,
  "3": n101,
  "4": n111,
  "5": nmod,
  "6": nminus,
  "7": nplus,
  "8": nFoil,
  "9": nSq1,
  "10": nSq2,
  "11": nTens,
  "12": nSum,
  "13": nEstim,
  "14": nless100,
  "15": nmore100,
  "16": nmix100,
  "17": decandfrac,
  "18": decAdditionandSub,
  "19": romanNum,
  "20": nCube,
};

function n11() {
  let num = Math.floor(Math.random() * (999 - 15 + 1)) + 15;
  return {
    body: "" + num + " * 11",
    ans: "" + num * 11,
  };
}
function n25() {
  let num = Math.floor(Math.random() * (200 - 12 + 1)) + 12;
  return {
    body: "" + num + " * 25",
    ans: "" + num * 25,
  };
}
function n101() {
  let num = 101 * (Math.floor(Math.random() * (999 - 100 + 1)) + 100);

  return {
    body: "" + num + " / 101",
    ans: "" + num / 101,
  };
}
function n111() {
  let num = 111 * (Math.floor(Math.random() * (999 - 100 + 1)) + 100);

  return {
    body: "" + num + "  / 111",
    ans: "" + num / 111,
  };
}
function nmod() {
  let n = Math.floor(Math.random() * (99999 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (11 - 3 + 1)) + 3;
  return {
    body: "" + n + " % " + x,
    ans: "" + (n % x),
  };
}
function nminus() {
  let n = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  let x = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  return {
    body: "" + n + " - " + x,
    ans: "" + (n - x),
  };
}
function nplus() {
  let n = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  let x = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
  return {
    body: "" + n + " + " + x,
    ans: "" + (n + x),
  };
}
function nFoil() {
  let n = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
  return {
    body: "" + n + " * " + x,
    ans: "" + n * x,
  };
}
function nSq1() {
  let n = Math.floor(Math.random() * (40 - 10 + 1)) + 10;
  return {
    body: "" + n + " * " + n,
    ans: "" + n * n,
  };
}
function nSq2() {
  let n = Math.floor(Math.random() * (60 - 41 + 1)) + 41;
  return {
    body: "" + n + " * " + n,
    ans: "" + n * n,
  };
}
function nTens() {
  let n = Math.floor(Math.random() * (60 - 10 + 1)) + 10;
  let x = Math.floor(Math.random() * (10 + 1));

  return {
    body: "" + (n + x) + " * " + (n - x),
    ans: "" + (n + x) * (n - x),
  };
}
function nSum() {
  let n = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
  let x = Math.floor(Math.random() * (8 - 1 + 1) + 1);

  return {
    body: "" + x + " + " + x * 2 + " + " + x * 3 + " +... + " + x * n,
    ans: "" + x * ((n * (n + 1)) / 2),
  };
}
function nEstim() {
  let operation = Math.random() < 0.5 ? "multiply" : "divide";
  let num1, num2;
  let correctAnswer, minAnswer, maxAnswer;

  if (operation === "multiply") {
    num1 = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    num2 = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    correctAnswer = num1 * num2;
  } else {
    num1 = Math.floor(Math.random() * 90000) + 10000;
    num2 = Math.floor(Math.random() * 900) + 100;
    correctAnswer = num1 / num2;
  }

  let percentage = 0.05;
  minAnswer = Math.floor(correctAnswer - correctAnswer * percentage);
  maxAnswer = Math.ceil(correctAnswer + correctAnswer * percentage);

  let generatedAnswer =
    Math.floor(Math.random() * (maxAnswer - minAnswer + 1)) + minAnswer;

  return {
    body: operation === "multiply" ? `${num1} * ${num2}` : `${num1} / ${num2}`,
    ans: [minAnswer, maxAnswer],
  };
}

function nless100() {
  let n = Math.floor(Math.random() * (100 - 80 + 1)) + 80;
  let x = Math.floor(Math.random() * (100 - 80 + 1)) + 80;

  return {
    body: "" + n + " * " + x,
    ans: "" + n * x,
  };
}
function nmore100() {
  let n = Math.floor(Math.random() * (120 - 100 + 1)) + 100;
  let x = Math.floor(Math.random() * (120 - 100 + 1)) + 100;

  return {
    body: "" + n + " * " + x,
    ans: "" + n * x,
  };
}
function nmix100() {
  let n = Math.floor(Math.random() * (120 - 80 + 1)) + 80;
  let x = Math.floor(Math.random() * (120 - 80 + 1)) + 80;

  return {
    body: "" + n + " * " + x,
    ans: "" + n * x,
  };
}
function decandfrac() {
  let fracarr = [7, 8, 9, 11, 16];
  let randomIndex = Math.floor(Math.random() * fracarr.length);
  let denominator = fracarr[randomIndex];

  let numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
  let decimalValue = (numerator / denominator).toFixed(3);

  return {
    body: `Represent ${numerator}/${denominator} as a decimal (3 decimals)`,
    ans: decimalValue,
  };
}
function decAdditionandSub() {
  let n1 = Math.random() * 1000; // Random number between 0 and 1000
  let n2 = Math.random() * 1000; // Random number between 0 and 1000
  let operation = Math.random() < 0.5 ? "add" : "subtract";

  // Convert to fixed 2 decimal places strings for display
  let x = n1.toFixed(2);
  let y = n2.toFixed(2);

  // Perform the arithmetic operation
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
  // Roman numeral characters with their corresponding values
  const romanNumerals: { [key: string]: number } = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

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

  // Function to convert an Arabic number to a Roman numeral
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

  // Generate a random number between 10 and 3999
  const number = Math.floor(Math.random() * 3990) + 10;
  const romanNumeral = toRoman(number);

  // Function to convert a Roman numeral to an Arabic number
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
    body: `${romanNumeral} (in Arabic Numeral)`,
    ans: "" + arabicNumber,
  };
}
function nCube() {
  let n = Math.floor(Math.random() * (20 + 1)) + 1;

  return {
    body: "" + n + " * " + n + " * " + n,
    ans: "" + n * n * n,
  };
}
