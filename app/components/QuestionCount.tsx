async function postIncrement(kind: "questions_answered" | "questions_generated", n = 1) {
  try {
    await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, n }),
    });
  } catch {
    // best-effort counter; ignore failures
  }
}

const updateAnsweredQuestions = () => postIncrement("questions_answered", 1);

const updateGeneratedQuestions = (num: number) => postIncrement("questions_generated", num);

export { updateAnsweredQuestions, updateGeneratedQuestions };
