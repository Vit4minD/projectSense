import { z } from "zod";
import type { Auth } from "firebase-admin/auth";
import type {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerateContentResult,
  ResponseSchema,
} from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";
import { equals } from "@/lib/drill/answerValidator";
import { generateTestLimiter, gradeTestLimiter } from "@/lib/server/rateLimit";
import type {
  AITestGrade,
  AITestGradeItem,
  AITestPaper,
  AITestQuestion,
} from "@/lib/types";

export const GEMINI_MODEL = "gemini-2.0-flash";

export type AITestErrCode =
  | "no-token"
  | "bad-token"
  | "bad-request"
  | "missing-key"
  | "rate-limited"
  | "upstream-failed"
  | "internal";

export type AITestErr = {
  ok: false;
  code: AITestErrCode;
  message: string;
  issues?: unknown;
};

export type GenerateOk = { ok: true; paper: AITestPaper };
export type GradeOk = { ok: true; grade: AITestGrade };

export type GenerateResult = GenerateOk | AITestErr;
export type GradeResult = GradeOk | AITestErr;

type GeminiClientLike = Pick<GoogleGenerativeAI, "getGenerativeModel">;

export type GenerateTestDeps = {
  adminAuth: Pick<Auth, "verifyIdToken">;
  geminiKey: string;
  geminiClient?: GeminiClientLike | null;
};

export type GradeTestDeps = {
  adminAuth: Pick<Auth, "verifyIdToken">;
};

export const GradeBody = z.object({
  paper: z.object({
    generatedAt: z.number(),
    questions: z
      .array(
        z.object({
          number: z.number().int().min(1).max(40),
          prompt: z.string().min(1),
          answer: z.string().min(1),
          form: z.enum(["integer", "fraction", "mixed", "decimal", "base", "ratio", "other"]),
          base: z.number().int().min(2).max(36).optional(),
          category: z.string().min(1),
        }),
      )
      .length(40),
  }),
  answers: z.record(z.string(), z.string()),
});

const ANSWER_FORM_ENUM: AITestQuestion["form"][] = [
  "integer",
  "fraction",
  "mixed",
  "decimal",
  "base",
  "ratio",
  "other",
];

const GeneratedQuestionSchema = z.object({
  number: z.number().int().min(1).max(40),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  form: z.enum(["integer", "fraction", "mixed", "decimal", "base", "ratio", "other"]),
  base: z.number().int().min(2).max(36).optional(),
  category: z.string().min(1),
});

const GeneratedPaperSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).length(40),
});

export function buildGenerationPrompt(): {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: ResponseSchema;
} {
  const systemInstruction =
    "You generate UIL Number Sense practice tests. Output a JSON object with a `questions` array of exactly 40 items. Each item has fields: number (1-40), prompt (plain ASCII ending in eight underscores `_________`), answer (canonical form: fractions reduced as `a/b`, mixed as `a b/c`, base conversions use plain digits with `base` field set), form (one of \"integer\",\"fraction\",\"mixed\",\"decimal\",\"base\",\"ratio\",\"other\"), optional base (integer), category (string hint). No LaTeX, no markdown, no Unicode subscripts.";

  const userPrompt = [
    "Generate exactly 40 UIL Number Sense questions numbered 1-40, increasing in difficulty.",
    "Cover these 10 categories with at least 3 questions each:",
    "- basic arithmetic",
    "- fractions",
    "- percentages",
    "- square roots",
    "- base conversions",
    "- word problems",
    "- number theory",
    "- algebra",
    "- geometry",
    "- sequences/patterns",
    "",
    "Style examples (DO NOT COPY THESE EXAMPLE NUMBERS):",
    "1. \"9006 x 2 = _________\" answer \"18012\" form \"integer\"",
    "2. \"2/3 + 5/6 = _________ (fraction)\" answer \"3/2\" form \"fraction\"",
    "3. \"3 3/4 as a fraction = _________\" answer \"15/4\" form \"fraction\"",
    "4. \"320 base 6 = _________ base 10\" answer \"120\" form \"base\" base 10",
    "5. \"The LCM of 34, 51, and 17 is _________\" answer \"102\" form \"integer\"",
    "",
    "Every prompt MUST end with eight underscores: _________",
    "Use only plain ASCII; write \"base 6\" instead of subscripts; write \"sqrt(...)\" instead of radicals.",
    "Answers must be in the canonical form requested by `form`.",
  ].join("\n");

  const responseSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            number: { type: SchemaType.INTEGER },
            prompt: { type: SchemaType.STRING },
            answer: { type: SchemaType.STRING },
            form: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ANSWER_FORM_ENUM as unknown as string[],
            },
            base: { type: SchemaType.INTEGER },
            category: { type: SchemaType.STRING },
          },
          required: ["number", "prompt", "answer", "form", "category"],
        },
      },
    },
    required: ["questions"],
  };

  return { systemInstruction, userPrompt, responseSchema };
}

