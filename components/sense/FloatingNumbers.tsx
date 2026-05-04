"use client";

import { useMemo } from "react";

const POOL = ["3", "7", "12", "π", "42", "∞", "11", "√2", "28", "÷", "×", "+", "=", "∑", "%", "9", "64", "±", "∫", "Δ", "φ", "e", "17", "53", "81"];

type FloatItem = {
  text: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};

/**
 * Ambient drifting equations for the login screen's left panel. Pure CSS via
 * `floatDrift` keyframes; cheap to render. Position/size/duration are seeded
 * once on mount so the layout doesn't reshuffle on every state change.
 */
export function FloatingNumbers() {
  const items = useMemo<FloatItem[]>(
    () =>
      POOL.map((text) => ({
        text,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 32,
        duration: 18 + Math.random() * 24,
        delay: -Math.random() * 20,
        opacity: 0.04 + Math.random() * 0.08,
      })),
    [],
  );

  return (
    <div className="login-floating-nums" aria-hidden>
      {items.map((n, i) => (
        <span
          key={i}
          className="login-float-num"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            fontSize: n.size,
            animationDuration: `${n.duration}s`,
            animationDelay: `${n.delay}s`,
            opacity: n.opacity,
          }}
        >
          {n.text}
        </span>
      ))}
    </div>
  );
}
