/**
 * Global voice controller for ADA.
 *
 * Guarantees:
 *  - Only ONE active speech playback at a time.
 *  - Any new input (mic, typing, new ADA request) can interrupt current speech
 *    AND cancel any in-flight ADA event handling via session tokens.
 *  - No overlapping audio.
 */

type Listener = (speaking: boolean) => void;

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speaking = false;
let activeSessionId = 0;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) {
    try { l(speaking); } catch { /* ignore */ }
  }
}

/** Stop any current speech immediately. */
export function stopSpeaking(): void {
  try {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
  } catch {
    // best-effort
  }
  activeUtterance = null;
  if (speaking) {
    speaking = false;
    notify();
  }
}

/** Speak text — cancels any current playback first. */
export function speak(text: string): void {
  if (!text) return;
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  // Always interrupt previous speech.
  stopSpeaking();

  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => {
      if (activeUtterance === utter) {
        activeUtterance = null;
        speaking = false;
        notify();
      }
    };
    utter.onerror = () => {
      if (activeUtterance === utter) {
        activeUtterance = null;
        speaking = false;
        notify();
      }
    };
    activeUtterance = utter;
    speaking = true;
    notify();
    synth.speak(utter);
  } catch {
    activeUtterance = null;
    speaking = false;
    notify();
  }
}

/** Returns true if TTS is currently playing. */
export function isSpeaking(): boolean {
  return speaking;
}

/** Subscribe to speaking-state changes. */
export function onSpeakingChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Begin a new ADA session. Returns a token + helper to check if it's still active.
 * Calling this invalidates any prior session AND stops current speech (barge-in).
 */
export function beginSession(): { id: number; isActive: () => boolean } {
  activeSessionId += 1;
  const id = activeSessionId;
  // Any new session implicitly interrupts ongoing speech.
  stopSpeaking();
  return {
    id,
    isActive: () => activeSessionId === id,
  };
}

/** Cancel the currently-active session and stop speech. */
export function interrupt(): void {
  activeSessionId += 1; // invalidate any in-flight handler
  stopSpeaking();
}

/** Returns the current session id (for diagnostics). */
export function currentSessionId(): number {
  return activeSessionId;
}