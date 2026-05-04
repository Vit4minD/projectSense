/** Format milliseconds as MM:SS.s with one decimal of a second. */
export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds - m * 60;
  return `${m.toString().padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

/** Format ms as a short "00.0s" used in time-bars and per-question rows. */
export function formatShort(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Mulberry32 — fast deterministic PRNG. Stable across runtimes; the same seed
 * always yields the same problem sequence for a given trick. Used for tests.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max] inclusive, using the provided RNG. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
