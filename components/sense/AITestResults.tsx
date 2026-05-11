"use client";

import type { AITestGrade, AITestPaper } from "@/lib/types";

type Props = {
  paper: AITestPaper;
  grade: AITestGrade;
  onRestart: () => void;
};

export function AITestResults({ paper, grade, onRestart }: Props) {
  return (
    <div className="test-results">
      <div className="test-results-grid">
        <section className="test-results-pane test-results-yours">
          <h2 className="test-pane-head">Your answers</h2>
          {grade.items.map((it) => {
            const q = paper.questions.find((p) => p.number === it.number);
            return (
              <div
                key={it.number}
                className={`test-item ${it.correct ? "test-item-correct" : it.blank ? "test-item-blank" : "test-item-wrong"}`}
              >
                <div className="test-item-head">
                  <span className="test-num-badge">{it.number}</span>
                  <span className="test-item-prompt">{q?.prompt ?? ""}</span>
                  <span className="test-item-mark">{it.correct ? "✓" : it.blank ? "—" : "✗"}</span>
                </div>
                <div className="test-item-row">
                  <span className="test-item-label">You:</span>
                  <span className="test-item-value">{it.userAnswer || "(blank)"}</span>
                </div>
                {!it.correct && (
                  <div className="test-item-row">
                    <span className="test-item-label">Correct:</span>
                    <span className="test-item-value">{it.correctAnswer}</span>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="test-results-pane test-results-key">
          <h2 className="test-pane-head">Answer key</h2>
          {paper.questions.map((q) => (
            <div key={q.number} className="test-key-row">
              <span className="test-num-badge">{q.number}</span>
              <span className="test-key-prompt">{q.prompt}</span>
              <span className="test-key-answer">{q.answer}</span>
            </div>
          ))}
        </section>

        <aside className="test-score-card">
          <div className="test-score-label">UIL score</div>
          <div className="test-score-number">{grade.score}</div>
          <div className="test-score-meta">
            <div>
              <strong>{grade.numberCorrect}</strong> correct
            </div>
            <div>
              answered through <strong>{grade.lastQuestion}</strong> / 40
            </div>
          </div>
          <button type="button" className="test-submit" onClick={onRestart}>
            Take another test
          </button>
          <p className="test-disclaimer">
            AI-generated — verify any questionable items against UIL official keys.
          </p>
        </aside>
      </div>
    </div>
  );
}
