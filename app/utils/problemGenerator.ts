export const problemSet: { [key: number]: string } = {
  1: "n * 11",
  2: "n * 25",
  3: "n / 101",
  4: "n / 111",
  5: "n % x",
  6: "n - x",
  7: "n + x",
  8: "Nn * Xx",
  9: "SQUARES",
  10: "Tens Trick",
  11: "Σ : n(n+1)/2",
  12: "Estimation",
  13: "90-110 x n",
};

export const problemFunction: { [key: string]: Function } = {
  "1": n11,
};

function n11() {
  let num = Math.floor(Math.random() * (999 - 15 + 1)) + 15;
  return {
    body: "" + num + " * 11",
    ans: "" + num * 11,
  };
}
