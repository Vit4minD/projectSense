import { describe, expect, it } from "vitest";
import {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  normalizeRoomCode,
} from "@/lib/multiplayer/roomCode";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("generateRoomCode", () => {
  it("produces strings of length 5", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRoomCode()).toHaveLength(5);
    }
  });

  it("every character is in alphabet and never 0, 1, I, O, L", () => {
    const banned = new Set(["0", "1", "I", "O", "L"]);
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode();
      for (const ch of code) {
        expect(ROOM_CODE_ALPHABET).toContain(ch);
        expect(banned.has(ch)).toBe(false);
      }
    }
  });

  it("different RNG seeds produce different codes", () => {
    const a = generateRoomCode(mulberry32(1));
    const b = generateRoomCode(mulberry32(2));
    expect(a).not.toBe(b);

    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) codes.add(generateRoomCode());
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("normalizeRoomCode", () => {
  it("uppercases and validates input, rejecting bad chars or lengths", () => {
    expect(normalizeRoomCode("  ab23g  ")).toBe("AB23G");
    expect(normalizeRoomCode("ab23g")).toBe("AB23G");
    expect(normalizeRoomCode("abcdefg")).toBeNull();
    expect(normalizeRoomCode("abc1d")).toBeNull();
    expect(normalizeRoomCode("abc0e")).toBeNull();
    expect(normalizeRoomCode("abilo")).toBeNull();
    expect(normalizeRoomCode("ab23")).toBeNull();
  });
});

describe("generateRoomCode collision smoke test", () => {
  it("has tolerably low collision rate over 10,000 samples", () => {
    const seen = new Set<string>();
    let collisions = 0;
    for (let i = 0; i < 10_000; i++) {
      const code = generateRoomCode();
      if (seen.has(code)) collisions++;
      else seen.add(code);
    }
    expect(collisions).toBeLessThan(5);
  });
});
