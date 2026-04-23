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

import { useCallback, useEffect, useRef, useState } from "react";
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

const REALTIME_BASE = "https://api.openai.com/v1/realtime";

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

  // Per-turn buffers
  const assistantTextBufRef = useRef<string>("");
  const userTranscriptBufRef = useRef<string>("");

  const cleanup = useCallback(() => {
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
    if (pcRef.current) return; // already connected
    setUiState("connecting");
    try {
      // 1. Mint ephemeral token
      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("realtime-token", {
        body: { language, voice: "shimmer" },
      });
      if (tokenErr) throw new Error(tokenErr.message || "Failed to mint realtime token");
      const ephemeral: string | undefined = tokenData?.client_secret;
      const model: string = tokenData?.model || "gpt-4o-realtime-preview-2024-12-17";
      if (!ephemeral) throw new Error("No client_secret returned");

      // 2. Peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Remote audio sink
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (audioElRef.current) {
          audioElRef.current.srcObject = stream;
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
        console.log("[useRealtimeVoice] data channel open");
        // Kick off the conversation: ask ADA to greet immediately.
        try {
          dc.send(JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions:
                "Greet the user warmly in their language and ask what kind of business they want to build. Keep it to one short sentence.",
            },
          }));
        } catch (err) {
          console.warn("[useRealtimeVoice] greet send failed", err);
        }
        if (mountedRef.current) setUiState("listening");
        onConnected?.();
      });

      dc.addEventListener("message", (e: MessageEvent) => {
        let msg: { type: string; [k: string]: unknown };
        try { msg = JSON.parse(e.data); } catch { return; }

        switch (msg.type) {
          case "input_audio_buffer.speech_started":
            if (mountedRef.current) setUiState("listening");
            break;
          case "input_audio_buffer.speech_stopped":
            if (mountedRef.current) setUiState("thinking");
            break;
          case "response.audio.delta":
            if (mountedRef.current) setUiState("speaking");
            break;
          case "response.audio.done":
            if (mountedRef.current) setUiState("listening");
            break;
          case "response.audio_transcript.delta":
          case "response.output_text.delta": {
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

      dc.addEventListener("close", () => {
        console.log("[useRealtimeVoice] data channel closed");
      });

      // 6. SDP exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(`${REALTIME_BASE}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeral}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResp.ok) {
        const text = await sdpResp.text();
        throw new Error(`Realtime SDP exchange failed (${sdpResp.status}): ${text}`);
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResp.text(),
      };
      await pc.setRemoteDescription(answer);

      console.log("[useRealtimeVoice] connected");
    } catch (err) {
      console.error("[useRealtimeVoice] start failed", err);
      cleanup();
      if (mountedRef.current) setUiState("error");
      onError?.(err instanceof Error ? err : new Error(String(err)));
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

  return { uiState, level, start, stop, audioBlocked, unlockAudio };
}