import { describe, expect, it } from "vitest";
import {
  parseTimeToMs,
  formatMsToTime,
  deriveDisplayName,
  deriveAvatarInitials,
  migrateUserProfile,
  migrateBest,
  migrateLeaderboardEntry,
  type MigratedUserProfile,
} from "@/lib/server/migration";

describe("parseTimeToMs", () => {
  it("parses MM:SS.dd into milliseconds", () => {
    expect(parseTimeToMs("01:23.45")).toBe(83450);
    expect(parseTimeToMs("00:08.07")).toBe(8070);
    expect(parseTimeToMs("00:00.00")).toBe(0);
    expect(parseTimeToMs("10:00.00")).toBe(600_000);
  });

  it("returns NaN on malformed input", () => {
    expect(Number.isNaN(parseTimeToMs(""))).toBe(true);
    expect(Number.isNaN(parseTimeToMs("abc"))).toBe(true);
    expect(Number.isNaN(parseTimeToMs("1:2:3"))).toBe(true);
    expect(Number.isNaN(parseTimeToMs("01:60.00"))).toBe(true); // seconds out of range
    expect(Number.isNaN(parseTimeToMs("01:23"))).toBe(true);    // missing centis
    // Non-string input is also rejected.
    expect(Number.isNaN(parseTimeToMs(null as unknown as string))).toBe(true);
  });
});

describe("parseTimeToMs <-> formatMsToTime round-trip", () => {
  it("round-trips a representative set of values", () => {
    const samples = [
      "00:00.00",
      "00:08.45",
      "00:59.99",
      "01:23.45",
      "12:34.56",
      "59:59.99",
    ];
    for (const s of samples) {
      const ms = parseTimeToMs(s);
      expect(Number.isFinite(ms)).toBe(true);
      expect(formatMsToTime(ms)).toBe(s);
    }
  });

  it("formatMsToTime guards against non-finite or negative input", () => {
    expect(formatMsToTime(Number.NaN)).toBe("00:00.00");
    expect(formatMsToTime(-1)).toBe("00:00.00");
    expect(formatMsToTime(0)).toBe("00:00.00");
  });
});

describe("deriveDisplayName", () => {
  it("returns the raw local-part of an email", () => {
    expect(deriveDisplayName("simple@example.com")).toBe("simple");
    expect(deriveDisplayName("henry.tran07@gmail.com")).toBe("henry.tran07");
    expect(deriveDisplayName("a+b@c.d")).toBe("a+b");
  });

  it("returns empty string on missing or malformed email", () => {
    expect(deriveDisplayName("")).toBe("");
    expect(deriveDisplayName("noatsign")).toBe("");
    expect(deriveDisplayName("@leadingat.com")).toBe("");
    expect(deriveDisplayName(undefined)).toBe("");
    expect(deriveDisplayName(null)).toBe("");
  });
});

describe("deriveAvatarInitials", () => {
  it("returns first letter for single-word names", () => {
    expect(deriveAvatarInitials("henry")).toBe("H");
    expect(deriveAvatarInitials("ada")).toBe("A");
  });

  it("returns first two initials for multi-word names, uppercased", () => {
    expect(deriveAvatarInitials("Henry Tran")).toBe("HT");
    expect(deriveAvatarInitials("ada lovelace")).toBe("AL");
    expect(deriveAvatarInitials("grace hopper jr")).toBe("GH");
  });

  it("returns 'S' fallback on empty/whitespace/missing input", () => {
    expect(deriveAvatarInitials("")).toBe("S");
    expect(deriveAvatarInitials("   ")).toBe("S");
    expect(deriveAvatarInitials(undefined)).toBe("S");
    expect(deriveAvatarInitials(null)).toBe("S");
  });
});

