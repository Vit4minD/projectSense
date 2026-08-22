"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useFeedback } from "@/hooks/useFeedback";
import { submitFeedback } from "@/lib/firebase/feedback";
import type { FeedbackCategory } from "@/lib/types";

const CATEGORIES: { key: FeedbackCategory; label: string }[] = [
  { key: "bug", label: "Bug" },
  { key: "idea", label: "Idea" },
  { key: "other", label: "Other" },
];

export function FeedbackModal() {
  const { open, setOpen } = useFeedback();
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // Reset each time the modal closes.
  useEffect(() => {
    if (!open) {
      setCategory("idea");
      setMessage("");
      setStatus("idle");
      setError("");
    }
  }, [open]);

  async function onSubmit() {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    const res = await submitFeedback(category, message.trim());
    if (res.ok) {
      setStatus("sent");
      setTimeout(() => setOpen(false), 1200);
    } else {
      setStatus("error");
      setError(res.error || "Something went wrong.");
    }
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Send feedback">
      <div className="modal-head">
        <h3>Send feedback</h3>
        <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
      </div>

      {status === "sent" ? (
        <p className="feedback-status">Thanks — got it! 🎉</p>
      ) : (
        <>
          <div className="feedback-cats">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={category === c.key ? "active" : ""}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            className="feedback-textarea"
            placeholder="What's working, what's broken, what you'd love to see…"
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
          />
          {status === "error" && <p className="feedback-status error">{error}</p>}
          <div className="feedback-actions">
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={onSubmit}
              disabled={!message.trim() || status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
