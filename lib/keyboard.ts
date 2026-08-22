/**
 * Shared guards for global (window-level) keyboard shortcut listeners.
 *
 * App shortcuts (single-key nav, drill/game keys) attach to `window`, so they
 * fire even when the user is typing in a field or an overlay modal is open.
 * Every global keydown handler should early-return on `appShortcutsBlocked(e)`
 * so shortcuts never steal keystrokes from a form or a dialog.
 */

/** True when the event originates from an editable element (input/textarea/select/contenteditable). */
export function isTypingTarget(e: Pick<KeyboardEvent, "target">): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  // `isContentEditable` covers real browsers (incl. inherited editability); the
  // reflected `contentEditable` attribute is the fallback (jsdom doesn't compute
  // the former without layout).
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    t.isContentEditable === true ||
    t.contentEditable === "true" ||
    t.contentEditable === "plaintext-only"
  );
}

/** True while a `Modal` is open (it sets `document.body.dataset.modalOpen`). */
export function isModalOpen(): boolean {
  return typeof document !== "undefined" && document.body.dataset.modalOpen === "true";
}

/** True when global app shortcuts must not act: a modal is open, or focus is in a field. */
export function appShortcutsBlocked(e: Pick<KeyboardEvent, "target">): boolean {
  return isModalOpen() || isTypingTarget(e);
}
