import { vi, describe, it, expect, beforeEach } from "vitest";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/firebase/analytics", () => ({ trackEvent }));
vi.mock("@/lib/firebase/client", () => ({ getRtdb: () => ({}) }));
vi.mock("firebase/database", () => ({
  ref: () => ({}),
  get: vi.fn().mockResolvedValue({ val: () => null }),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  runTransaction: vi.fn().mockResolvedValue({ committed: true, snapshot: { val: () => 0 } }),
  onValue: vi.fn(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn(), cancel: vi.fn() })),
  serverTimestamp: () => 0,
  query: (r: unknown) => r,
  orderByChild: vi.fn(),
}));

import { createRoom, joinRoom, startRace } from "@/lib/firebase/rooms";

const fakeDb = {} as never;

describe("multiplayer analytics events", () => {
  beforeEach(() => trackEvent.mockClear());

  it("fires multiplayer_room_created on createRoom", async () => {
    await createRoom(
      {
        code: "ABCDE",
        host: "u1",
        hostDisplayName: "Host",
        hostAvatarInitials: "HO",
        trickId: "5",
        seed: 1,
        visibility: "public",
      },
      fakeDb,
    );
    expect(trackEvent).toHaveBeenCalledWith("multiplayer_room_created", {
      trick_id: "5",
      visibility: "public",
    });
  });

  it("fires multiplayer_joined on joinRoom", async () => {
    await joinRoom({ code: "ABCDE", uid: "u2", displayName: "P2", avatarInitials: "P2" }, fakeDb);
    expect(trackEvent).toHaveBeenCalledWith("multiplayer_joined");
  });

  it("fires multiplayer_race_started on startRace", async () => {
    await startRace("ABCDE", "u1", fakeDb);
    expect(trackEvent).toHaveBeenCalledWith("multiplayer_race_started");
  });
});
