"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/firebase/analytics";
import type { AITestGrade, AITestPaper } from "@/lib/types";

export type AITestPhase =
  | "idle"
  | "generating"
  | "taking"
  | "submitting"
  | "results"
  | "error";

type UseAITest = {
  phase: AITestPhase;
  paper: AITestPaper | null;
  answers: Record<number, string>;
  grade: AITestGrade | null;
  errorMessage: string | null;
  generate: () => Promise<void>;
  setAnswer: (n: number, value: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
};

export function useAITest(): UseAITest {
  const { user } = useAuth();
  const [phase, setPhase] = useState<AITestPhase>("idle");
  const [paper, setPaper] = useState<AITestPaper | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [grade, setGrade] = useState<AITestGrade | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authHeader = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const token = await user.getIdToken();
    return `Bearer ${token}`;
  }, [user]);

  const generate = useCallback(async () => {
    setErrorMessage(null);
    setGrade(null);
    setAnswers({});
    setPhase("generating");
    try {
      const auth = await authHeader();
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { Authorization: auth },
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; paper: AITestPaper }
        | { ok: false; code: string; message: string }
        | null;
      if (!json || json.ok !== true) {
        setErrorMessage(json && "message" in json ? json.message : "Failed to generate test");
        setPhase("error");
        return;
      }
      setPaper(json.paper);
      setPhase("taking");
      void trackEvent("ai_test_generated", { question_count: json.paper.questions.length });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to generate test");
      setPhase("error");
    }
  }, [authHeader]);

  const setAnswer = useCallback((n: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [n]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (!paper) return;
    setErrorMessage(null);
    setPhase("submitting");
    try {
      const auth = await authHeader();
      const res = await fetch("/api/grade-test", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ paper, answers }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; grade: AITestGrade }
        | { ok: false; code: string; message: string }
        | null;
      if (!json || json.ok !== true) {
        setErrorMessage(json && "message" in json ? json.message : "Failed to grade test");
        setPhase("error");
        return;
      }
      setGrade(json.grade);
      setPhase("results");
      void trackEvent("ai_test_graded", {
        score: json.grade.score,
        number_correct: json.grade.numberCorrect,
        total: json.grade.lastQuestion,
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to grade test");
      setPhase("error");
    }
  }, [paper, answers, authHeader]);

  const reset = useCallback(() => {
    setPhase("idle");
    setPaper(null);
    setAnswers({});
    setGrade(null);
    setErrorMessage(null);
  }, []);

  return useMemo(
    () => ({ phase, paper, answers, grade, errorMessage, generate, setAnswer, submit, reset }),
    [phase, paper, answers, grade, errorMessage, generate, setAnswer, submit, reset],
  );
}
