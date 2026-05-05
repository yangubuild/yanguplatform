/**
 * useRealtimeVoice — OpenAI Realtime voice session over WebRTC.
 *
 * Browser clients cannot open the raw Realtime WebSocket (no custom headers
 * allowed), so we use the official WebRTC pattern:
 *   1. Backend mints an ephemeral session token (`realtime-token` edge fn).
 *   2. Client creates RTCPeerConnection, attaches mic, and a data channel.
 *   3. Client POSTs its SDP offer to https://api.openai.com/v1/realtime
 *      with `Authorization: Bearer <ephemeral>` and gets the answer.
 *   4. Audio flows full-duplex; events flow over the data channel.
 *
 * Single source of truth for voice. No speechSynthesis, no STT polling.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeUiState = "idle" | "connecting" | "listening" | "speaking" | "thinking" | "error";
export type RealtimeRole = "assistant" | "user";

export type MicPickerDevice = { deviceId: string; label: string };

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: { length: number; [index: number]: BrowserSpeechRecognitionResult };
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface UseRealtimeVoiceOptions {
  language?: string;
  /** Fired for each finalized turn (user transcript or assistant text). */
  onMessage?: (text: string, role: RealtimeRole) => void;
  /** Fired once the session is connected and ADA is about to greet. */
  onConnected?: () => void;
  /** Fired on fatal error. */
  onError?: (err: Error) => void;
  /** Pause/resume the whole session. */
  enabled?: boolean;
}

// GA Realtime API: SDP exchange goes to /v1/realtime/calls (not /v1/realtime)
const REALTIME_CALLS = "https://api.openai.com/v1/realtime/calls";
const SPEECH_RECOGNITION_LANG: Record<string, string> = {
  en: "en-US",
  sw: "sw-KE",
  fr: "fr-FR",
  ar: "ar-SA",
  lg: "en-UG",
  rw: "en-RW",
};

const getBrowserSpeechRecognition = (): BrowserSpeechRecognitionConstructor | null => {
  const speechWindow = window as unknown as {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
};

// Module-level guard: defeats React StrictMode double-mount which otherwise
// mints two ephemeral tokens and creates two RTCPeerConnections in parallel.
let activeStartId = 0;
let hasActiveSession = false;
let prewarmedMicStreamPromise: Promise<MediaStream> | null = null;
let sharedMicStream: MediaStream | null = null;
let sharedMicReleaseTimer: number | null = null;

const isLiveMicStream = (stream: MediaStream | null) =>
  !!stream && stream.getAudioTracks().some((track) => track.readyState === "live");

const cancelSharedMicRelease = () => {
  if (sharedMicReleaseTimer != null) {
    window.clearTimeout(sharedMicReleaseTimer);
    sharedMicReleaseTimer = null;
  }
};

const releaseSharedMicStream = (immediate = false) => {
  cancelSharedMicRelease();
  const stop = () => {
    try { sharedMicStream?.getTracks().forEach((track) => track.stop()); } catch { /* ignore */ }
    sharedMicStream = null;
    prewarmedMicStreamPromise = null;
  };
  if (immediate) {
    stop();
  } else {
    sharedMicReleaseTimer = window.setTimeout(stop, 3000);
  }
};

const createRealtimeMicStream = async () => {
  cancelSharedMicRelease();
  if (isLiveMicStream(sharedMicStream)) return sharedMicStream!;
  console.log("[useRealtimeVoice] requesting raw getUserMedia debug capture…");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  sharedMicStream = stream;
  const track = stream.getAudioTracks()[0];
  console.log("MIC TRACK:", {
    label: track?.label,
    enabled: track?.enabled,
    muted: track?.muted,
    readyState: track?.readyState,
  });

  return stream;
};

/**
 * Poll an AnalyserNode for ~3s. Returns true if any frequency byte > 5
 * (i.e. the mic is producing real acoustic energy, not pure silence).
 */
const probeMicEnergy = async (stream: MediaStream): Promise<boolean> => {
  const Ctx: typeof AudioContext | undefined =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return true; // can't probe → assume ok
  const ac = new Ctx();
  try {
    if (ac.state === "suspended") await ac.resume().catch(() => {});
    const analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    ac.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let gotSignal = false;
    let peak = 0;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      analyser.getByteFrequencyData(buf);
      for (let j = 0; j < buf.length; j++) {
        if (buf[j] > peak) peak = buf[j];
        if (buf[j] > 5) { gotSignal = true; break; }
      }
      if (gotSignal) break;
    }
    console.log("[useRealtimeVoice] mic energy probe", { gotSignal, peak });
    return gotSignal;
  } finally {
    try { await ac.close(); } catch { /* ignore */ }
  }
};

