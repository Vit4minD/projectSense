export const problemSet: { [key: number]: string } = {
  1: "\\(n \\times 11\\)",
  2: "\\(n \\times 25\\)",
  3: "\\(\\frac{n}{101}\\)",
  4: "\\(\\frac{n}{111}\\)",
  5: "\\(n  \\%  x\\)",
  6: "\\(n - x\\)",
  7: "\\(n + x\\)",
  8: "\\(NN \\times XX\\)",
  9: "\\(\\text{SQUARES (10-41)}\\)",
  10: "\\(\\text{SQUARES (41-60)}\\)",
  11: "(\text{Tens Trick})",
  12: "(Sigma : \frac{n(n+1)}{2})",
  13: "(\text{Estimation})",
  14: "(<100 \text{ Multiplication})",
  15: "(>100 \text{ Multiplication})",
  16: "(pm< 100 \text{ Multiplication})",
  17: "(\text{Dec/Frac Conversion})",
  18: "(\text{Dec Addition/Subtraction})",
  19: "(\text{Roman Numerals})",
  20: "(\text{Cubes})",
  21: "(\text{GCD})",
  22: "(\text{LCM})",
  23: "(\text{Conversion into Base 10})",
  24: "(\text{Conversion from Base 10})",
  25: "(\text{Conversion of Base 2, 4, 8})",
  26: "(\text{Sum of Integral Divisors})",
  27: "(\text{Sum of Prime Divisors})",
  28: "(\frac{x}{90}, \frac{x}{99}, \frac{x}{900}, \frac{x}{990})",
  29: "(\text{Triangular Numbers})",
  30: "(\text{Pentagonal Numbers})",
  31: "(\text{Hexagonal Numbers})",
  32: "(x^2 + (2x)^2)",
  33: "(x^2 + (3x)^2)",
  34: "(\text{Complex Number Multiplication})",
  35: "(\text{Unit Conversions})",
  36: "(x^2 + (x+1)^2)",
  37: "(\frac{a}{b} + \frac{b}{a})",
  38: "(# \text{ of distinct diagonals in a polygon})",
  39: "(\text{Sum of } n \text{ Squares})",
  40: "(\text{Alternating Sum of } n \text{ Squares})",
  41: "(\text{Mean/Median})",
  42: "(\text{Geometric Mean})",
  43: "(\text{Harmonic Mean})",
  44: "(\text{Estimating Square/Cube Roots})",
  45: "(\frac{x}{100} \text{ of } y)",
  46: "(\frac{a \times b}{c})",
  47: "((a+b) \times (a-b))",
  48: "(\text{Fibonacci Series})",
  49: "(\text{Special Sum of Squares})",
  50: "(\text{3-digit Squares})",
  51: "(\text{3-digit Cubes})",
  52: "(\frac{x^3-y^3}{x-y})",
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
  "21": nGCD,
  "22": nLCM,
  "23": toBase10,
  "24": toBaseX,
  "25": base248,
  "26": intdivisors,
  "27": primeDiv,
  "28": nover90,
  "29": ntriangular,
  "30": npentagonal,
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
  let num = (Math.floor(Math.random() * (999 - 100 + 1)) + 100) * 111;

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

  return {
    body: operation === "multiply" ? `${num1} * ${num2}` : `${num1} / ${num2}`,
    ans: correctAnswer,
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
  let n1 = Math.random() * 1000;
  let n2 = Math.random() * 1000;
  let operation = Math.random() < 0.5 ? "add" : "subtract";
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
function nGCD() {
  let n = Math.floor(Math.random() * (99 - 10 + 1)) + 1;
  let x = Math.floor(Math.random() * (99 - 10 + 1)) + 1;

  function gcd(a: number, b: number): number {
    while (b !== 0) {
      let temp: number = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  return {
    body: "GCD of " + n + " and " + x,
    ans: "" + gcd(n, x),
  };
}

function nLCM() {
  let n = Math.floor(Math.random() * (99 - 10 + 1)) + 1;
  let x = Math.floor(Math.random() * (99 - 10 + 1)) + 1;
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
  return {
    body: "LCM of " + n + " and " + x,
    ans: "" + lcm(n, x),
  };
}
function toBase10() {
  const x = Math.floor(Math.random() * 8) + 2; // Random base between 2 and 9
  const n = generateValidNumber(x);

  function generateValidNumber(base: number): number {
    let num = "";
    const length = Math.floor(Math.random() * 3) + 1; // Length between 1 and 3 digits
    for (let i = 0; i < length; i++) {
      num += Math.floor(Math.random() * base).toString();
    }
    return parseInt(num, 10); // Return as an integer
  }

  function convertToBase10(number: number, base: number): number {
    return parseInt(number.toString(), base);
  }

  return {
    body: "Convert " + n + " base " + x + " to base 10",
    ans: convertToBase10(n, x).toString(),
  };
}

function toBaseX() {
  // Generate random numbers n and x
  let n: number = Math.floor(Math.random() * (999 - 10 + 1)) + 10;
  let x: number = Math.floor(Math.random() * (9 - 2 + 1)) + 2;

  // Function to convert number from base 10 to base x
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
    body: `Convert ${n} from base 10 to base ${x}`,
    ans: `${result}`,
  };
}
function base248() {
  let conversionResult: string;
  let result: string;
  let randomFunctionIndex: number = Math.floor(Math.random() * 6);
  let randomNumberBase8: number = Math.floor(Math.random() * 512); // Random number between 0 and 511 (since base 8 uses digits 0-7)

  // Conversion functions
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
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 2`;
    result = base8to2(base8Number);
  } else if (randomFunctionIndex === 1) {
    let base8Number: string = randomNumberBase8.toString(8);
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 4`;
    result = base8to4(base8Number);
  } else if (randomFunctionIndex === 2) {
    let base8Number: string = randomNumberBase8.toString(8);
    let base2Number: string = base8to2(base8Number);
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 4`;
    result = base2to4(base2Number);
  } else if (randomFunctionIndex === 3) {
    let base8Number: string = randomNumberBase8.toString(8);
    let base2Number: string = base8to2(base8Number);
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 8`;
    result = base2to8(base2Number);
  } else if (randomFunctionIndex === 4) {
    let base8Number: string = randomNumberBase8.toString(8);
    let base4Number: string = base8to4(base8Number);
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 2`;
    result = base4to2(base4Number);
  } else if (randomFunctionIndex === 5) {
    let base8Number: string = randomNumberBase8.toString(8);
    let base4Number: string = base8to4(base8Number);
    conversionResult = `Number ${base8Number} in base 8 = Number ??? in base 8`;
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
  let n = Math.floor(Math.random() * 1000) + 1;
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) {
      sum += i;
    }
  }
  return {
    body: "The sum of the postitve integral divisors of " + n,
    ans: "" + sum,
  };
}
function primeDiv() {
  let n: number = Math.floor(Math.random() * 1000) + 1;
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
    body: `The sum of the prime divisors of ${n}`,
    ans: `${sum}`,
  };
}

function nover90() {
  let randomValue = Math.floor(Math.random() * 3);
  if (randomValue === 0) {
    let n = Math.floor(Math.random() * 89) + 1;
    return {
      body: "What is " + n + "/90 as decimal (3 digits)",
      ans: "" + (n / 90).toFixed(3),
    };
  } else if (randomValue === 1) {
    let n = Math.floor(Math.random() * 899) + 1;
    return {
      body: "What is " + n + "/900 as decimal (3 digits)",
      ans: "" + (n / 900).toFixed(3),
    };
  } else {
    let n = Math.floor(Math.random() * 989) + 1;
    return {
      body: "What is " + n + "/990 as decimal (3 digits)",
      ans: "" + (n / 990).toFixed(3),
    };
  }
}
function ntriangular() {
  let n = Math.floor(Math.random() * 25 - 5 + 1) + 5;
  return {
    body: "1 + 2 + 3 +.... + " + n,
    ans: "" + (n * (n + 1)) / 2,
  };
}
function npentagonal() {
  let n = Math.floor(Math.random() * 25 - 5 + 1) + 5;
  let x = (n * (3 * n - 1)) / 2;
  return {
    body: "What is pentagonal number " + n,
    ans: "" + x,
  };
}
