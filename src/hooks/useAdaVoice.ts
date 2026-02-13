import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseAdaVoiceOptions {
  chatId: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  onTranscript: (transcript: string, meta: { audio_path: string; language: string; duration_ms: number; mime_type: string; size_bytes: number }) => void;
}

export function useAdaVoice({ chatId, userId, isAuthenticated, onTranscript }: UseAdaVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      toast({ title: "Login to use voice", variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm, fallback to ogg, then mp4
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      console.log("[AdaVoice] Starting recording with mimeType:", mimeType);
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("[AdaVoice] Mic access error:", err);
      toast({ title: "Could not access microphone", variant: "destructive" });
    }
  }, [isAuthenticated, userId]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setIsRecording(false);
    const durationMs = Date.now() - startTimeRef.current;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        // Stop mic stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const mimeType = recorder.mimeType;
        // Map mimeType to extension
        let ext = "webm";
        if (mimeType.includes("ogg")) ext = "ogg";
        else if (mimeType.includes("mp4")) ext = "m4a";

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        console.log("[AdaVoice] Recording stopped. Blob size:", blob.size, "mimeType:", mimeType, "ext:", ext);

        if (blob.size < 500) {
          console.log("[AdaVoice] Blob too small, discarding");
          resolve();
          return;
        }

        setIsTranscribing(true);
        try {
          const effectiveChatId = chatId || "scratch";
          const ts = Date.now();
          const filePath = `${userId}/${effectiveChatId}/${ts}.${ext}`;

          console.log("[AdaVoice] Uploading to ada-audio:", filePath);

          // Upload to ada-audio bucket with upsert
          const { error: upErr } = await supabase.storage
            .from("ada-audio")
            .upload(filePath, blob, { contentType: blob.type, upsert: true });

          if (upErr) {
            console.error("[AdaVoice] Upload error:", JSON.stringify(upErr));
            toast({ title: `Audio upload failed: ${upErr.message || "unknown"}`, variant: "destructive" });
            return;
          }

          console.log("[AdaVoice] Upload success, calling ada-transcribe-audio");

          // Call edge function
          const { data, error: fnErr } = await supabase.functions.invoke("ada-transcribe-audio", {
            body: { bucket: "ada-audio", path: filePath },
          });

          console.log("[AdaVoice] Edge fn response:", { data, fnErr });

          if (fnErr) {
            const errDetail = typeof fnErr === "object" ? JSON.stringify(fnErr) : String(fnErr);
            console.error("[AdaVoice] Edge function error:", errDetail);
            toast({ title: `Transcription failed: ${data?.error || errDetail}`, variant: "destructive" });
            return;
          }

          if (!data?.transcript) {
            const serverErr = data?.error || data?.detail || "No transcript returned";
            console.error("[AdaVoice] No transcript:", serverErr);
            toast({ title: `Transcription failed: ${serverErr}`, variant: "destructive" });
            return;
          }

          console.log("[AdaVoice] Transcript:", data.transcript, "Language:", data.language);

          onTranscript(data.transcript, {
            audio_path: filePath,
            language: data.language || "unknown",
            duration_ms: durationMs,
            mime_type: mimeType,
            size_bytes: blob.size,
          });
        } catch (err) {
          console.error("[AdaVoice] Voice pipeline error:", err);
          toast({ title: "Voice processing error", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };
      recorder.stop();
    });
  }, [chatId, userId, onTranscript]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {};
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
  }, []);

  return { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording };
}
