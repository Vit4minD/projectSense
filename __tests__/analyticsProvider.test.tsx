import { render } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/firebase/analytics", () => ({
  trackEvent,
  getAnalyticsClient: vi.fn().mockResolvedValue(null),
  setAnalyticsUser: vi.fn(),
  setAnalyticsUserProperties: vi.fn(),
}));

let pathname = "/home";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: () => () => {} }));
vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuth: () => ({}) }));

import { AnalyticsProvider } from "@/components/sense/AnalyticsProvider";

describe("AnalyticsProvider page_view", () => {
  beforeEach(() => {
    pathname = "/home";
    trackEvent.mockClear();
  });

  it("tracks page_view on mount and on pathname change", () => {
    const { rerender } = render(<AnalyticsProvider />);
    expect(trackEvent).toHaveBeenCalledWith("page_view", { page_path: "/home" });
    pathname = "/leaderboard";
    rerender(<AnalyticsProvider />);
    expect(trackEvent).toHaveBeenCalledWith("page_view", { page_path: "/leaderboard" });
  });
});
