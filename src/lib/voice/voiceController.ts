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

export interface SpeakOptions {
  /** Override the per-session voice id. */
  voiceId?: string;
  /** When true, ignore the session-locked voice and use a fresh one. */
  ignoreSessionVoice?: boolean;
}

function resolveVoiceId(lang: AdaLanguage, opts?: SpeakOptions): string | undefined {
  if (opts?.voiceId) {
    if (!opts.ignoreSessionVoice) {
      sessionVoiceRef = opts.voiceId;
      sessionVoiceLang = lang;
    }
    return opts.voiceId;
  }
  if (!opts?.ignoreSessionVoice && sessionVoiceRef && sessionVoiceLang === lang) {
    return sessionVoiceRef;
  }
  return undefined;
}

/**
 * Internal worker — handles one playback. Optional `onDone` fires once when
 * playback completes OR is superseded/errored, so speakAsync can resolve.
 */
function speakInternal(
  text: string,
  lang: AdaLanguage,
  opts: SpeakOptions | undefined,
  onDone?: () => void,
): void {
  if (!text) { onDone?.(); return; }
  if (typeof window === "undefined") { onDone?.(); return; }

  // Always interrupt previous speech (barge-in).
  stopSpeaking();

  const reqId = ++activeRequestId;
  setSpeaking(true);

  const voiceId = resolveVoiceId(lang, opts);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };

  (async () => {
    try {
      const body: Record<string, unknown> = { text, language: lang };
      if (voiceId) body.voice_id = voiceId;
      const { data, error } = await supabase.functions.invoke("ada-tts", { body });

      if (reqId !== activeRequestId) { finish(); return; }

      if (error || !data?.ok || !data?.audio_base64) {
        speakBrowser(text, lang);
        // Browser TTS is fire-and-forget here; resolve immediately-ish.
        // We hook into utterance end below for accuracy.
        if (activeUtterance) {
          const u = activeUtterance;
          const prevEnd = u.onend;
          u.onend = (ev) => { try { (prevEnd as any)?.call(u, ev); } finally { finish(); } };
          const prevErr = u.onerror;
          u.onerror = (ev) => { try { (prevErr as any)?.call(u, ev); } finally { finish(); } };
        } else {
          finish();
        }
        return;
      }

      const audio = new Audio(`data:${data.mime || "audio/mpeg"};base64,${data.audio_base64}`);
      audio.onended = () => {
        if (activeAudio === audio) { activeAudio = null; setSpeaking(false); }
        finish();
      };
      audio.onerror = () => {
        if (activeAudio === audio) {
          activeAudio = null;
          speakBrowser(text, lang);
        }
        finish();
      };
      activeAudio = audio;
      try {
        await audio.play();
      } catch {
        if (activeAudio === audio) activeAudio = null;
        speakBrowser(text, lang);
        finish();
      }
    } catch {
      if (reqId !== activeRequestId) { finish(); return; }
      speakBrowser(text, lang);
      finish();
    }
  })();
}

/**
 * Speak text in the given language.
 * Cancels any current playback first (barge-in). Fire-and-forget.
 */
export function speak(text: string, lang: AdaLanguage = "en", opts?: SpeakOptions): void {
  speakInternal(text, lang, opts);
}

/**
 * Speak text and resolve when playback finishes (or is interrupted).
 * Use this when sequencing UI transitions after ADA finishes talking.
 */
export function speakAsync(
  text: string,
  lang: AdaLanguage = "en",
  opts?: SpeakOptions,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const done = () => {
      pendingResolvers.delete(done);
      resolve();
    };
    pendingResolvers.add(done);
    speakInternal(text, lang, opts, done);
  });
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
  // Reset session-locked voice; first speak() call will set it.
  sessionVoiceRef = null;
  sessionVoiceLang = null;
  return {
    id,
    isActive: () => activeSessionId === id,
  };
}

/** Lock a specific voice id for the rest of the session (e.g. for a given language). */
export function lockSessionVoice(voiceId: string, lang: AdaLanguage = "en"): void {
  sessionVoiceRef = voiceId;
  sessionVoiceLang = lang;
}

/** Returns the currently locked session voice id, if any. */
export function getSessionVoiceId(): string | null {
  return sessionVoiceRef;
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
