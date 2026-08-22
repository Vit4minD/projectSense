import { describe, expect, it } from "vitest";
import { submitFeedback, statusCodeFor } from "@/lib/server/feedback";

type Decoded = { uid: string; email?: string; name?: string };

function makeDeps(opts?: { verify?: (t: string) => Promise<Decoded> }) {
  const writes: { path: string; data: Record<string, unknown> }[] = [];
  const adminDb = {
    collection: (c: string) => ({
      doc: (id?: string) => {
        const docId = id ?? `auto-${writes.length}`;
        return {
          id: docId,
          set: async (data: Record<string, unknown>) => {
            writes.push({ path: `${c}/${docId}`, data });
          },
        };
      },
    }),
  } as unknown as import("firebase-admin/firestore").Firestore;

  const adminAuth = {
    verifyIdToken:
      opts?.verify ?? (async (_t: string) => ({ uid: "u1", email: "a@b.co", name: "Ada" })),
  } as unknown as import("firebase-admin/auth").Auth;

  return {
    deps: { adminAuth, adminDb, serverTimestamp: () => "__TS__" },
    writes,
  };
}

const hdr = "Bearer tok";

describe("submitFeedback", () => {
  it("rejects a missing token", async () => {
    const { deps } = makeDeps();
    const r = await submitFeedback(deps, null, { category: "bug", message: "x" });
    expect(r).toMatchObject({ ok: false, code: "no-token" });
    expect(statusCodeFor("no-token")).toBe(401);
  });

  it("rejects a bad token", async () => {
    const { deps } = makeDeps({
      verify: async () => {
        throw new Error("bad");
      },
    });
    const r = await submitFeedback(deps, hdr, { category: "bug", message: "x" });
    expect(r).toMatchObject({ ok: false, code: "bad-token" });
  });

  it("rejects a bad body (empty message)", async () => {
    const { deps } = makeDeps();
    const r = await submitFeedback(deps, hdr, { category: "bug", message: "" });
    expect(r).toMatchObject({ ok: false, code: "bad-request" });
  });

  it("rejects an invalid category", async () => {
    const { deps } = makeDeps();
    const r = await submitFeedback(deps, hdr, { category: "spam", message: "hi" });
    expect(r).toMatchObject({ ok: false, code: "bad-request" });
  });

  it("writes a sanitized feedback doc on success", async () => {
    const { deps, writes } = makeDeps();
    const r = await submitFeedback(deps, hdr, {
      category: "idea",
      message: "  add dark mode  ",
      path: "/leaderboard",
      appVersion: "v2.0",
      userAgent: "jsdom",
    });
    expect(r.ok).toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0].path).toMatch(/^feedback\//);
    expect(writes[0].data).toMatchObject({
      uid: "u1",
      email: "a@b.co",
      displayName: "Ada",
      category: "idea",
      message: "add dark mode",
      path: "/leaderboard",
      appVersion: "v2.0",
      createdAt: "__TS__",
    });
  });
});
