"use client";

import { AITestPaperView } from "@/components/sense/AITestPaper";
import { AITestResults } from "@/components/sense/AITestResults";
import { useAITest } from "@/hooks/useAITest";

export default function AITestPage() {
  const { phase, paper, answers, grade, errorMessage, generate, setAnswer, submit, reset } =
    useAITest();

  return (
    <div className="main test-shell">
      {phase === "idle" && (
        <div className="test-idle">
          <div className="test-idle-card">
            <h1>AI-generated practice test</h1>
            <p>40 questions in UIL Number Sense format. Powered by Gemini.</p>
            <button type="button" className="test-idle-btn" onClick={generate}>
              Generate test
            </button>
          </div>
        </div>
      )}

      {phase === "generating" && (
        <div className="test-loading">
          <div className="test-loading-dot" />
          <p>Generating UIL test…</p>
        </div>
      )}

      {phase === "taking" && paper && (
        <AITestPaperView
          paper={paper}
          answers={answers}
          onChange={setAnswer}
          onSubmit={submit}
        />
      )}

      {phase === "submitting" && (
        <div className="test-loading">
          <div className="test-loading-dot" />
          <p>Grading…</p>
        </div>
      )}

      {phase === "results" && paper && grade && (
        <AITestResults paper={paper} grade={grade} onRestart={reset} />
      )}

      {phase === "error" && (
        <div className="test-error" role="alert">
          <h2>Something went wrong</h2>
          <p>{errorMessage ?? "Unknown error"}</p>
          <button type="button" className="test-idle-btn" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
