/**
 * Renders the giant centerpiece problem for the drill screen.
 *
 * The prototype's typography expects standalone operators ("×", "÷", "−") to
 * be wrapped in <span class="op"> for the white-on-orange treatment, and
 * superscript exponents ("²", "^k") to render as <sup>. This component does
 * both transforms while leaving everything else as raw text.
 */
export function DrillProblem({ prompt }: { prompt: string }) {
  // "n²" — render the trailing superscript token nicely.
  if (/²$/.test(prompt)) {
    return (
      <div className="drill-problem">
        {prompt.replace(/²$/, "")}
        <sup style={{ fontSize: "0.55em" }}>2</sup>
      </div>
    );
  }
  // "a^k" — render the part after ^ as a sup.
  if (/\^/.test(prompt)) {
    const [base, exp] = prompt.split("^");
    return (
      <div className="drill-problem">
        {base}
        <sup style={{ fontSize: "0.55em" }}>{exp}</sup>
      </div>
    );
  }

  // Tokenize on " × ", " ÷ ", " − ", " - ", " + " and wrap operators.
  const parts = prompt.split(/(\s[×÷+−\-]\s)/);
  return (
    <div className="drill-problem">
      {parts.map((tok, i) => {
        const isOp = /^\s[×÷+−\-]\s$/.test(tok);
        return isOp ? (
          <span key={i} className="op">
            {tok.trim()}
          </span>
        ) : (
          <span key={i}>{tok}</span>
        );
      })}
    </div>
  );
}
