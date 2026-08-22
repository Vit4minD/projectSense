"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
};

export function Modal({ open, onClose, label, children }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      cardRef.current
        ?.querySelector<HTMLElement>("textarea, button, input, [href]")
        ?.focus();
    }, 20);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
