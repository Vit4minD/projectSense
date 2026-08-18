import { describe, expect, it, vi } from "vitest";
import {
  generatePaper,
  gradePaper,
  gradeTest,
  statusCodeFor,
  uilScore,
  validateGeneratedPaper,
  type GenerateTestDeps,
  type GradeTestDeps,
} from "@/lib/server/aiTest";
import type { AITestPaper, AITestQuestion } from "@/lib/types";

function q(
  number: number,
  overrides: Partial<AITestQuestion> = {},
): AITestQuestion {
  return {
    number,
    prompt: `Question ${number} _________`,
    answer: "0",
    form: "integer",
    category: "basic arithmetic",
    ...overrides,
  };
}

function makePaper(qs: AITestQuestion[]): AITestPaper {
  return { generatedAt: 0, questions: qs };
}

function fortyQuestions(): AITestQuestion[] {
  return Array.from({ length: 40 }, (_, i) => q(i + 1, { answer: String(i + 1) }));
}

describe("uilScore", () => {
  it("returns 0 when nothing is answered", () => {
    expect(uilScore(0, 0)).toBe(0);
  });
  it("returns 200 for a perfect 40/40", () => {
    expect(uilScore(40, 40)).toBe(200);
  });
  it("penalises wrong answers in the answered range", () => {
    expect(uilScore(10, 7)).toBe(23);
  });
  it("goes negative when every answer in the range is wrong", () => {
    expect(uilScore(10, 0)).toBe(-40);
  });
});

describe("gradeTest", () => {
  it("marks an exact integer match correct", () => {
    const paper = makePaper([q(1, { answer: "12", form: "integer" })]);
    const grade = gradeTest(paper, { 1: "12" });
    expect(grade.items[0].correct).toBe(true);
    expect(grade.items[0].blank).toBe(false);
    expect(grade.numberCorrect).toBe(1);
  });

  it("accepts a decimal that equals the canonical fraction", () => {
    const paper = makePaper([q(1, { answer: "1/2", form: "fraction" })]);
    const grade = gradeTest(paper, { 1: "0.5" });
    expect(grade.items[0].correct).toBe(true);
  });

  it("accepts an improper fraction for a mixed-number answer", () => {
    const paper = makePaper([q(1, { answer: "3 1/2", form: "mixed" })]);
    const grade = gradeTest(paper, { 1: "7/2" });
    expect(grade.items[0].correct).toBe(true);
  });

  it("accepts a fraction when the canonical answer is a rounded decimal", () => {
    // equals() compares within 1e-9 for the rational path, so 1/3 vs 0.333 will
    // NOT pass — use a decimal that exactly matches the rational.
    const paper = makePaper([q(1, { answer: "0.5", form: "decimal" })]);
    const grade = gradeTest(paper, { 1: "1/2" });
    expect(grade.items[0].correct).toBe(true);
  });

  it("compares base answers in the declared base", () => {
    const paper = makePaper([q(1, { answer: "32", form: "base", base: 8 })]);
    const right = gradeTest(paper, { 1: "32" });
    expect(right.items[0].correct).toBe(true);
    const wrong = gradeTest(paper, { 1: "26" });
    expect(wrong.items[0].correct).toBe(false);
  });

  it("flags blanks as blank and not correct", () => {
    const paper = makePaper([q(1, { answer: "12", form: "integer" })]);
    const grade = gradeTest(paper, { 1: "" });
    expect(grade.items[0].blank).toBe(true);
    expect(grade.items[0].correct).toBe(false);
    expect(grade.lastQuestion).toBe(0);
  });

  it("flags a wrong non-blank answer", () => {
    const paper = makePaper([q(1, { answer: "12", form: "integer" })]);
    const grade = gradeTest(paper, { 1: "13" });
    expect(grade.items[0].correct).toBe(false);
    expect(grade.items[0].blank).toBe(false);
  });

  it("computes lastQuestion as the highest answered index and scores skipped as wrong", () => {
    const paper = makePaper([
      q(1, { answer: "1" }),
      q(2, { answer: "2" }),
      q(3, { answer: "3" }),
      q(4, { answer: "4" }),
      q(5, { answer: "5" }),
    ]);
    const grade = gradeTest(paper, { 1: "1", 5: "5" });
    expect(grade.lastQuestion).toBe(5);
    expect(grade.numberCorrect).toBe(2);
    // UIL: 5*5 - 9*(5-2) = 25 - 27 = -2
    expect(grade.score).toBe(-2);
  });
});

describe("validateGeneratedPaper", () => {
  it("accepts a valid 40-question paper", () => {
    const raw = { questions: fortyQuestions() };
    const paper = validateGeneratedPaper(raw);
    expect(paper.questions).toHaveLength(40);
    expect(paper.questions[0].number).toBe(1);
    expect(paper.questions[39].number).toBe(40);
  });

  it("rejects a 39-question array", () => {
    const raw = { questions: fortyQuestions().slice(0, 39) };
    expect(() => validateGeneratedPaper(raw)).toThrow(/schema/i);
  });

  it("rejects a question missing the form field", () => {
    const qs = fortyQuestions().map((item, i) => {
      if (i === 0) {
        const { form: _form, ...rest } = item;
        return rest;
      }
      return item;
    });
    expect(() => validateGeneratedPaper({ questions: qs })).toThrow();
  });

  it("rejects form=base without a base field", () => {
    const qs = fortyQuestions();
    qs[0] = { ...qs[0], form: "base" };
    expect(() => validateGeneratedPaper({ questions: qs })).toThrow(/base/i);
  });
});

