"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DrillProblem } from "@/components/sense/DrillProblem";
import { getTrickById } from "@/lib/data/tricks";
import { generate } from "@/lib/drill/problemGenerator";
import { equals } from "@/lib/drill/answerValidator";
import { formatShort, formatTime } from "@/lib/drill/utils";
import { useTimer } from "@/hooks/useTimer";
import { useAuth } from "@/hooks/useAuth";
import { saveDrillResult } from "@/lib/firebase/drills";
import { trackEvent } from "@/lib/firebase/analytics";
import { celebrateCorrect } from "@/lib/effects";
import { appShortcutsBlocked } from "@/lib/keyboard";
import type { GeneratedProblem, PerQuestion } from "@/lib/types";

const QUESTIONS_PER_DRILL = 5;

export default function DrillPage() {
  const params = useParams<{ trickId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const trick = getTrickById(params.trickId);

  // Stable seed per drill instance — set once, reset on retry via remount
  // (the route key changes when results page redirects).
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const problems = useMemo<GeneratedProblem[]>(() => {
    if (!trick) return [];
    try {
      return generate(trick.id, seed, QUESTIONS_PER_DRILL);
    } catch {
      return [];
    }
  }, [trick, seed]);

  const [answer, setAnswer] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [perQuestion, setPerQuestion] = useState<PerQuestion[]>([]);
  const timer = useTimer();
  const submittingRef = useRef(false);

  // Start the timer once we have problems.
  useEffect(() => {
    if (problems.length > 0) {
      timer.start();
      if (trick) void trackEvent("drill_started", { trick_id: trick.id });
    }
    return () => timer.reset();
    // intentionally only run once per problem set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems.length]);

  // Esc to quit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (appShortcutsBlocked(e)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!trick) {
    return (
      <div className="drill" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
        <div style={{ textAlign: "center" }}>
          <h1>Unknown trick</h1>
          <button className="btn primary" onClick={() => router.push("/")}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const current = problems[qIdx];

  function commitAnswer(submitted: string, isCorrect: boolean) {
    if (isCorrect) celebrateCorrect();
    timer.markQuestion();
    const elapsed = timer.elapsedMs;
    const lastSlice = perQuestion.reduce((sum, p) => sum + p.ms, 0);
    const sliceMs = Math.max(0, elapsed - lastSlice);
    const next: PerQuestion = {
      problem: current.prompt,
      answer: submitted,
      expected: current.expected,
      correct: isCorrect,
      ms: sliceMs,
    };
    const updated = [...perQuestion, next];
    setPerQuestion(updated);
    setAnswer("");

    if (updated.length >= QUESTIONS_PER_DRILL) {
      finalize(updated);
    } else {
      setQIdx(qIdx + 1);
    }
  }

  async function finalize(allAnswers: PerQuestion[]) {
    if (submittingRef.current) return;
    if (!trick) return;
    submittingRef.current = true;
    // Whole milliseconds only: the leaderboard API + Firestore records expect
    // an integer, and sub-millisecond precision is meaningless here.
    const totalMs = Math.round(timer.stop());
    if (!user) {
      router.push("/login");
      return;
    }
    const trickId = trick.id;
    try {
      const drillId = await saveDrillResult(user.uid, trickId, totalMs, allAnswers);
      router.push(`/drill/${trickId}/results?d=${drillId}`);
    } catch (err) {
      console.error("Failed to save drill", err);
      router.push(`/drill/${trickId}/results`);
    }
  }

  function onChange(value: string) {
    setAnswer(value);
    // Auto-enter on correct
    if (value && current && equals(value, current.expected)) {
      commitAnswer(value, true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Ignore Enter on an empty input: a correct answer auto-commits on change
      // and clears the field, so a habitual second Enter would otherwise commit
      // the NEXT question as blank/wrong and break the 5/5.
      if (answer.trim() === "" || !current) return;
      e.preventDefault();
      commitAnswer(answer, equals(answer, current.expected));
    }
  }

  const recentTimes = perQuestion.slice(-3);

  return (
    <div className="drill">
      <div className="drill-top">
        <div className="crumbs">
          <button
            className="btn ghost"
            type="button"
            onClick={() => router.push("/")}
            style={{ padding: "4px 8px" }}
            aria-label="Quit drill"
          >
            <X size={14} />
          </button>
          <span>trick / {trick.id}</span>
          <strong>{trick.name}</strong>
        </div>
        <div className="drill-progress">
          {Array.from({ length: QUESTIONS_PER_DRILL }, (_, i) => {
            const slot = perQuestion[i];
            const cls = slot
              ? slot.correct
                ? "done"
                : "wrong"
              : i === qIdx
                ? "active"
                : "";
            return <span key={i} className={`pip ${cls}`} />;
          })}
        </div>
        <div className="drill-timer">
          <span className="dot" />
          {formatTime(timer.elapsedMs)}
        </div>
      </div>

      <div className="drill-body">
        <div className="drill-q-index">
          QUESTION {qIdx + 1} / {QUESTIONS_PER_DRILL}
        </div>

        {recentTimes.length > 0 && (
          <div className="time-bars">
            {recentTimes.map((p, i) => (
              <div key={i} className="row">
                <span>Q{perQuestion.length - recentTimes.length + i + 1}</span>
                <div className="bar">
                  <span style={{ width: `${Math.min(100, (p.ms / 1000) * 14)}%` }} />
                </div>
                <span style={{ minWidth: 36, textAlign: "right" }}>{formatShort(p.ms)}</span>
              </div>
            ))}
          </div>
        )}

        {current ? (
          <DrillProblem prompt={current.prompt} />
        ) : (
          <p style={{ color: "var(--muted)" }}>No problems available for this trick.</p>
        )}
      </div>

      <div className="drill-bottom">
        <input
          className="drill-input"
          placeholder="—"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          inputMode="numeric"
          aria-label="Your answer"
        />
        <div className="drill-hint">
          <span>auto-enter on correct</span>
          <span>
            <span className="kbd">↵</span> submit
          </span>
          <span>
            <span className="kbd">⌫</span> clear
          </span>
          <span>
            <span className="kbd">esc</span> quit
          </span>
        </div>
      </div>
    </div>
  );
}
