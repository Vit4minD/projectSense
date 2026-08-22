"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { useFeedback } from "@/hooks/useFeedback";

const SEEN_KEY = "sense:announce:v2";

export function AnnouncementModal() {
  const { setOpen: setFeedbackOpen } = useFeedback();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) !== "seen") setOpen(true);
    } catch {
      // ignore (private mode etc.) — just don't show
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, "seen");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <Modal open={open} onClose={dismiss} label="What's new">
      <div className="modal-head">
        <h3>
          <Sparkles size={16} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          Welcome to the new Sense
        </h3>
        <button className="modal-close" onClick={dismiss} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
        Project Sense got a full rebuild — faster timed drills, real-time multiplayer races,
        AI-generated full-length tests, mini-games, and a cleaner look throughout.
      </p>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>
        It&apos;s been a while, so tell me what you think — bugs, ideas, anything.
      </p>
      <div className="feedback-actions">
        <button className="btn ghost" type="button" onClick={dismiss}>
          Got it
        </button>
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            dismiss();
            setFeedbackOpen(true);
          }}
        >
          Send feedback
        </button>
      </div>
    </Modal>
  );
}
