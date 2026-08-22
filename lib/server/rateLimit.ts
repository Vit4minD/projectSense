// Best-effort, per-instance rate limiter. Module-scope state persists across
// warm serverless invocations on the same instance; it resets on cold start
// and is NOT shared across instances. This is an intentional trade-off for a
// small-audience app — it catches accidental cost blowups / a stuck client.
// To upgrade to a durable limiter later, implement the same `RateLimiter`
// interface with @upstash/ratelimit and swap the singletons exported below.

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

export type InMemoryRateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
};

type Bucket = { count: number; resetAt: number };

const SWEEP_THRESHOLD = 5_000;

export function createInMemoryRateLimiter(
  opts: InMemoryRateLimitOptions,
): RateLimiter {
  const { limit, windowMs } = opts;
  const now = opts.now ?? (() => Date.now());
  const buckets = new Map<string, Bucket>();

  function sweep(current: number): void {
    if (buckets.size < SWEEP_THRESHOLD) return;
    for (const [k, b] of buckets) {
      if (b.resetAt <= current) buckets.delete(k);
    }
  }

  return {
    async limit(key: string): Promise<RateLimitResult> {
      const current = now();
      sweep(current);

      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= current) {
        bucket = { count: 0, resetAt: current + windowMs };
        buckets.set(key, bucket);
      }

      bucket.count += 1;
      const allowed = bucket.count <= limit;
      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
        retryAfterMs: allowed ? 0 : bucket.resetAt - current,
      };
    },
  };
}

export const generateTestLimiter = createInMemoryRateLimiter({
  limit: 10,
  windowMs: 60_000, // 10 test generations / minute / user
});

export const gradeTestLimiter = createInMemoryRateLimiter({
  limit: 60,
  windowMs: 60_000, // 60 grades / minute / user (lighter)
});

export const feedbackLimiter = createInMemoryRateLimiter({
  limit: 5,
  windowMs: 60_000, // 5 feedback submissions / minute / user
});