export function validateGeneratedPaper(raw: unknown): AITestPaper {
  const parsed = GeneratedPaperSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Generated paper failed schema: ${parsed.error.message}`);
  }
  const seenNumbers = new Set<number>();
  for (const q of parsed.data.questions) {
    if (seenNumbers.has(q.number)) {
      throw new Error(`Duplicate question number ${q.number}`);
    }
    seenNumbers.add(q.number);
    if (q.form === "base" && typeof q.base !== "number") {
      throw new Error(`Question ${q.number} has form="base" but no base field`);
    }
  }
  const sorted = [...parsed.data.questions].sort((a, b) => a.number - b.number);
  return {
    generatedAt: Date.now(),
    questions: sorted,
  };
}

export function uilScore(lastQuestion: number, correct: number): number {
  return lastQuestion * 5 - 9 * (lastQuestion - correct);
}

export function gradeTest(
  paper: AITestPaper,
  answers: Record<number | string, string>,
): AITestGrade {
  const items: AITestGradeItem[] = [];
  let numberCorrect = 0;
  let lastQuestion = 0;

  for (const q of paper.questions) {
    const rawInput = answers[q.number] ?? answers[String(q.number)] ?? "";
    const trimmed = rawInput.trim();
    const blank = trimmed.length === 0;
    if (!blank) lastQuestion = Math.max(lastQuestion, q.number);

    let correct = false;
    if (!blank) {
      if (q.form === "base" && typeof q.base === "number") {
        // Compare in the declared base: parse user input as that base and the
        // canonical answer as that base; matches if numeric values agree.
        const userVal = parseInt(trimmed, q.base);
        const expectedVal = parseInt(q.answer.trim(), q.base);
        correct =
          Number.isFinite(userVal) &&
          Number.isFinite(expectedVal) &&
          userVal === expectedVal;
      } else {
        correct = equals(trimmed, q.answer);
      }
    }

    if (correct) numberCorrect += 1;
    items.push({
      number: q.number,
      userAnswer: rawInput,
      correctAnswer: q.answer,
      correct,
      blank,
    });
  }

  return {
    numberCorrect,
    lastQuestion,
    score: uilScore(lastQuestion, numberCorrect),
    items,
  };
}

export async function generatePaper(
  deps: GenerateTestDeps,
  authHeader: string | null,
): Promise<GenerateResult> {
  const token = parseBearer(authHeader);
  if (!token) return err("no-token", "Missing Authorization header");

  let uid: string;
  try {
    ({ uid } = await deps.adminAuth.verifyIdToken(token));
  } catch {
    return err("bad-token", "ID token failed verification");
  }

  const rl = await generateTestLimiter.limit(uid);
  if (!rl.allowed) {
    return err(
      "rate-limited",
      "Too many requests. Please wait a moment and try again.",
    );
  }

  if (!deps.geminiKey || !deps.geminiClient) {
    return err("missing-key", "GEMINI_API_KEY is not configured");
  }

  const { systemInstruction, userPrompt, responseSchema } = buildGenerationPrompt();
  const model = deps.geminiClient.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // Retry once on parse/validation failure — Gemini occasionally emits
  // off-schema JSON despite the schema hint.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result: GenerateContentResult = await model.generateContent(userPrompt);
      const text = result.response.text();
      const raw: unknown = JSON.parse(text);
      const paper = validateGeneratedPaper(raw);
      return { ok: true, paper };
    } catch (e) {
      lastError = e;
    }
  }
  console.error("[aiTest] generation failed after retry", lastError);
  return err(
    "upstream-failed",
    "Gemini did not return a valid 40-question paper",
  );
}

export async function gradePaper(
  deps: GradeTestDeps,
  authHeader: string | null,
  body: unknown,
): Promise<GradeResult> {
  const token = parseBearer(authHeader);
  if (!token) return err("no-token", "Missing Authorization header");

  let uid: string;
  try {
    ({ uid } = await deps.adminAuth.verifyIdToken(token));
  } catch {
    return err("bad-token", "ID token failed verification");
  }

  const rl = await gradeTestLimiter.limit(uid);
  if (!rl.allowed) {
    return err(
      "rate-limited",
      "Too many requests. Please wait a moment and try again.",
    );
  }

  const parsed = GradeBody.safeParse(body);
  if (!parsed.success) {
    return err("bad-request", "Body did not match schema", parsed.error.issues);
  }

  const grade = gradeTest(parsed.data.paper as AITestPaper, parsed.data.answers);
  return { ok: true, grade };
}

export function statusCodeFor(code: AITestErrCode): number {
  switch (code) {
    case "no-token":
    case "bad-token":
      return 401;
    case "bad-request":
      return 400;
    case "missing-key":
      return 500;
    case "rate-limited":
      return 429;
    case "upstream-failed":
      return 502;
    case "internal":
      return 500;
  }
}

function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function err(code: AITestErrCode, message: string, issues?: unknown): AITestErr {
  return { ok: false, code, message, ...(issues !== undefined ? { issues } : {}) };
}

// Exported for use by callers that need the typed Gemini wrapper.
export type { GenerativeModel };
