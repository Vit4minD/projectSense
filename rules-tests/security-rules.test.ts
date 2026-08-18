import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, set, get } from "firebase/database";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "project-sense-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
    database: {
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearDatabase();
});

describe("firestore: leaderboard entries", () => {
  it("denies an unauthenticated read", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(
      getDoc(doc(unauth.firestore(), "leaderboards/1/entries/u1")),
    );
  });

  it("allows an authenticated read", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      getDoc(doc(alice.firestore(), "leaderboards/1/entries/u1")),
    );
  });

  it("denies a client write", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "leaderboards/1/entries/alice"), {
        displayName: "Alice",
        school: "St. Mark's",
        bestMs: 1000,
      }),
    );
  });
});

describe("firestore: drill validation", () => {
  const validDrill = () => ({
    trickId: "12",
    startedAt: serverTimestamp(),
    totalMs: 5000,
    score: "5/5",
    perQuestion: [1, 2, 3, 4, 5],
  });

  it("accepts a well-formed drill", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      setDoc(doc(alice.firestore(), "users/alice/drills/d1"), validDrill()),
    );
  });

  it("rejects a negative totalMs", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice/drills/d2"), {
        ...validDrill(),
        totalMs: -1,
      }),
    );
  });

  it("rejects an out-of-range score", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice/drills/d3"), {
        ...validDrill(),
        score: "9/5",
      }),
    );
  });

  it("rejects the wrong perQuestion length", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice/drills/d4"), {
        ...validDrill(),
        perQuestion: [1, 2, 3],
      }),
    );
  });
});

// Shared seed helpers. Rooms are seeded with rules DISABLED, so validation is
// only exercised by the assertions themselves. Host is "carol" (not the actor)
// so the host-level write rule never masks the per-player own-slot rule.
async function seedRoom(
  state: "lobby" | "racing" | "ended",
  players: Record<string, unknown>,
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await set(ref(ctx.database(), "rooms/ROOM1"), {
      host: "carol",
      trickId: "12",
      seed: 1,
      questionCount: 5,
      visibility: "public",
      state,
      createdAt: 1,
      players,
    });
  });
}

const alicePlayer = {
  displayName: "Alice",
  avatarInitials: "AL",
  solved: 0,
  joinedAt: 1,
};

describe("rtdb: room read gating", () => {
  beforeEach(async () => {
    await seedRoom("lobby", { alice: alicePlayer });
  });

  it("denies a non-participant read", async () => {
    const bob = testEnv.authenticatedContext("bob").database();
    await assertFails(get(ref(bob, "rooms/ROOM1")));
  });

  it("allows a participant read", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertSucceeds(get(ref(alice, "rooms/ROOM1")));
  });

  it("allows the host to read", async () => {
    const carol = testEnv.authenticatedContext("carol").database();
    await assertSucceeds(get(ref(carol, "rooms/ROOM1")));
  });
});

describe("rtdb: room player validation", () => {
  beforeEach(async () => {
    await seedRoom("lobby", { alice: alicePlayer });
  });

  it("rejects solved above questionCount", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 9999));
  });

  it("rejects a smuggled extra key", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(
      set(ref(alice, "rooms/ROOM1/players/alice"), {
        displayName: "Alice",
        avatarInitials: "AL",
        solved: 0,
        joinedAt: 1,
        hacked: true,
      }),
    );
  });

  it("denies writing another player's slot", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(
      set(ref(alice, "rooms/ROOM1/players/bob"), {
        displayName: "Bob",
        avatarInitials: "BO",
        solved: 0,
        joinedAt: 2,
      }),
    );
  });
});

describe("rtdb: join gating (state must be lobby)", () => {
  it("allows joining while the room is in lobby", async () => {
    await seedRoom("lobby", { alice: alicePlayer });
    const bob = testEnv.authenticatedContext("bob").database();
    await assertSucceeds(
      set(ref(bob, "rooms/ROOM1/players/bob"), {
        displayName: "Bob",
        avatarInitials: "BO",
        solved: 0,
        joinedAt: 2,
      }),
    );
  });

  it("rejects joining while the room is racing", async () => {
    await seedRoom("racing", { alice: alicePlayer });
    const bob = testEnv.authenticatedContext("bob").database();
    await assertFails(
      set(ref(bob, "rooms/ROOM1/players/bob"), {
        displayName: "Bob",
        avatarInitials: "BO",
        solved: 0,
        joinedAt: 2,
      }),
    );
  });
});

describe("rtdb: solved progression", () => {
  it("allows a single +1 increment while racing", async () => {
    await seedRoom("racing", { alice: alicePlayer });
    const alice = testEnv.authenticatedContext("alice").database();
    await assertSucceeds(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 1));
  });

  it("rejects jumping solved straight to questionCount while racing", async () => {
    await seedRoom("racing", { alice: alicePlayer });
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 5));
  });

  it("rejects incrementing solved while still in lobby", async () => {
    await seedRoom("lobby", { alice: alicePlayer });
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 1));
  });

  it("allows solved 0 at join time (lobby)", async () => {
    await seedRoom("lobby", { alice: alicePlayer });
    const bob = testEnv.authenticatedContext("bob").database();
    await assertSucceeds(
      set(ref(bob, "rooms/ROOM1/players/bob"), {
        displayName: "Bob",
        avatarInitials: "BO",
        solved: 0,
        joinedAt: 2,
      }),
    );
  });
});

describe("rtdb: room index", () => {
  const validEntry = () => ({
    trickId: "12",
    host: "carol",
    playerCount: 1,
    createdAt: Date.now() - 1000,
  });

  it("is readable by any authenticated user", async () => {
    const bob = testEnv.authenticatedContext("bob").database();
    await assertSucceeds(get(ref(bob, "roomIndex/ROOM1")));
  });

  it("accepts a well-formed index entry", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertSucceeds(set(ref(alice, "roomIndex/ROOM1"), validEntry()));
  });

  it("rejects an index entry carrying a player name / unknown field", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(
      set(ref(alice, "roomIndex/ROOM1"), {
        ...validEntry(),
        displayName: "Some Kid",
      }),
    );
  });

  it("rejects a playerCount over the cap", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(
      set(ref(alice, "roomIndex/ROOM1"), { ...validEntry(), playerCount: 9 }),
    );
  });
});
