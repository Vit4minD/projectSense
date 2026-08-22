import { afterEach, describe, expect, it } from "vitest";
import { appShortcutsBlocked, isModalOpen, isTypingTarget } from "@/lib/keyboard";

/** Build a KeyboardEvent-like object with a given target element. */
function ev(target: EventTarget | null): Pick<KeyboardEvent, "target"> {
  return { target };
}

afterEach(() => {
  delete document.body.dataset.modalOpen;
});

describe("isTypingTarget", () => {
  it("is true for input, textarea, and select", () => {
    for (const tag of ["input", "textarea", "select"] as const) {
      expect(isTypingTarget(ev(document.createElement(tag)))).toBe(true);
    }
  });

  it("is true for a contenteditable element", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isTypingTarget(ev(div))).toBe(true);
  });

  it("is false for non-editable elements and null targets", () => {
    expect(isTypingTarget(ev(document.createElement("button")))).toBe(false);
    expect(isTypingTarget(ev(document.createElement("div")))).toBe(false);
    expect(isTypingTarget(ev(null))).toBe(false);
  });
});

describe("isModalOpen / appShortcutsBlocked", () => {
  it("tracks the body modalOpen flag", () => {
    expect(isModalOpen()).toBe(false);
    document.body.dataset.modalOpen = "true";
    expect(isModalOpen()).toBe(true);
  });

  it("blocks shortcuts when a modal is open, regardless of target", () => {
    document.body.dataset.modalOpen = "true";
    expect(appShortcutsBlocked(ev(document.createElement("button")))).toBe(true);
  });

  it("blocks shortcuts when typing in a field, even with no modal", () => {
    expect(appShortcutsBlocked(ev(document.createElement("textarea")))).toBe(true);
  });

  it("allows shortcuts when no modal is open and focus is not in a field", () => {
    expect(appShortcutsBlocked(ev(document.createElement("button")))).toBe(false);
  });
});
