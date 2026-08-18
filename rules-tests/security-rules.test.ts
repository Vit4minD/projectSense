import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, set } from "firebase/database";

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

describe("rtdb: room player validation", () => {
  beforeEach(async () => {
    // Seed a room whose host is "carol" (not the actor) so the host-level
    // write rule does not mask the per-player own-slot rule under test.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), "rooms/ROOM1"), {
        host: "carol",
        trickId: "12",
        seed: 1,
        questionCount: 5,
        visibility: "public",
        state: "lobby",
        players: {
          alice: {
            displayName: "Alice",
            avatarInitials: "AL",
            solved: 0,
            joinedAt: 1,
          },
        },
      });
    });
  });

  it("rejects solved above questionCount", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 9999));
  });

  it("accepts an in-range solved", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertSucceeds(set(ref(alice, "rooms/ROOM1/players/alice/solved"), 5));
  });

  it("rejects a smuggled extra key", async () => {
    const alice = testEnv.authenticatedContext("alice").database();
    await assertFails(
      set(ref(alice, "rooms/ROOM1/players/alice"), {
        displayName: "Alice",
        avatarInitials: "AL",
        solved: 1,
        joinedAt: 2,
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
