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

// Module-level guard: defeats React StrictMode double-mount which otherwise
// mints two ephemeral tokens and creates two RTCPeerConnections in parallel.
let activeStartId = 0;
let hasActiveSession = false;

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
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const startingRef = useRef(false);
  const greetedRef = useRef(false);

  // Per-turn buffers
  const assistantTextBufRef = useRef<string>("");
  const userTranscriptBufRef = useRef<string>("");

  const cleanup = useCallback(() => {
    greetedRef.current = false;
    startingRef.current = false;
    hasActiveSession = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try { dcRef.current?.close(); } catch { /* ignore */ }
    try { pcRef.current?.close(); } catch { /* ignore */ }
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
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
      console.log("[useRealtimeVoice] start skipped (already starting/connected)");
      return;
    }
    startingRef.current = true;
    hasActiveSession = true;
    const myStartId = ++activeStartId;
    const isStale = () => myStartId !== activeStartId;
    setUiState("connecting");
    try {
      // 1. Mint ephemeral token
      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("realtime-token", {
        body: { language, voice: "shimmer" },
      });
      if (isStale()) { console.log("[useRealtimeVoice] stale after token, abort"); return; }
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

      // CRITICAL: explicit recvonly transceiver guarantees `pc.ontrack`
      // fires deterministically with the remote ADA audio. Without this the
      // SDP answer is sendrecv but no track event is delivered in some
      // browsers, leaving the page silent.
      try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch (err) {
        console.warn("[useRealtimeVoice] addTransceiver(recvonly) failed", err);
      }

      pc.addEventListener("connectionstatechange", () => {
        console.log("PC state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          console.log("RTC CONNECTED");
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
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

      // 4. Mic
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = micStream;
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      // 5. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("DATA CHANNEL OPEN");
        // Configure session: enable input audio transcription so we receive
        // `conversation.item.input_audio_transcription.completed` events that
        // drive the local step machine + next-turn prompts.
        try {
          dc.send(JSON.stringify({
            type: "session.update",
            session: {
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: { type: "server_vad" },
            },
          }));
          console.log("[useRealtimeVoice] session.update sent (transcription on)");
        } catch (err) {
          console.warn("[useRealtimeVoice] session.update failed", err);
        }
        // Kick off the conversation: ask ADA to greet immediately.
        if (!greetedRef.current) {
          greetedRef.current = true;
          try {
            dc.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio"],
                instructions:
                  "Hey I'm ADA AI. Tell me about your business — what's the name, what do you do, and what are you looking to build?",
              },
            }));
            console.log("[useRealtimeVoice] greet response.create sent");
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
          case "response.created":
            // Any of these prove the session is alive — leave "connecting".
            if (mountedRef.current) {
              setUiState((prev) => (prev === "connecting" ? "listening" : prev));
            }
            break;
          case "input_audio_buffer.speech_started":
            if (mountedRef.current) setUiState("listening");
            break;
          case "input_audio_buffer.speech_stopped":
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

      const sdpResp = await fetch(`${REALTIME_CALLS}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeral}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResp.ok) {
        const text = await sdpResp.text();
        console.error("SDP exchange failed", sdpResp.status, text);
        throw new Error(`Realtime SDP exchange failed (${sdpResp.status}): ${text}`);
      }

      const answerSdp = await sdpResp.text();
      if (isStale()) { console.log("[useRealtimeVoice] stale after SDP answer, abort"); return; }
      if (!answerSdp.startsWith("v=")) {
        console.error("Invalid SDP answer (does not start with 'v='):", answerSdp.slice(0, 200));
        throw new Error("Invalid SDP answer from Realtime API");
      }
      console.log("SDP ANSWER RECEIVED", { len: answerSdp.length });
      const answer: RTCSessionDescriptionInit = { type: "answer", sdp: answerSdp };
      await pc.setRemoteDescription(answer);

      console.log("[useRealtimeVoice] connected");
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
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  /** Called from a user gesture to retry playback if autoplay was blocked. */
  const unlockAudio = useCallback(async () => {
    try {
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
  }, []);

  // Start/stop on enabled flag
  useEffect(() => {
    if (enabled) {
      void start();
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Stable return shape: same keys every render, regardless of state.
  return useMemo(
    () => ({ uiState, level, start, stop, audioBlocked, unlockAudio }),
    [uiState, level, start, stop, audioBlocked, unlockAudio],
  );
}