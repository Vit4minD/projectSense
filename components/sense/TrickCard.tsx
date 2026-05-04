"use client";

import { CATEGORIES } from "@/lib/data/categories";
import type { Trick } from "@/lib/types";
import { formatTime } from "@/lib/drill/utils";

type Variant = "default" | "list-row" | "featured";

type TrickCardProps = {
  trick: Trick;
  onClick?: () => void;
  variant?: Variant;
  bestMs?: number;
  /** Override label (used by the "weakness" featured card). */
  tagOverride?: string;
};

export function TrickCard({ trick, onClick, variant = "default", bestMs, tagOverride }: TrickCardProps) {
  const label = CATEGORIES.find((c) => c.key === trick.cat)?.label ?? trick.cat;
  const bestDisplay = bestMs !== undefined ? formatTime(bestMs).replace(/^00:/, "") : trick.best.replace(/^00:/, "");

  if (variant === "list-row") {
    return (
      <div className="trick-card list-row" onClick={onClick}>
        <span className="num-id" style={{ minWidth: 40 }}>/ {trick.id}</span>
        <div className="title">{trick.name}</div>
        <div className="example">{trick.example}</div>
        <div className="meta">
          <span>
            best <span className="best">{bestDisplay}</span>
          </span>
          <span>
            {"•".repeat(trick.difficulty)}
            <span style={{ color: "var(--muted-2)" }}>{"•".repeat(3 - trick.difficulty)}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`trick-card ${variant === "featured" ? "featured" : ""}`} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="tag">{tagOverride ?? label}</span>
        <span className="num-id">/ {trick.id}</span>
      </div>
      <div className="title">{trick.name}</div>
      <div className="example">{trick.example}</div>
      <div className="meta">
        <span>
          best <span className="best">{bestDisplay}</span>
        </span>
        <span>
          {"•".repeat(trick.difficulty)}
          <span style={{ color: "var(--muted-2)" }}>{"•".repeat(3 - trick.difficulty)}</span>
        </span>
      </div>
    </div>
  );
}
