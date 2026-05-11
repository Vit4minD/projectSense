"use client";

import type { TwentyFourState } from "@/lib/types";

type Props = {
  state: TwentyFourState;
  solveFlash: boolean;
  onSelect: (i: number) => void;
};

export function TwentyFourBoard({ state, solveFlash, onSelect }: Props) {
  // Always render 4 slots; pad with empty placeholders when the hand has been
  // partially combined so the grid keeps its 2x2 shape.
  const slots: Array<{ value: string; idx: number } | null> = Array.from(
    { length: 4 },
    (_, i) => (i < state.hand.length ? { value: state.hand[i], idx: i } : null),
  );

  return (
    <div className={`t24-board ${solveFlash ? "t24-solve-flash" : ""}`}>
      {slots.map((slot, i) => {
        if (slot === null) {
          return <div key={`empty-${i}`} className="t24-tile empty" />;
        }
        const selected = state.selected.includes(slot.idx);
        return (
          <button
            key={`tile-${slot.idx}`}
            type="button"
            className={`t24-tile ${selected ? "selected" : ""}`}
            onClick={() => onSelect(slot.idx)}
            aria-pressed={selected}
            aria-label={`Number ${slot.value}`}
          >
            {slot.value}
          </button>
        );
      })}
    </div>
  );
}
