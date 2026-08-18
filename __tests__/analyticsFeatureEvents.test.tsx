import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/firebase/analytics", () => ({ trackEvent }));
vi.mock("@/lib/effects", () => ({
  celebrateCorrect: vi.fn(),
  playCorrectSound: vi.fn(),
  pulseHaptic: vi.fn(),
}));

import { useTwentyFour } from "@/hooks/useTwentyFour";
import { useZetamac } from "@/hooks/useZetamac";
import { TweaksProvider, useTweaks } from "@/hooks/useTweaks";

describe("feature analytics events", () => {
  beforeEach(() => trackEvent.mockClear());

  it("fires game_started + game_completed for Twenty-Four", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useTwentyFour());
      act(() => result.current.startGame());
      expect(trackEvent).toHaveBeenCalledWith(
        "game_started",
        expect.objectContaining({ game: "twenty_four" }),
      );
      act(() => {
        vi.advanceTimersByTime(61_000);
      });
      expect(trackEvent).toHaveBeenCalledWith(
        "game_completed",
        expect.objectContaining({ game: "twenty_four", score: expect.any(Number), solved_count: expect.any(Number) }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("fires game_started for Zetamac", () => {
    const { result } = renderHook(() => useZetamac());
    act(() => result.current.startGame());
    expect(trackEvent).toHaveBeenCalledWith(
      "game_started",
      expect.objectContaining({ game: "zetamac", duration_s: expect.any(Number) }),
    );
  });

  it("fires settings_changed per changed tweak key", () => {
    const { result } = renderHook(() => useTweaks(), { wrapper: TweaksProvider });
    act(() => result.current.setTweaks({ theme: "ink" }));
    expect(trackEvent).toHaveBeenCalledWith("settings_changed", { setting: "theme", value: "ink" });
  });
});