export const prewarmRealtimeMicStream = () => {
  cancelSharedMicRelease();
  if (isLiveMicStream(sharedMicStream)) return Promise.resolve(sharedMicStream!);
  if (!prewarmedMicStreamPromise) {
    prewarmedMicStreamPromise = createRealtimeMicStream().catch((err) => {
      prewarmedMicStreamPromise = null;
      throw err;
    });
  }
  return prewarmedMicStreamPromise;
};

const takeRealtimeMicStream = async () => {
  cancelSharedMicRelease();
  if (isLiveMicStream(sharedMicStream)) return sharedMicStream!;
  const pendingStream = prewarmedMicStreamPromise;
  const stream = pendingStream ? await pendingStream : await createRealtimeMicStream();
  sharedMicStream = stream;
  return stream;
};

export function useRealtimeVoice({
  language = "en",
  onMessage,
  onConnected,
  onError,
  enabled = true,
}: UseRealtimeVoiceOptions) {
  const [uiState, setUiState] = useState<RealtimeUiState>("idle");
  const [level, setLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micVolumeTimerRef = useRef<number | null>(null);
  const outboundStatsTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechRecognitionRestartTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const startingRef = useRef(false);
  const greetedRef = useRef(false);
  const isResponseInProgressRef = useRef(false);
  const queuedInstructionRef = useRef<string | null>(null);

  // Mic device picker state — surfaced when energy probe finds zero signal.
  const [needsMicPicker, setNeedsMicPicker] = useState(false);
  const [micDevices, setMicDevices] = useState<MicPickerDevice[]>([]);
  const pendingMicResolveRef = useRef<((id: string | null) => void) | null>(null);

  // Per-turn buffers
  const assistantTextBufRef = useRef<string>("");
  const userTranscriptBufRef = useRef<string>("");

  const cleanup = useCallback(() => {
    activeStartId += 1;
    greetedRef.current = false;
    startingRef.current = false;
    hasActiveSession = false;
    if (pendingMicResolveRef.current) {
      try { pendingMicResolveRef.current(null); } catch { /* ignore */ }
      pendingMicResolveRef.current = null;
    }
    if (startTimerRef.current != null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try { dcRef.current?.close(); } catch { /* ignore */ }
    try { pcRef.current?.close(); } catch { /* ignore */ }
    releaseSharedMicStream();
    if (micVolumeTimerRef.current != null) {
      window.clearInterval(micVolumeTimerRef.current);
      micVolumeTimerRef.current = null;
    }
    if (outboundStatsTimerRef.current != null) {
      window.clearInterval(outboundStatsTimerRef.current);
      outboundStatsTimerRef.current = null;
    }
    if (speechRecognitionRestartTimerRef.current != null) {
      window.clearTimeout(speechRecognitionRestartTimerRef.current);
      speechRecognitionRestartTimerRef.current = null;
    }
    try { speechRecognitionRef.current?.abort(); } catch { /* ignore */ }
    speechRecognitionRef.current = null;
    try { micAudioCtxRef.current?.close(); } catch { /* ignore */ }
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    if (audioElRef.current) {
      try { audioElRef.current.pause(); } catch { /* ignore */ }
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    dcRef.current = null;
    pcRef.current = null;
    micStreamRef.current = null;
    micSourceRef.current = null;
    micAudioCtxRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanup();
    if (mountedRef.current) {
      setUiState("idle");
      setLevel(0);
    }
  }, [cleanup]);

  const start = useCallback(async () => {
    if (pcRef.current || startingRef.current || hasActiveSession) {
      console.warn("[useRealtimeVoice] start skipped — session already active", {
        hasPc: !!pcRef.current,
        starting: startingRef.current,
        hasActiveSession,
      });
      return;
    }
    startingRef.current = true;
    hasActiveSession = true;
    const myStartId = ++activeStartId;
    const isStale = () => myStartId !== activeStartId;
    setUiState("connecting");
    try {
      // 1. Use the stream opened by the original Speak-to-Build click.
      const micStream = await takeRealtimeMicStream();
      if (isStale() || !mountedRef.current) {
        startingRef.current = false;
        hasActiveSession = false;
        return;
      }
      micStreamRef.current = micStream;
      console.log("MIC STREAM:", micStream);
      console.log("AUDIO TRACKS:", micStream.getAudioTracks());
      micStream.getAudioTracks().forEach((track) => {
        if (!track.enabled) track.enabled = true;
        console.log("TRACK:", {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
        // CRITICAL: detect when OS/browser mutes the track. This is why
        // VAD never fires even though the stream looks "live".
        track.addEventListener("mute", () => {
          console.error("🔇 MIC TRACK MUTED by OS/browser — no audio will reach OpenAI");
        });
        track.addEventListener("unmute", () => {
          console.log("🔊 MIC TRACK UNMUTED — audio flowing");
        });
      });

      // If the track came in already muted, abort with a clear error so the
      // user knows the mic isn't actually capturing.
      const firstTrack = micStream.getAudioTracks()[0];
      if (!firstTrack) {
        throw new Error("No audio track on mic stream");
      }

      // Diagnostic: enumerate audio input devices so we can see what the
      // browser actually has access to.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        console.log("AUDIO INPUT DEVICES:", mics.map((d) => ({
          label: d.label || "(label hidden — permission needed)",
          deviceId: d.deviceId.slice(0, 12) + "…",
        })));
      } catch (err) {
        console.warn("[useRealtimeVoice] enumerateDevices failed", err);
      }
      try {
        const status = await navigator.permissions?.query?.(
          { name: "microphone" as PermissionName },
        );
        if (status) console.log("MIC PERMISSION STATE:", status.state);
      } catch { /* ignore */ }

      // Energy probe: ensure the mic is actually producing signal. If not,
      // surface a device picker so the user can choose a different input.
      let activeMicStream: MediaStream = micStream;
      const initialEnergy = await probeMicEnergy(activeMicStream);
      if (isStale() || !mountedRef.current) {
        startingRef.current = false;
        hasActiveSession = false;
        return;
      }
      if (!initialEnergy) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const mics: MicPickerDevice[] = devices
            .filter((d) => d.kind === "audioinput")
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${idx + 1}`,
            }));
          if (mics.length > 1) {
            const chosenId = await new Promise<string | null>((resolve) => {
              pendingMicResolveRef.current = resolve;
              if (mountedRef.current) {
                setMicDevices(mics);
                setNeedsMicPicker(true);
              }
            });
            if (mountedRef.current) {
              setNeedsMicPicker(false);
            }
            if (isStale() || !mountedRef.current) {
              startingRef.current = false;
              hasActiveSession = false;
              return;
            }
            if (chosenId) {
              try {
                // Drop the silent stream and re-acquire from the chosen device.
                releaseSharedMicStream(true);
                const replacement = await navigator.mediaDevices.getUserMedia({
                  audio: { deviceId: { exact: chosenId } },
                  video: false,
                });
                sharedMicStream = replacement;
                activeMicStream = replacement;
                micStreamRef.current = replacement;
                const newTrack = replacement.getAudioTracks()[0];
                console.log("[useRealtimeVoice] picker chose mic", {
                  label: newTrack?.label,
                  deviceId: chosenId.slice(0, 12) + "…",
                });
                const recheck = await probeMicEnergy(replacement);
                console.log("[useRealtimeVoice] picker re-verify energy:", recheck);
              } catch (err) {
                console.warn("[useRealtimeVoice] picker getUserMedia failed", err);
              }
            }
          } else {
            console.warn("[useRealtimeVoice] silent mic but no alternate audioinput devices to pick");
          }
        } catch (err) {
          console.warn("[useRealtimeVoice] mic picker enumeration failed", err);
        }
      }

      // Audio energy detection — verify mic is actually producing signal.
      try {
        const AudioCtx =
          (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
            .AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) throw new Error("AudioContext is not supported");
        const audioContext = new AudioCtx({ latencyHint: "interactive" } as AudioContextOptions);
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(micStream);
        micAudioCtxRef.current = audioContext;
        micSourceRef.current = source;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        let zeroVolumeTicks = 0;
        if (micVolumeTimerRef.current != null) {
          window.clearInterval(micVolumeTimerRef.current);
        }
        micVolumeTimerRef.current = window.setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const centered = Math.abs(data[i] - 128);
            if (centered > 2) sum += centered;
          }
          console.log("MIC VOLUME:", sum);
          zeroVolumeTicks = sum > 0 ? 0 : zeroVolumeTicks + 1;
          if (zeroVolumeTicks === 8) {
            console.warn("[useRealtimeVoice] mic input still reads silent", {
              track: micStream.getAudioTracks()[0]?.getSettings?.(),
              muted: micStream.getAudioTracks()[0]?.muted,
              readyState: micStream.getAudioTracks()[0]?.readyState,
            });
          }
        }, 500);
        micStream.getAudioTracks()[0]?.addEventListener("ended", () => {
          if (micVolumeTimerRef.current != null) {
            window.clearInterval(micVolumeTimerRef.current);
            micVolumeTimerRef.current = null;
          }
          audioContext.close().catch(() => {});
        });
      } catch (err) {
        console.warn("[useRealtimeVoice] mic volume analyser failed", err);
      }

      // 2. Mint ephemeral token
      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("realtime-token", {
        body: { language, voice: "marin" },
      });
      if (isStale()) {
        console.log("[useRealtimeVoice] stale after token, abort");
        startingRef.current = false;
        hasActiveSession = false;
        return;
      }
      if (tokenErr) throw new Error(tokenErr.message || "Failed to mint realtime token");
      const ephemeral: string | undefined = tokenData?.client_secret;
      const model: string = tokenData?.model || "gpt-realtime";
      if (!ephemeral) throw new Error("No client_secret returned");
      const expiresAt: number | undefined = tokenData?.expires_at;
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt < nowSec) {
        throw new Error(`Ephemeral token already expired (exp=${expiresAt}, now=${nowSec})`);
      }
      console.log("TOKEN OK", { model, expiresAt, ttl: expiresAt ? expiresAt - nowSec : "n/a" });

      // 2. Peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      console.log("[useRealtimeVoice] RTCPeerConnection created with STUN");

      const SpeechRecognitionCtor = getBrowserSpeechRecognition();
      if (SpeechRecognitionCtor) {
        try {
          if (speechRecognitionRestartTimerRef.current != null) {
            window.clearTimeout(speechRecognitionRestartTimerRef.current);
            speechRecognitionRestartTimerRef.current = null;
          }
          try { speechRecognitionRef.current?.abort(); } catch { /* ignore */ }
          const recognition = new SpeechRecognitionCtor();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.lang = SPEECH_RECOGNITION_LANG[language] ?? SPEECH_RECOGNITION_LANG.en;
          recognition.onresult = (event) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
              const result = event.results[i];
              if (result?.isFinal) finalTranscript += result[0]?.transcript || "";
            }
            const transcript = finalTranscript.trim();
            if (transcript) {
              console.log("USER SAID:", transcript);
              onMessage?.(transcript, "user");
              if (mountedRef.current) setUiState("thinking");
            }
          };
          recognition.onerror = (event) => {
            console.warn("[useRealtimeVoice] browser speech recognition error", event.error);
          };
          recognition.onend = () => {
            if (!mountedRef.current || pcRef.current !== pc) return;
            speechRecognitionRestartTimerRef.current = window.setTimeout(() => {
              try { recognition.start(); } catch { /* already started or unavailable */ }
            }, 350);
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
          console.log("[useRealtimeVoice] browser speech recognition fallback started");
        } catch (err) {
          console.warn("[useRealtimeVoice] browser speech recognition fallback failed", err);
        }
      }

      pc.addEventListener("connectionstatechange", () => {
        console.log("PC state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          console.log("RTC CONNECTED");
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          if (mountedRef.current && pc === pcRef.current) {
            setUiState("error");
          }
        }
      });
      pc.addEventListener("iceconnectionstatechange", () => {
        console.log("ICE state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          console.log("ICE CONNECTED");
        }
      });

      // 3. Remote audio sink
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.setAttribute("playsinline", "true");
      audioEl.style.display = "none";
      // Some browsers (Safari/iOS, occasionally Chrome on certain pages)
      // refuse to play media from detached <audio> elements. Attach to DOM.
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        console.log("TRACK RECEIVED", e);
        const [stream] = e.streams;
        if (audioElRef.current) {
          audioElRef.current.srcObject = stream;
          audioElRef.current.onplay = () => {
            console.log("AUDIO PLAYING");
            if (mountedRef.current) setAudioBlocked(false);
          };
          audioElRef.current.onerror = (err) => {
            console.error("[useRealtimeVoice] audio element error", err);
          };
          // Try to play immediately. If browser blocks autoplay we surface
          // the `audioBlocked` flag so the UI can render a single Start CTA.
          const p = audioElRef.current.play();
          if (p && typeof p.then === "function") {
            p.then(() => {
              if (mountedRef.current) setAudioBlocked(false);
            }).catch((err) => {
              console.warn("[useRealtimeVoice] autoplay blocked", err);
              if (mountedRef.current) setAudioBlocked(true);
            });
          }
        }

        // Attach analyser to remote stream for "speaking" level
        try {
          const Ctx: typeof AudioContext | undefined =
            (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
              .AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!Ctx) return;
          const ctx = audioCtxRef.current ?? new Ctx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          analyserRef.current = analyser;
          const buf = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / buf.length);
            if (mountedRef.current) setLevel(Math.min(1, rms * 3));
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } catch (err) {
          console.warn("[useRealtimeVoice] analyser setup failed", err);
        }
      };

      // 4. Attach the already-acquired mic BEFORE createOffer so the SDP
      // advertises a sendrecv audio m-section.
      const micTracks = activeMicStream.getAudioTracks();
      console.log("Mic tracks acquired:", micTracks.length);
      micTracks.forEach((t, i) => {
        console.log(`Mic track[${i}]`, {
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        });
        // Force-enable defensively.
        if (!t.enabled) t.enabled = true;
        if (!t.enabled || t.readyState !== "live") {
          throw new Error(`Mic track is not active before createOffer (enabled=${t.enabled}, readyState=${t.readyState})`);
        }
      });
      console.log("ADDING TRACK BEFORE OFFER");
      micTracks.forEach((track) => {
        const sender = pc.addTrack(track, activeMicStream);
        console.log("addTrack sender:", {
          kind: sender.track?.kind,
          enabled: sender.track?.enabled,
          muted: sender.track?.muted,
          readyState: sender.track?.readyState,
        });
      });
      console.log("SENDERS AFTER ADD:", pc.getSenders());
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          console.log("SENDER TRACK:", sender.track.kind, sender.track.readyState);
        }
      });
      console.log("TRANSCEIVERS AFTER ADDTRACK:", pc.getTransceivers().map((t) => ({
        mid: t.mid,
        direction: t.direction,
        currentDirection: t.currentDirection,
        senderKind: t.sender.track?.kind,
        senderState: t.sender.track?.readyState,
        receiverKind: t.receiver.track?.kind,
      })));
      const audioSenders = pc.getSenders().filter((s) => s.track?.kind === "audio");
      console.log("PC audio senders after addTrack:", audioSenders.length);
      if (audioSenders.length === 0) {
        throw new Error("No audio sender on RTCPeerConnection — mic not attached");
      }

      // 5. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("DATA CHANNEL OPEN");
        // Configure GA session turn detection before creating the greeting.
        try {
          dc.send(JSON.stringify({
            type: "session.update",
            session: {
              type: "realtime",
              // FIX: Lock language to English. Prevents ADA from drifting into
              // other languages mid-conversation due to background noise.
              language: "en",
              audio: {
                input: {
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.6,
                    prefix_padding_ms: 500,
                    silence_duration_ms: 1200,
                    create_response: true,
                    interrupt_response: true,
                  },
                  transcription: { model: "whisper-1", language: "en" },
                },
              },
            },
          }));
          console.log("[useRealtimeVoice] session.update sent (GA VAD)");
        } catch (err) {
          console.warn("[useRealtimeVoice] session.update failed", err);
        }
        // Kick off the conversation: ask ADA to greet immediately.
        if (!greetedRef.current) {
          greetedRef.current = true;
          try {
            if (isResponseInProgressRef.current) {
              queuedInstructionRef.current =
                "Hey I'm ADA AI. Tell me about your business — what's the name, what do you do, and what are you looking to build?";
              console.log("[useRealtimeVoice] greet queued — response in progress");
            } else {
              isResponseInProgressRef.current = true;
              dc.send(JSON.stringify({
                type: "response.create",
                response: {
                  instructions:
                    "Hey I'm ADA AI. Tell me about your business — what's the name, what do you do, and what are you looking to build?",
                },
              }));
              console.log("[useRealtimeVoice] greet response.create sent");
            }
          } catch (err) {
            console.warn("[useRealtimeVoice] greet send failed", err);
          }
        }
        if (mountedRef.current) setUiState("listening");
        onConnected?.();
      });

      dc.addEventListener("message", (e: MessageEvent) => {
        let msg: { type: string; [k: string]: unknown };
        try { msg = JSON.parse(e.data); } catch { return; }
        console.log("Realtime event:", msg.type);

        switch (msg.type) {
          case "session.created":
          case "session.updated":
            if (mountedRef.current) {
              setUiState((prev) => (prev === "connecting" ? "listening" : prev));
            }
            break;
          case "response.created":
            isResponseInProgressRef.current = true;
            // Any of these prove the session is alive — leave "connecting".
            if (mountedRef.current) {
              setUiState((prev) => (prev === "connecting" ? "listening" : prev));
            }
            break;
          case "input_audio_buffer.speech_started":
            console.log("USER SPEECH STARTED");
            if (mountedRef.current) setUiState("listening");
            break;
          case "input_audio_buffer.speech_stopped":
            console.log("USER SPEECH STOPPED");
            if (mountedRef.current) setUiState("thinking");
            break;
          case "output_audio_buffer.started":
            console.log("ADA SPEAKING (output_audio_buffer.started)");
            if (mountedRef.current) setUiState("speaking");
            break;
          case "output_audio_buffer.stopped":
            if (mountedRef.current) setUiState("listening");
            break;
          case "response.audio.delta":
          case "response.output_audio.delta":
            console.log("ADA RESPONSE RECEIVED (audio delta)");
            if (mountedRef.current) setUiState("speaking");
            break;
          case "response.audio.done":
          case "response.output_audio.done":
            if (mountedRef.current) setUiState("listening");
            break;
          case "response.completed":
            if (mountedRef.current) setUiState("listening");
            break;
          case "response.audio_transcript.delta":
          case "response.output_text.delta": {
            // First event we usually see — also use it to escape "connecting".
            if (mountedRef.current) {
              setUiState((prev) => (prev === "connecting" ? "speaking" : prev));
            }
            const delta = (msg.delta as string) || "";
            assistantTextBufRef.current += delta;
            break;
          }
          case "response.audio_transcript.done":
          case "response.output_text.done":
          case "response.done": {
            const full = assistantTextBufRef.current.trim();
            assistantTextBufRef.current = "";
            if (full) onMessage?.(full, "assistant");
            if (msg.type === "response.done") {
              isResponseInProgressRef.current = false;
              const queued = queuedInstructionRef.current;
              queuedInstructionRef.current = null;
              if (queued && dcRef.current?.readyState === "open") {
                try {
                  isResponseInProgressRef.current = true;
                  dcRef.current.send(JSON.stringify({
                    type: "response.create",
                    response: { instructions: queued },
                  }));
                  console.log("[useRealtimeVoice] queued response.create flushed");
                } catch (err) {
                  isResponseInProgressRef.current = false;
                  console.warn("[useRealtimeVoice] flush queued failed", err);
                }
              }
            }
            break;
          }
          case "conversation.item.input_audio_transcription.delta": {
            const delta = (msg.delta as string) || "";
            userTranscriptBufRef.current += delta;
            break;
          }
          case "conversation.item.input_audio_transcription.completed": {
            const buffered = userTranscriptBufRef.current.trim();
            userTranscriptBufRef.current = "";
            const transcript =
              (msg.transcript as string | undefined)?.trim() || buffered;
            console.log("USER SAID:", transcript);
            if (transcript) onMessage?.(transcript, "user");
            break;
          }
          case "error": {
            console.error("[useRealtimeVoice] server error", msg);
            const err = (msg.error as { message?: string } | undefined)?.message || "Realtime error";
            onError?.(new Error(err));
            break;
          }
          default:
            break;
        }
      });

      dc.addEventListener("close", (ev: Event) => {
        const ce = ev as CloseEvent;
        console.error("[useRealtimeVoice] DATA CHANNEL CLOSED", {
          code: (ce as unknown as { code?: number }).code,
          reason: (ce as unknown as { reason?: string }).reason,
          wasClean: (ce as unknown as { wasClean?: boolean }).wasClean,
          pcConnectionState: pc.connectionState,
          pcIceConnectionState: pc.iceConnectionState,
        });
      });
      dc.addEventListener("error", (ev) => {
        console.error("[useRealtimeVoice] DATA CHANNEL ERROR", ev, {
          pcConnectionState: pc.connectionState,
          pcIceConnectionState: pc.iceConnectionState,
        });
      });

      // 6. SDP exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("SDP SENT", { len: offer.sdp?.length, model });
      if (!offer.sdp?.includes("m=audio") || !offer.sdp?.includes("a=sendrecv")) {
        throw new Error("SDP offer does not advertise sendrecv audio");
      }

      const sdpHeaders = {
        Authorization: `Bearer ${ephemeral}`,
        "Content-Type": "application/sdp",
      };
      console.log("HEADERS", {
        Authorization: "Bearer ek_…",
        "Content-Type": sdpHeaders["Content-Type"],
      });

      const sdpResp = await fetch(`${REALTIME_CALLS}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: sdpHeaders,
        body: offer.sdp,
      });

      if (!sdpResp.ok) {
        const text = await sdpResp.text();
        console.error("SDP exchange failed", sdpResp.status, text);
        throw new Error(`Realtime SDP exchange failed (${sdpResp.status}): ${text}`);
      }

      const answerSdp = await sdpResp.text();
      if (isStale()) {
        console.log("[useRealtimeVoice] stale after SDP answer, abort");
        startingRef.current = false;
        hasActiveSession = false;
        return;
      }
      if (!answerSdp.startsWith("v=")) {
        console.error("Invalid SDP answer (does not start with 'v='):", answerSdp.slice(0, 200));
        throw new Error("Invalid SDP answer from Realtime API");
      }
      console.log("SDP ANSWER RECEIVED", { len: answerSdp.length });
      const answer: RTCSessionDescriptionInit = { type: "answer", sdp: answerSdp };
      await pc.setRemoteDescription(answer);

      console.log("[useRealtimeVoice] connected");
      if (outboundStatsTimerRef.current != null) {
        window.clearInterval(outboundStatsTimerRef.current);
      }
      outboundStatsTimerRef.current = window.setInterval(async () => {
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === "outbound-rtp" && (report as RTCOutboundRtpStreamStats).kind === "audio") {
              console.log("AUDIO BYTES SENT:", (report as RTCOutboundRtpStreamStats).bytesSent);
            }
          });
        } catch (err) {
          console.warn("[useRealtimeVoice] outbound audio stats failed", err);
        }
      }, 1000);
      startingRef.current = false;

      // Watchdog: if 8s after start we are still "connecting", surface error.
      window.setTimeout(() => {
        if (isStale()) return;
        if (mountedRef.current && pcRef.current === pc) {
          // We can read uiState via setter trick — only fire onError if still connecting.
          setUiState((prev) => {
            if (prev === "connecting") {
              console.error("[useRealtimeVoice] watchdog: still connecting after 8s");
              onError?.(new Error("Voice session did not start. Please refresh and try again."));
              return "error";
            }
            return prev;
          });
        }
      }, 8000);
    } catch (err) {
      console.error("[useRealtimeVoice] start failed", err);
      cleanup();
      if (mountedRef.current) setUiState("error");
      onError?.(err instanceof Error ? err : new Error(String(err)));
      startingRef.current = false;
      hasActiveSession = false;
    }
  }, [language, onConnected, onMessage, onError, cleanup]);

  // Lifecycle
  useEffect(() => {
    mountedRef.current = true;
    // Defensively clear any stale module-level guard left by a previous
    // mount/HMR cycle, otherwise start() will be skipped forever.
    hasActiveSession = false;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  /** Called from a user gesture to start/retry audio. */
  const unlockAudio = useCallback(async () => {
    try {
      if (!pcRef.current && !startingRef.current) {
        await start();
        return;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      if (audioElRef.current) {
        await audioElRef.current.play();
      }
      if (mountedRef.current) setAudioBlocked(false);
    } catch (err) {
      console.warn("[useRealtimeVoice] unlockAudio failed", err);
    }
  }, [start]);

  /**
   * Trigger ADA's next spoken turn with custom instructions.
   * Used by the step machine to keep the conversation loop going.
   * Safe to call repeatedly; no-ops if data channel is not open.
   */
  const sendInstruction = useCallback((instructions: string) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      console.warn("[useRealtimeVoice] sendInstruction skipped — dc not open", dc?.readyState);
      return;
    }
    if (isResponseInProgressRef.current) {
      queuedInstructionRef.current = instructions;
      console.log("[useRealtimeVoice] sendInstruction queued — response in progress");
      return;
    }
    try {
      isResponseInProgressRef.current = true;
      dc.send(JSON.stringify({
        type: "response.create",
        response: { instructions },
      }));
      console.log("[useRealtimeVoice] response.create sent ←", instructions.slice(0, 80));
    } catch (err) {
      isResponseInProgressRef.current = false;
      console.warn("[useRealtimeVoice] sendInstruction failed", err);
    }
  }, []);

  /**
   * Send a raw event over the data channel (e.g. input_audio_buffer.clear).
   * No-op if the data channel is not open.
   */
  const sendRaw = useCallback((event: Record<string, unknown>) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    try {
      dc.send(JSON.stringify(event));
    } catch (err) {
      console.warn("[useRealtimeVoice] sendRaw failed", err);
    }
  }, []);

  // Start from the prewarmed stream captured by the original Speak-to-Build click.
  useEffect(() => {
    if (!enabled) {
      stop();
    } else if (!pcRef.current && !startingRef.current) {
      startTimerRef.current = window.setTimeout(() => {
        startTimerRef.current = null;
        void start();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const selectMicDevice = useCallback((deviceId: string | null) => {
    const resolve = pendingMicResolveRef.current;
    pendingMicResolveRef.current = null;
    if (mountedRef.current) setNeedsMicPicker(false);
    if (resolve) resolve(deviceId);
  }, []);

  // Stable return shape: same keys every render, regardless of state.
  return useMemo(
    () => ({
      uiState,
      level,
      start,
      stop,
      audioBlocked,
      unlockAudio,
      sendInstruction,
      sendRaw,
      needsMicPicker,
      micDevices,
      selectMicDevice,
    }),
    [
      uiState, level, start, stop, audioBlocked, unlockAudio, sendInstruction, sendRaw,
      needsMicPicker, micDevices, selectMicDevice,
    ],
  );
}