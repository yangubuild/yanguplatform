/**
 * useVoiceCall — voice engine for Speak to Build.
 *
 * Owns:
 *  - Lazy mic acquisition (first user gesture OR after first ADA TTS finishes).
 *  - Web Audio AnalyserNode VAD (RMS sampled every 100 ms).
 *  - Auto start/stop recording based on speech energy.
 *  - Manual override via `toggle()`.
 *  - Hard interrupt priority (TTS cancelled SYNCHRONOUSLY before recorder starts).
 *  - Single active recorder guard (`isRecordingRef`).
 *  - Transcript debounce (drop <2 chars or duplicates within 2 s).
 *  - 4 s VAD stall → "Tap to speak" hint.
 *  - 2× consecutive VAD stalls → fallback message via onSilenceRecovery().
 *  - 30 s STT watchdog → reset to listening.
 *  - Full cleanup on unmount.
 *
 * Does NOT render UI. Does NOT advance the step machine — the consumer
 * receives transcripts via `onTranscript` and decides what to do next.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isSpeaking as ttsIsSpeaking,
  interrupt as voiceInterrupt,
  onSpeakingChange,
} from "@/lib/voice/voiceController";

export type VoiceCallUiState = "idle" | "listening" | "speaking" | "thinking";

export interface UseVoiceCallOptions {
  /** Called with each accepted (debounced) transcript. */
  onTranscript: (text: string, sttLanguage?: string | null) => void;
  /** Called after 2 consecutive VAD stalls. Consumer should TTS a recovery line. */
  onSilenceRecovery?: () => void;
  /** Called when STT fails. Consumer can count failures and reveal text fallback. */
  onSttError?: (err: unknown) => void;
  /** Called when mic permission is denied. */
  onMicDenied?: (err: unknown) => void;
  /** Disable the engine entirely (e.g. parent screen unmounted/paused). */
  enabled?: boolean;
}

export interface UseVoiceCallApi {
  uiState: VoiceCallUiState;
  level: number;            // 0..1 normalized RMS for orb animation
  hint: string | null;      // e.g. "Tap to speak"
  toggle: () => void;       // manual mic button
  stop: () => void;         // stop everything (without full cleanup)
  /** Call when ADA's first TTS finishes — unlocks lazy mic acquisition. */
  notifyFirstSpeechEnded: () => void;
  /** Call from any user gesture (tap on call surface) to satisfy iOS. */
  notifyUserGesture: () => void;
}

