/**
 * Honor the user's `Tweaks.soundEffects` and `Tweaks.haptics` toggles.
 *
 * Both helpers read the live `<html data-sound|data-haptics>` attribute that
 * `useTweaks` writes, so they don't need a React hook to stay in sync. Calling
 * these from any context (event handler, effect, callback) is safe.
 */

let cachedAudio: HTMLAudioElement | null = null;

function isSoundOn(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-sound") !== "off";
}

function isHapticsOn(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-haptics") !== "off";
}

/**
 * Play the success chime if sound is enabled. Best-effort: any failure
 * (autoplay block, missing file) is silently swallowed so it can never
 * disrupt drill flow.
 */
export function playCorrectSound(): void {
  if (!isSoundOn()) return;
  if (typeof window === "undefined") return;
  try {
    if (!cachedAudio) {
      cachedAudio = new Audio("/correctSound.mp3");
      cachedAudio.preload = "auto";
      cachedAudio.volume = 0.6;
    }
    cachedAudio.currentTime = 0;
    void cachedAudio.play().catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Trigger a short device vibration if haptics is enabled and supported.
 * Desktop browsers ignore `navigator.vibrate`; mobile honors it.
 */
export function pulseHaptic(durationMs = 20): void {
  if (!isHapticsOn()) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // ignore
  }
}

/** Convenience wrapper — call when the user gets an answer right. */
export function celebrateCorrect(): void {
  playCorrectSound();
  pulseHaptic();
}
