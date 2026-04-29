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
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micVolumeTimerRef = useRef<number | null>(null);
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
    if (micVolumeTimerRef.current != null) {
      window.clearInterval(micVolumeTimerRef.current);
      micVolumeTimerRef.current = null;
    }
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

      // NOTE: do NOT add a recvonly transceiver here. We will add the mic
      // track below via pc.addTrack(), which creates a sendrecv transceiver
      // that handles BOTH directions (mic up, ADA audio down). Adding a
      // recvonly transceiver first creates a separate m=audio section that
      // can mask the sendrecv one in the answer, leaving the server with
      // no inbound audio (no speech_started events ever fire).

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

      // 4. Mic — MUST be added BEFORE createOffer so the SDP advertises
      // a sendrecv audio m-section. Without this OpenAI never receives
      // user audio and no speech_started / transcription events fire.
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      micStreamRef.current = micStream;
      console.log("MIC STREAM:", micStream);
      console.log("AUDIO TRACKS:", micStream.getAudioTracks());
      micStream.getAudioTracks().forEach((track) => {
        console.log("TRACK:", {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
      });
      // Audio energy detection — verify mic is actually producing signal.
      try {
        const AudioCtx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
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
        const data = new Uint8Array(analyser.frequencyBinCount);
        if (micVolumeTimerRef.current != null) {
          window.clearInterval(micVolumeTimerRef.current);
        }
        micVolumeTimerRef.current = window.setInterval(() => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          console.log("MIC VOLUME:", sum);
        }, 500);
        // Stop monitoring when track ends.
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
      const micTracks = micStream.getAudioTracks();
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
      });
      console.log("ADDING TRACK BEFORE OFFER");
      micStream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, micStream);
        console.log("addTrack sender:", {
          kind: sender.track?.kind,
          enabled: sender.track?.enabled,
          readyState: sender.track?.readyState,
        });
      });
      console.log("SENDERS AFTER ADD:", pc.getSenders());
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          console.log("SENDER TRACK:", sender.track.kind, sender.track.readyState);
        }
      });
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
              audio: {
                input: {
                  turn_detection: { type: "server_vad" },
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
            dc.send(JSON.stringify({
              type: "response.create",
              response: {
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
    try {
      dc.send(JSON.stringify({
        type: "response.create",
        response: { instructions },
      }));
      console.log("[useRealtimeVoice] response.create sent ←", instructions.slice(0, 80));
    } catch (err) {
      console.warn("[useRealtimeVoice] sendInstruction failed", err);
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
    () => ({ uiState, level, start, stop, audioBlocked, unlockAudio, sendInstruction }),
    [uiState, level, start, stop, audioBlocked, unlockAudio, sendInstruction],
  );
}