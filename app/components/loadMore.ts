import { problemSet } from "../utils/problemGenerator";

export async function loadMore(page: number) {
  const n = Object.keys(problemSet).length;
  const data: number[] = [];
  for (let i = 1; i <= Math.min(n, page * 12); i++) {
    data.push(i);
  }
  return data;
}