describe("migrateUserProfile", () => {
  const NOW = new Date("2026-05-05T12:00:00Z");

  it("backfills all derived fields when the legacy profile is empty", () => {
    const out = migrateUserProfile({}, "uid-1", NOW);
    expect(out.displayName).toBe("");
    expect(out.school).toBe("");
    expect(out.avatarInitials).toBe("S");
    expect(out.createdAt).toBe(NOW);
    expect(out.lastActiveAt).toBe(NOW);
  });

  it("derives displayName/avatarInitials from email when missing", () => {
    const out = migrateUserProfile(
      { email: "henry.tran07@gmail.com" },
      "uid-1",
      NOW,
    );
    expect(out.displayName).toBe("henry.tran07");
    expect(out.avatarInitials).toBe("H");
    expect(out.school).toBe("");
  });

  it("preserves an already-set displayName/school/avatarInitials", () => {
    const out = migrateUserProfile(
      {
        email: "henry.tran07@gmail.com",
        displayName: "Henry Tran",
        school: "MIT",
        avatarInitials: "HT",
      },
      "uid-1",
      NOW,
    );
    expect(out.displayName).toBe("Henry Tran");
    expect(out.school).toBe("MIT");
    expect(out.avatarInitials).toBe("HT");
  });

  it("preserves legacy settings fields untouched", () => {
    const out = migrateUserProfile(
      {
        email: "ada@example.com",
        questionLimited: false,
        rightLeft: true,
        autoEnter: false,
      },
      "uid-1",
      NOW,
    );
    expect(out.email).toBe("ada@example.com");
    expect(out.questionLimited).toBe(false);
    expect(out.rightLeft).toBe(true);
    expect(out.autoEnter).toBe(false);
  });

  it("preserves existing createdAt/lastActiveAt timestamps (idempotent)", () => {
    const existingCreated = new Date("2024-01-01T00:00:00Z");
    const existingActive = new Date("2025-12-31T23:59:59Z");
    const out = migrateUserProfile(
      {
        email: "ada@example.com",
        displayName: "ada",
        createdAt: existingCreated,
        lastActiveAt: existingActive,
      },
      "uid-1",
      NOW,
    );
    expect(out.createdAt).toBe(existingCreated);
    expect(out.lastActiveAt).toBe(existingActive);
  });

  it("handles null/undefined legacy input", () => {
    const out = migrateUserProfile(null, "uid-1", NOW);
    expect(out.displayName).toBe("");
    expect(out.avatarInitials).toBe("S");
    expect(out.createdAt).toBe(NOW);
  });
});

describe("migrateBest", () => {
  const NOW = new Date("2026-05-05T12:00:00Z");

  it("seeds attempts:1 / correct:5 with a parsed bestMs", () => {
    const out = migrateBest({ time: "00:08.45" }, NOW);
    expect(out.bestMs).toBe(8450);
    expect(out.attempts).toBe(1);
    expect(out.correct).toBe(5);
    expect(out.lastAttemptAt).toBe(NOW);
  });

  it("preserves an existing updatedAt as lastAttemptAt", () => {
    const existing = new Date("2025-06-01T00:00:00Z");
    const out = migrateBest({ time: "00:08.45", updatedAt: existing }, NOW);
    expect(out.lastAttemptAt).toBe(existing);
  });

  it("returns NaN bestMs on malformed time (caller logs and skips)", () => {
    const out = migrateBest({ time: "garbage" }, NOW);
    expect(Number.isNaN(out.bestMs)).toBe(true);
    expect(out.attempts).toBe(1);
    expect(out.correct).toBe(5);
  });

  it("preserves the legacy time string on the output (legacy app keeps reading it)", () => {
    const out = migrateBest({ time: "00:08.45" }, NOW);
    expect(out.time).toBe("00:08.45");
  });

  it("preserves arbitrary extra legacy fields", () => {
    const out = migrateBest(
      { time: "00:08.45", customLegacyField: "x", anotherOne: 42 } as never,
      NOW,
    );
    expect((out as Record<string, unknown>).customLegacyField).toBe("x");
    expect((out as Record<string, unknown>).anotherOne).toBe(42);
  });
});

describe("migrateLeaderboardEntry", () => {
  const NOW = new Date("2026-05-05T12:00:00Z");
  const profile: MigratedUserProfile = {
    email: "henry.tran07@gmail.com",
    displayName: "henry.tran07",
    school: "MIT",
    avatarInitials: "H",
    createdAt: NOW,
    lastActiveAt: NOW,
  };

  it("pulls displayName/school from the just-migrated profile (happy path)", () => {
    const original = new Date("2025-08-10T10:00:00Z");
    const out = migrateLeaderboardEntry(
      {
        uid: "uid-1",
        email: "henry.tran07@gmail.com",
        time: "00:08.45",
        updatedAt: original,
      },
      profile,
      "uid-1",
      NOW,
    );
    expect(out.uid).toBe("uid-1");
    expect(out.bestMs).toBe(8450);
    expect(out.displayName).toBe("henry.tran07");
    expect(out.school).toBe("MIT");
    expect(out.updatedAt).toBe(original);
  });

  it("preserves legacy email and time on the output (legacy /leaderboard keeps working)", () => {
    const out = migrateLeaderboardEntry(
      {
        uid: "uid-1",
        email: "henry.tran07@gmail.com",
        time: "00:08.45",
      },
      profile,
      "uid-1",
      NOW,
    );
    expect(out.email).toBe("henry.tran07@gmail.com");
    expect(out.time).toBe("00:08.45");
  });

  it("preserves arbitrary extra legacy fields", () => {
    const out = migrateLeaderboardEntry(
      {
        uid: "uid-1",
        email: "x@y.z",
        time: "00:08.45",
        customLegacyField: "x",
      } as never,
      profile,
      "uid-1",
      NOW,
    );
    expect((out as Record<string, unknown>).customLegacyField).toBe("x");
  });
});
