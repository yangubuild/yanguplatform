/**
 * Global voice controller for ADA — multilingual.
 *
 * Guarantees:
 *  - Only ONE active playback at a time.
 *  - Any new input (mic, typing, new ADA request) can interrupt current speech
 *    AND cancel any in-flight ADA event handling via session tokens.
 *  - Multilingual: ElevenLabs primary (via ada-tts edge fn) → Google fallback
 *    (also via ada-tts) → browser speechSynthesis as final fallback.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AdaLanguage } from "./languageDetect";

type Listener = (speaking: boolean) => void;

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeRequestId = 0;
let speaking = false;
let activeSessionId = 0;
const listeners = new Set<Listener>();

/** Session-locked voice id (per language) so a single call doesn't switch voices mid-flow. */
let sessionVoiceRef: string | null = null;
let sessionVoiceLang: AdaLanguage | null = null;

/** Pending end-of-playback resolvers for speakAsync(). Cleared on interrupt. */
const pendingResolvers = new Set<() => void>();

function flushPendingResolvers() {
  for (const r of pendingResolvers) {
    try { r(); } catch { /* ignore */ }
  }
  pendingResolvers.clear();
}

function notify() {
  for (const l of listeners) {
    try { l(speaking); } catch { /* ignore */ }
  }
}

function setSpeaking(v: boolean) {
  if (speaking === v) return;
  speaking = v;
  notify();
}

/** Stop any current speech immediately (audio element + speechSynthesis). */
export function stopSpeaking(): void {
  // Invalidate any pending TTS request.
  activeRequestId += 1;

  if (activeAudio) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.src = "";
      activeAudio.load?.();
    } catch { /* ignore */ }
    activeAudio = null;
  }

  try {
    if (typeof window !== "undefined") {
      const synth = window.speechSynthesis;
      if (synth && (synth.speaking || synth.pending)) synth.cancel();
    }
  } catch { /* ignore */ }

  activeUtterance = null;
  setSpeaking(false);
  flushPendingResolvers();
}

/**
 * HARD interrupt: synchronously cancels TTS playback and pending requests.
 * MUST be called before starting a new recording to guarantee zero overlap.
 */
export function voiceInterrupt(): void {
  stopSpeaking();
}

const BROWSER_LANG_MAP: Record<AdaLanguage, string> = {
  en: "en-US", ar: "ar-SA", fr: "fr-FR", sw: "sw-KE", lg: "sw-KE", rw: "rw-RW",
};

function speakBrowser(text: string, lang: AdaLanguage) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = BROWSER_LANG_MAP[lang] || "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => {
      if (activeUtterance === utter) { activeUtterance = null; setSpeaking(false); }
    };
    utter.onerror = () => {
      if (activeUtterance === utter) { activeUtterance = null; setSpeaking(false); }
    };
    activeUtterance = utter;
    setSpeaking(true);
    synth.speak(utter);
  } catch {
    activeUtterance = null;
    setSpeaking(false);
  }
}

/**
 * Speak text in the given language.
 * Cancels any current playback first (barge-in).
 */
export function speak(text: string, lang: AdaLanguage = "en"): void {
  if (!text) return;
  if (typeof window === "undefined") return;

  // Always interrupt previous speech.
  stopSpeaking();

  const reqId = ++activeRequestId;
  setSpeaking(true);

  // Fire async TTS request; play when ready unless superseded.
  (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ada-tts", {
        body: { text, language: lang },
      });

      // Superseded by a newer request — drop silently.
      if (reqId !== activeRequestId) return;

      if (error || !data?.ok || !data?.audio_base64) {
        // Fall back to browser TTS.
        speakBrowser(text, lang);
        return;
      }

      const audio = new Audio(`data:${data.mime || "audio/mpeg"};base64,${data.audio_base64}`);
      audio.onended = () => {
        if (activeAudio === audio) { activeAudio = null; setSpeaking(false); }
      };
      audio.onerror = () => {
        if (activeAudio === audio) {
          activeAudio = null;
          // Try browser fallback if MP3 playback failed.
          speakBrowser(text, lang);
        }
      };
      activeAudio = audio;
      try {
        await audio.play();
      } catch {
        if (activeAudio === audio) activeAudio = null;
        speakBrowser(text, lang);
      }
    } catch {
      if (reqId !== activeRequestId) return;
      speakBrowser(text, lang);
    }
  })();
}

/** Returns true if TTS is currently playing or pending. */
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
  stopSpeaking();
  return {
    id,
    isActive: () => activeSessionId === id,
  };
}

/** Cancel the currently-active session and stop speech. */
export function interrupt(): void {
  activeSessionId += 1;
  stopSpeaking();
}

/** Returns the current session id (for diagnostics). */
export function currentSessionId(): number {
  return activeSessionId;
}