// ---- VAD tuning constants (locked) ----
const RMS_SAMPLE_MS = 100;
const SPEECH_START_RMS = 0.04;
const END_SILENCE_MS = 1200;
const MIN_SPEECH_MS = 500;
const MAX_SPEECH_MS = 15_000;
const VAD_STALL_MS = 4_000;
const STT_WATCHDOG_MS = 30_000;
const DEDUP_WINDOW_MS = 2_000;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch { /* ignore */ }
  }
  return "";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function useVoiceCall(opts: UseVoiceCallOptions): UseVoiceCallApi {
  const { onTranscript, onSilenceRecovery, onSttError, onMicDenied, enabled = true } = opts;

  // Public state
  const [uiState, setUiState] = useState<VoiceCallUiState>("speaking"); // ADA speaks first
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  // Refs (never trigger re-render)
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sampleTimerRef = useRef<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const speechStartTsRef = useRef<number>(0);
  const lastSpeechTsRef = useRef<number>(0);
  const listeningSinceRef = useRef<number>(0);

  const stallTimerRef = useRef<number | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);
  const stallCountRef = useRef(0);

  const lastTranscriptRef = useRef<{ text: string; ts: number } | null>(null);
  const micUnlockedRef = useRef(false);
  const micRequestingRef = useRef(false);
  const ttsSpeakingRef = useRef(ttsIsSpeaking());
  const enabledRef = useRef(enabled);
  const cancelledRef = useRef(false);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ---- helpers ----------------------------------------------------------

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current != null) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current != null) {
      window.clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const armStallTimer = useCallback(() => {
    clearStallTimer();
    stallTimerRef.current = window.setTimeout(() => {
      // No speech detected within VAD_STALL_MS of active listening.
      if (!isRecordingRef.current && uiStateRef.current === "listening") {
        setHint("Tap to speak");
        stallCountRef.current += 1;
        if (stallCountRef.current >= 2) {
          stallCountRef.current = 0;
          try { onSilenceRecovery?.(); } catch { /* ignore */ }
        }
      }
    }, VAD_STALL_MS);
  }, [clearStallTimer, onSilenceRecovery]);

  // Mirror uiState in a ref to avoid stale closures.
  const uiStateRef = useRef<VoiceCallUiState>("speaking");
  const setUi = useCallback((s: VoiceCallUiState) => {
    uiStateRef.current = s;
    setUiState(s);
  }, []);

  // ---- mic acquisition --------------------------------------------------

  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (streamRef.current && audioCtxRef.current && analyserRef.current) return true;
    if (micRequestingRef.current) return false;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    micRequestingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const Ctx: typeof AudioContext =
        (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "interactive" } as AudioContextOptions);
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      micUnlockedRef.current = true;
      micRequestingRef.current = false;
      return true;
    } catch (err) {
      micRequestingRef.current = false;
      try { onMicDenied?.(err); } catch { /* ignore */ }
      return false;
    }
  }, [onMicDenied]);

  // ---- VAD sampling loop ------------------------------------------------

  const startSampling = useCallback(() => {
    if (sampleTimerRef.current != null) return;
    const buf = new Uint8Array(analyserRef.current?.fftSize ?? 1024);
    sampleTimerRef.current = window.setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      analyser.getByteTimeDomainData(buf);
      // RMS of zero-centered waveform.
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      setLevel(Math.min(1, rms * 4));

      // Skip VAD logic while ADA is speaking — barge-in is handled via
      // notifyUserGesture/toggle. Auto barge-in on energy alone is too noisy.
      if (uiStateRef.current !== "listening") return;

      const now = performance.now();

      if (!isRecordingRef.current) {
        // Looking for speech start.
        if (rms >= SPEECH_START_RMS) {
          void startRecording("vad");
        }
      } else {
        // Track end-of-speech silence + max duration.
        if (rms >= SPEECH_START_RMS) {
          lastSpeechTsRef.current = now;
        }
        const speechMs = now - speechStartTsRef.current;
        const silenceMs = now - lastSpeechTsRef.current;
        if (speechMs >= MAX_SPEECH_MS) {
          void stopRecording("max");
        } else if (speechMs >= MIN_SPEECH_MS && silenceMs >= END_SILENCE_MS) {
          void stopRecording("silence");
        }
      }
    }, RMS_SAMPLE_MS) as unknown as number;
  }, []);

  const stopSampling = useCallback(() => {
    if (sampleTimerRef.current != null) {
      window.clearInterval(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    setLevel(0);
  }, []);

  // ---- recording --------------------------------------------------------

  const startRecording = useCallback(async (_reason: "vad" | "manual") => {
    if (isRecordingRef.current) return;
    if (!enabledRef.current) return;

    // LOCK 1: Hard interrupt priority — synchronously cancel TTS first.
    if (ttsSpeakingRef.current || ttsIsSpeaking()) {
      voiceInterrupt();
    }

    const ok = await ensureMic();
    if (!ok) return;
    if (isRecordingRef.current) return; // re-check after await

    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(streamRef.current!, { mimeType: mime })
        : new MediaRecorder(streamRef.current!);
    } catch (err) {
      onSttError?.(err);
      return;
    }
    recorderRef.current = recorder;
    chunksRef.current = [];

    // LOCK 2: single active recorder guard.
    isRecordingRef.current = true;
    speechStartTsRef.current = performance.now();
    lastSpeechTsRef.current = performance.now();
    cancelledRef.current = false;
    clearStallTimer();
    setHint(null);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onerror = (e) => {
      isRecordingRef.current = false;
      try { onSttError?.((e as unknown as { error?: unknown }).error); } catch { /* ignore */ }
    };
    recorder.onstop = () => {
      const blobs = chunksRef.current;
      chunksRef.current = [];
      isRecordingRef.current = false;

      if (cancelledRef.current || blobs.length === 0) {
        // Return to listening if engine still active.
        if (enabledRef.current) {
          setUi("listening");
          listeningSinceRef.current = performance.now();
          armStallTimer();
        }
        return;
      }

      const blob = new Blob(blobs, { type: mime || "audio/webm" });
      void submitTranscript(blob);
    };

    try {
      recorder.start();
    } catch (err) {
      isRecordingRef.current = false;
      onSttError?.(err);
      return;
    }
    setUi("listening"); // recorder armed — UI still 'listening' (orb shows level)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureMic, armStallTimer, clearStallTimer, onSttError, setUi]);

  const stopRecording = useCallback(async (_reason: "silence" | "max" | "manual" | "cancel") => {
    const rec = recorderRef.current;
    if (!rec || !isRecordingRef.current) return;
    if (_reason === "cancel") cancelledRef.current = true;
    try { rec.stop(); } catch { /* ignore */ }
  }, []);

  // ---- STT submission ---------------------------------------------------

  const submitTranscript = useCallback(async (blob: Blob) => {
    setUi("thinking");
    clearWatchdog();

    // LOCK 5: 30 s watchdog.
    let timedOut = false;
    watchdogTimerRef.current = window.setTimeout(() => {
      timedOut = true;
      clearWatchdog();
      if (!enabledRef.current) return;
      setUi("listening");
      listeningSinceRef.current = performance.now();
      armStallTimer();
    }, STT_WATCHDOG_MS) as unknown as number;

    try {
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("ada-transcribe-audio", {
        body: { audio_base64: base64, mime: blob.type || "audio/webm" },
      });
      if (timedOut) return;
      clearWatchdog();

      if (error || !data) {
        onSttError?.(error ?? new Error("STT failed"));
        if (enabledRef.current) {
          setUi("listening");
          listeningSinceRef.current = performance.now();
          armStallTimer();
        }
        return;
      }

      const raw =
        (data as { text?: string; transcript?: string }).text ||
        (data as { transcript?: string }).transcript ||
        "";
      const sttLang =
        (data as { language?: string | null }).language ?? null;

      const text = (raw || "").trim();

      // LOCK 3: transcript debounce.
      if (text.length < 2) {
        if (enabledRef.current) {
          setUi("listening");
          listeningSinceRef.current = performance.now();
          armStallTimer();
        }
        return;
      }
      const now = performance.now();
      const last = lastTranscriptRef.current;
      if (
        last &&
        last.text.toLowerCase() === text.toLowerCase() &&
        now - last.ts < DEDUP_WINDOW_MS
      ) {
        if (enabledRef.current) {
          setUi("listening");
          listeningSinceRef.current = performance.now();
          armStallTimer();
        }
        return;
      }
      lastTranscriptRef.current = { text, ts: now };
      stallCountRef.current = 0; // successful turn resets stall counter

      try { onTranscript(text, sttLang); } catch { /* consumer error swallowed */ }
    } catch (err) {
      if (timedOut) return;
      clearWatchdog();
      onSttError?.(err);
      if (enabledRef.current) {
        setUi("listening");
        listeningSinceRef.current = performance.now();
        armStallTimer();
      }
    }
  }, [armStallTimer, clearWatchdog, onSttError, onTranscript, setUi]);

  // ---- TTS speaking-state sync -----------------------------------------

  useEffect(() => {
    const off = onSpeakingChange((sp) => {
      ttsSpeakingRef.current = sp;
      if (sp) {
        // ADA started speaking — ensure UI reflects it and stop sampling-as-listening.
        setUi("speaking");
        clearStallTimer();
      } else {
        // ADA finished — unlock lazy mic and switch to listening.
        if (!enabledRef.current) return;
        // First-speech-ended unlock.
        void (async () => {
          await ensureMic();
          if (!enabledRef.current) return;
          if (isRecordingRef.current) return;
          setUi("listening");
          listeningSinceRef.current = performance.now();
          startSampling();
          armStallTimer();
        })();
      }
    });
    return off;
  }, [armStallTimer, clearStallTimer, ensureMic, setUi, startSampling]);

  // ---- public API -------------------------------------------------------

  const notifyFirstSpeechEnded = useCallback(() => {
    // Same path as TTS speaking->false transition; safe to call multiple times.
    if (!enabledRef.current) return;
    void (async () => {
      await ensureMic();
      if (!enabledRef.current) return;
      if (uiStateRef.current === "speaking" || uiStateRef.current === "thinking") return;
      if (isRecordingRef.current) return;
      setUi("listening");
      listeningSinceRef.current = performance.now();
      startSampling();
      armStallTimer();
    })();
  }, [armStallTimer, ensureMic, setUi, startSampling]);

  const notifyUserGesture = useCallback(() => {
    // First user tap satisfies iOS gesture requirement; warm up mic.
    if (micUnlockedRef.current) return;
    void ensureMic();
  }, [ensureMic]);

  /**
   * Manual mic toggle.
   *  - speaking → interrupt TTS, switch to listening
   *  - idle → start listening (and recording if energy already present)
   *  - listening + not recording → force-start recording
   *  - listening + recording → stop & submit
   */
  const toggle = useCallback(() => {
    if (!enabledRef.current) return;
    setHint(null);

    const ui = uiStateRef.current;
    if (ui === "speaking" || ttsIsSpeaking()) {
      voiceInterrupt();
      setUi("listening");
      listeningSinceRef.current = performance.now();
      void (async () => {
        await ensureMic();
        startSampling();
        armStallTimer();
      })();
      return;
    }

    if (ui === "thinking") {
      // Ignore taps while STT is in flight.
      return;
    }

    if (isRecordingRef.current) {
      void stopRecording("manual");
      return;
    }

    // idle / listening with no recording → force start.
    void (async () => {
      const ok = await ensureMic();
      if (!ok) return;
      setUi("listening");
      listeningSinceRef.current = performance.now();
      startSampling();
      await startRecording("manual");
    })();
  }, [armStallTimer, ensureMic, setUi, startRecording, startSampling, stopRecording]);

  const stop = useCallback(() => {
    clearStallTimer();
    clearWatchdog();
    if (isRecordingRef.current) {
      cancelledRef.current = true;
      try { recorderRef.current?.stop(); } catch { /* ignore */ }
    }
    stopSampling();
    voiceInterrupt();
    setUi("idle");
    setHint(null);
  }, [clearStallTimer, clearWatchdog, setUi, stopSampling]);

  // ---- cleanup on unmount ----------------------------------------------

  useEffect(() => {
    return () => {
      enabledRef.current = false;
      clearStallTimer();
      clearWatchdog();
      try {
        if (isRecordingRef.current) {
          cancelledRef.current = true;
          recorderRef.current?.stop();
        }
      } catch { /* ignore */ }
      isRecordingRef.current = false;

      if (sampleTimerRef.current != null) {
        window.clearInterval(sampleTimerRef.current);
        sampleTimerRef.current = null;
      }

      try { sourceRef.current?.disconnect(); } catch { /* ignore */ }
      try { analyserRef.current?.disconnect(); } catch { /* ignore */ }
      try { void audioCtxRef.current?.close(); } catch { /* ignore */ }
      sourceRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current = null;

      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      streamRef.current = null;

      try { voiceInterrupt(); } catch { /* ignore */ }
    };
  }, [clearStallTimer, clearWatchdog]);

  // ---- pause when disabled ---------------------------------------------

  useEffect(() => {
    if (enabled) return;
    clearStallTimer();
    clearWatchdog();
    if (isRecordingRef.current) {
      cancelledRef.current = true;
      try { recorderRef.current?.stop(); } catch { /* ignore */ }
    }
    stopSampling();
  }, [enabled, clearStallTimer, clearWatchdog, stopSampling]);

  return {
    uiState,
    level,
    hint,
    toggle,
    stop,
    notifyFirstSpeechEnded,
    notifyUserGesture,
  };
}
