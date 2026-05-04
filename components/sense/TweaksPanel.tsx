"use client";

import { useEffect } from "react";
import { useTweaks } from "@/hooks/useTweaks";

const THEMES = [
  { key: "sage", label: "Sage", color: "#1F6E4A" },
  { key: "ink", label: "Ink", color: "#FF5B1F" },
  { key: "mono", label: "Mono", color: "#000000" },
  { key: "arcade", label: "Arcade", color: "#FFDD00" },
] as const;

export function TweaksPanel() {
  const { tweaks, setTweaks, visible, setVisible } = useTweaks();

  // Listen for the postMessage protocol used by the design tool / external host.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = (e.data || {}) as { type?: string };
      if (d.type === "__activate_edit_mode") setVisible(true);
      if (d.type === "__deactivate_edit_mode") setVisible(false);
    };
    window.addEventListener("message", onMsg);
    try {
      window.parent?.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {
      // ignore — no parent frame
    }
    return () => window.removeEventListener("message", onMsg);
  }, [setVisible]);

  if (!visible) return null;
  return (
    <div className="tweaks-panel">
      <h4>
        <span>Tweaks</span>
        <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>v1</span>
      </h4>

      <div className="tweaks-row">
        <div className="lbl">Theme</div>
        <div className="tweaks-swatches">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`tweaks-swatch ${tweaks.theme === t.key ? "active" : ""}`}
              onClick={() => setTweaks({ theme: t.key })}
            >
              <span className="dot" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tweaks-row">
        <div className="lbl">Numerals</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`chip ${!tweaks.monoNumerals ? "active" : ""}`}
            onClick={() => setTweaks({ monoNumerals: false })}
          >
            Serif italic
          </button>
          <button
            className={`chip ${tweaks.monoNumerals ? "active" : ""}`}
            onClick={() => setTweaks({ monoNumerals: true })}
          >
            Mono
          </button>
        </div>
      </div>

      <div className="tweaks-row">
        <div className="lbl">Density</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["comfortable", "dense", "list"] as const).map((d) => (
            <button
              key={d}
              className={`chip ${tweaks.density === d ? "active" : ""}`}
              onClick={() => setTweaks({ density: d })}
            >
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