type ModelLike = {
  generateContent: (
    prompt: string,
  ) => Promise<{ response: { text: () => string } }>;
};

function makeGeminiClient(model: ModelLike) {
  return {
    getGenerativeModel: vi.fn(() => model),
  } as unknown as NonNullable<GenerateTestDeps["geminiClient"]>;
}

function goldenJson(): string {
  return JSON.stringify({ questions: fortyQuestions() });
}

describe("generatePaper", () => {
  const baseDeps = (overrides: Partial<GenerateTestDeps>): GenerateTestDeps => ({
    adminAuth: { verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }) },
    geminiKey: "test-key",
    geminiClient: makeGeminiClient({
      generateContent: vi
        .fn()
        .mockResolvedValue({ response: { text: () => goldenJson() } }),
    }),
    ...overrides,
  });

  it("rejects missing Authorization header (no-token)", async () => {
    const deps = baseDeps({});
    const result = await generatePaper(deps, null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("no-token");
      expect(statusCodeFor(result.code)).toBe(401);
    }
  });

  it("rejects a bad ID token (bad-token)", async () => {
    const deps = baseDeps({
      adminAuth: { verifyIdToken: vi.fn().mockRejectedValue(new Error("nope")) },
    });
    const result = await generatePaper(deps, "Bearer bad");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("bad-token");
      expect(statusCodeFor(result.code)).toBe(401);
    }
  });

  it("returns missing-key when key/client are absent", async () => {
    const deps = baseDeps({ geminiKey: "", geminiClient: null });
    const result = await generatePaper(deps, "Bearer ok");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing-key");
      expect(statusCodeFor(result.code)).toBe(500);
    }
  });

  it("returns a 40-question paper on the happy path", async () => {
    const deps = baseDeps({});
    const result = await generatePaper(deps, "Bearer ok");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paper.questions).toHaveLength(40);
    }
  });

  it("retries once on JSON parse error before failing upstream", async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValueOnce({ response: { text: () => "not json" } })
      .mockResolvedValueOnce({ response: { text: () => goldenJson() } });
    const deps = baseDeps({
      geminiClient: makeGeminiClient({ generateContent }),
    });
    const result = await generatePaper(deps, "Bearer ok");
    expect(result.ok).toBe(true);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("returns upstream-failed when both attempts fail", async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ response: { text: () => "still not json" } });
    const deps = baseDeps({
      geminiClient: makeGeminiClient({ generateContent }),
    });
    const result = await generatePaper(deps, "Bearer ok");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("upstream-failed");
      expect(statusCodeFor(result.code)).toBe(502);
    }
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});

describe("generatePaper rate limiting", () => {
  // Uses the module-scoped `generateTestLimiter` singleton (limit 10/min).
  // To avoid polluting the other `generatePaper` specs (which key on uid "u1"),
  // this spec keys on a dedicated uid whose bucket is exercised only here.
  it("returns rate-limited (429) once the per-user window is exhausted", async () => {
    const uid = "rl-generate-user";
    const deps: GenerateTestDeps = {
      adminAuth: { verifyIdToken: vi.fn().mockResolvedValue({ uid }) },
      geminiKey: "test-key",
      geminiClient: makeGeminiClient({
        generateContent: vi
          .fn()
          .mockResolvedValue({ response: { text: () => goldenJson() } }),
      }),
    };

    // First 10 requests fit inside the window.
    for (let i = 0; i < 10; i += 1) {
      const ok = await generatePaper(deps, "Bearer ok");
      expect(ok.ok).toBe(true);
    }

    // The 11th trips the limiter, before Gemini is called.
    const limited = await generatePaper(deps, "Bearer ok");
    expect(limited.ok).toBe(false);
    if (!limited.ok) {
      expect(limited.code).toBe("rate-limited");
      expect(statusCodeFor(limited.code)).toBe(429);
    }
  });
});

describe("gradePaper", () => {
  const baseDeps = (overrides: Partial<GradeTestDeps> = {}): GradeTestDeps => ({
    adminAuth: { verifyIdToken: vi.fn().mockResolvedValue({ uid: "u1" }) },
    ...overrides,
  });

  it("rejects missing Authorization header", async () => {
    const result = await gradePaper(baseDeps(), null, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("no-token");
  });

  it("rejects bad token", async () => {
    const result = await gradePaper(
      baseDeps({
        adminAuth: { verifyIdToken: vi.fn().mockRejectedValue(new Error("x")) },
      }),
      "Bearer bad",
      {},
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("bad-token");
  });

  it("rejects a malformed body with bad-request", async () => {
    const result = await gradePaper(baseDeps(), "Bearer ok", {
      paper: { generatedAt: 0, questions: [] },
      answers: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("bad-request");
      expect(statusCodeFor(result.code)).toBe(400);
    }
  });

  it("returns a grade on the happy path", async () => {
    const paper: AITestPaper = {
      generatedAt: 0,
      questions: fortyQuestions(),
    };
    const answers: Record<string, string> = { "1": "1", "2": "2", "3": "wrong" };
    const result = await gradePaper(baseDeps(), "Bearer ok", { paper, answers });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.grade.lastQuestion).toBe(3);
      expect(result.grade.numberCorrect).toBe(2);
      // 5*3 - 9*(3-2) = 15 - 9 = 6
      expect(result.grade.score).toBe(6);
    }
  });
});
