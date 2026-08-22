"use client";

import { useEffect, useState } from "react";
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
        <h3>Welcome back 👋</h3>
        <button className="modal-close" onClick={dismiss} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
        hey long time no see! I revamped the website and fixed up some bugs. Feel free to give
        some feedback and suggestions!
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
