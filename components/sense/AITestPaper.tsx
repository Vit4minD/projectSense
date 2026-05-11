"use client";

import type { AITestPaper } from "@/lib/types";

type Props = {
  paper: AITestPaper;
  answers: Record<number, string>;
  onChange: (n: number, value: string) => void;
  onSubmit: () => void;
};

export function AITestPaperView({ paper, answers, onChange, onSubmit }: Props) {
  const answered = Object.values(answers).filter((v) => v.trim() !== "").length;
  return (
    <div className="test-paper">
      <div className="test-paper-head">
        <div>
          <h1>UIL Number Sense — Practice</h1>
          <p className="test-paper-sub">40 questions · Tab to advance</p>
        </div>
        <div className="test-paper-chip">
          {answered} / {paper.questions.length}
        </div>
      </div>

      {paper.questions.map((q) => (
        <div key={q.number} className="test-row">
          <span className="test-num-badge">{q.number}</span>
          <span className="test-prompt">{q.prompt}</span>
          <input
            className="test-input"
            type="text"
            value={answers[q.number] ?? ""}
            onChange={(e) => onChange(q.number, e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label={`Question ${q.number}`}
          />
        </div>
      ))}

      <div className="test-submit-row">
        <button type="button" className="test-submit" onClick={onSubmit}>
          Submit for grading
        </button>
      </div>
    </div>
  );
}
