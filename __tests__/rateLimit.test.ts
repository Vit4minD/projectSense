import { describe, expect, it } from "vitest";
import { createInMemoryRateLimiter } from "@/lib/server/rateLimit";

describe("createInMemoryRateLimiter", () => {
  it("allows up to `limit` calls in a window and blocks the next", async () => {
    let clock = 1_000;
    const limiter = createInMemoryRateLimiter({
      limit: 3,
      windowMs: 60_000,
      now: () => clock,
    });

    for (let i = 0; i < 3; i += 1) {
      const r = await limiter.limit("u1");
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(3 - (i + 1));
      expect(r.retryAfterMs).toBe(0);
    }

    const blocked = await limiter.limit("u1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // Window opened at clock=1000, resets at 61000; still at clock=1000.
    expect(blocked.resetAt).toBe(61_000);
    expect(blocked.retryAfterMs).toBe(60_000);
  });

  it("tracks each key independently", async () => {
    let clock = 0;
    const limiter = createInMemoryRateLimiter({
      limit: 1,
      windowMs: 1_000,
      now: () => clock,
    });

    expect((await limiter.limit("a")).allowed).toBe(true);
    expect((await limiter.limit("a")).allowed).toBe(false);
    // Different key has its own fresh bucket.
    expect((await limiter.limit("b")).allowed).toBe(true);
  });

  it("resets the bucket after the window elapses", async () => {
    let clock = 0;
    const limiter = createInMemoryRateLimiter({
      limit: 2,
      windowMs: 10_000,
      now: () => clock,
    });

    expect((await limiter.limit("u1")).allowed).toBe(true);
    expect((await limiter.limit("u1")).allowed).toBe(true);
    expect((await limiter.limit("u1")).allowed).toBe(false);

    // Advance exactly to resetAt — bucket.resetAt <= current opens a new window.
    clock = 10_000;
    const afterReset = await limiter.limit("u1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
    expect(afterReset.resetAt).toBe(20_000);
  });
});
