"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { ZetamacBoard } from "@/components/sense/ZetamacBoard";
import { useZetamac } from "@/hooks/useZetamac";
import type { ZetamacConfig, ZetamacOperator, ZetamacRange } from "@/lib/types";

const ALL_OPS: ZetamacOperator[] = ["+", "-", "*", "/"];
const OP_LABEL: Record<ZetamacOperator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

const DURATION_PRESETS = [60, 120, 300] as const;

type RangeKey =
  | "addRange"
  | "subRange"
  | "mulARange"
  | "mulBRange"
  | "divDivisorRange"
  | "divQuotientRange";

const RANGE_FIELDS: { key: RangeKey; label: string }[] = [
  { key: "addRange", label: "Addition operands" },
  { key: "subRange", label: "Subtraction operands" },
  { key: "mulARange", label: "Multiplication × a" },
  { key: "mulBRange", label: "Multiplication × b" },
  { key: "divDivisorRange", label: "Division divisor" },
  { key: "divQuotientRange", label: "Division quotient" },
];

export default function ZetamacPage() {
  const {
    state,
    config,
    highScore,
    configError,
    inputRef,
    updateConfig,
    resetConfig,
    startGame,
    setInputValue,
    restart,
    goToConfig,
  } = useZetamac();

  if (state.status === "running") {
    return (
      <div className="zeta-shell">
        <button
          type="button"
          className="zeta-home-btn"
          onClick={() => (window.location.href = "/games")}
          aria-label="Back to games"
        >
          <Home size={16} />
        </button>
        <ZetamacBoard state={state} inputRef={inputRef} onInput={setInputValue} />
      </div>
    );
  }

  if (state.status === "ended") {
    return <EndScreen score={state.score} highScore={highScore} onRestart={restart} onConfig={goToConfig} />;
  }

  return (
    <ConfigScreen
      config={config}
      highScore={highScore}
      configError={configError}
      onChange={updateConfig}
      onReset={resetConfig}
      onStart={startGame}
    />
  );
}

function EndScreen({
  score,
  highScore,
  onRestart,
  onConfig,
}: {
  score: number;
  highScore: number;
  onRestart: () => void;
  onConfig: () => void;
}) {
  const router = useRouter();
  const isNewBest = score > 0 && score >= highScore;
  return (
    <div className="zeta-end">
      <div className="zeta-end-card">
        <h2>Time&apos;s up</h2>
        <div className="zeta-end-score">{score}</div>
        <p className="zeta-end-meta">
          Highscore <strong>{highScore}</strong>
          {isNewBest && <span className="zeta-end-new"> · new best</span>}
        </p>
        <div className="zeta-end-actions">
          <button type="button" className="zeta-btn primary" onClick={onRestart}>
            Play again
          </button>
          <button type="button" className="zeta-btn" onClick={onConfig}>
            Settings
          </button>
          <button type="button" className="zeta-btn" onClick={() => router.push("/games")}>
            Back to games
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigScreen({
  config,
  highScore,
  configError,
  onChange,
  onReset,
  onStart,
}: {
  config: ZetamacConfig;
  highScore: number;
  configError: string | null;
  onChange: (next: ZetamacConfig) => void;
  onReset: () => void;
  onStart: () => void;
}) {
  const [customDuration, setCustomDuration] = useState<number>(() =>
    (DURATION_PRESETS as readonly number[]).includes(config.durationSeconds)
      ? 90
      : config.durationSeconds,
  );

  const updateOps = (op: ZetamacOperator, on: boolean) => {
    const next = on
      ? [...config.operators, op].filter((v, i, a) => a.indexOf(v) === i)
      : config.operators.filter((o) => o !== op);
    if (next.length === 0) return;
    onChange({ ...config, operators: next });
  };

  const updateRange = (key: RangeKey, idx: 0 | 1, raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    const r = config[key];
    const next: ZetamacRange = idx === 0 ? [n, r[1]] : [r[0], n];
    onChange({ ...config, [key]: next });
  };

  const setDuration = (d: number) => {
    onChange({ ...config, durationSeconds: d });
  };

  const isPreset = (DURATION_PRESETS as readonly number[]).includes(config.durationSeconds);

  return (
    <div className="zeta-config">
      <header className="zeta-config-head">
        <h1>Zetamac</h1>
        <p>
          Speed math drill. Highscore <strong>{highScore}</strong>.
        </p>
      </header>

      <section className="zeta-config-section">
        <h3>Operators</h3>
        <div className="zeta-config-row">
          {ALL_OPS.map((op) => {
            const on = config.operators.includes(op);
            const isLastOn = on && config.operators.length === 1;
            return (
              <label key={op} className={`zeta-config-checkbox ${on ? "on" : ""}`}>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={isLastOn}
                  onChange={(e) => updateOps(op, e.target.checked)}
                />
                <span>{OP_LABEL[op]}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="zeta-config-section">
        <h3>Duration</h3>
        <div className="zeta-config-row">
          {DURATION_PRESETS.map((d) => (
            <label key={d} className={`zeta-config-radio ${config.durationSeconds === d ? "on" : ""}`}>
              <input
                type="radio"
                name="duration"
                checked={config.durationSeconds === d}
                onChange={() => setDuration(d)}
              />
              <span>{d}s</span>
            </label>
          ))}
          <label className={`zeta-config-radio ${!isPreset ? "on" : ""}`}>
            <input
              type="radio"
              name="duration"
              checked={!isPreset}
              onChange={() => setDuration(customDuration)}
            />
            <span>Custom</span>
            <input
              type="number"
              min={30}
              max={900}
              className="zeta-config-input"
              value={customDuration}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v)) {
                  setCustomDuration(v);
                  setDuration(v);
                }
              }}
            />
            <span className="zeta-config-unit">sec</span>
          </label>
        </div>
      </section>

      <section className="zeta-config-section">
        <h3>Ranges</h3>
        <div className="zeta-config-grid">
          {RANGE_FIELDS.map(({ key, label }) => {
            const r = config[key];
            return (
              <div key={key} className="zeta-config-range">
                <label>{label}</label>
                <div className="zeta-config-pair">
                  <input
                    type="number"
                    className="zeta-config-input"
                    value={r[0]}
                    min={1}
                    max={9999}
                    onChange={(e) => updateRange(key, 0, e.target.value)}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    className="zeta-config-input"
                    value={r[1]}
                    min={1}
                    max={9999}
                    onChange={(e) => updateRange(key, 1, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {configError && <div className="zeta-config-error">{configError}</div>}

      <div className="zeta-config-actions">
        <button type="button" className="zeta-btn primary" onClick={onStart}>
          Start
        </button>
        <button type="button" className="zeta-btn" onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
