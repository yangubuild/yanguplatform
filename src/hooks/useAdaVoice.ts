import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UseAdaVoiceOptions {
  chatId: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  onTranscript: (transcript: string, meta: { audio_path: string; language: string; duration_ms: number }) => void;
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

      // Prefer webm, fallback to ogg
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(250); // collect in 250ms chunks
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
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

        const ext = recorder.mimeType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];

        if (blob.size < 500) {
          // Too short / empty
          resolve();
          return;
        }

        setIsTranscribing(true);
        try {
          const effectiveChatId = chatId || "scratch";
          const ts = Date.now();
          const filePath = `${userId}/${effectiveChatId}/${ts}.${ext}`;

          // Upload to ada-audio bucket
          const { error: upErr } = await supabase.storage
            .from("ada-audio")
            .upload(filePath, blob, { contentType: recorder.mimeType, upsert: false });

          if (upErr) {
            console.error("Upload error:", upErr);
            toast({ title: "Audio upload failed", variant: "destructive" });
            return;
          }

          // Call edge function
          const { data, error: fnErr } = await supabase.functions.invoke("ada-transcribe-audio", {
            body: { bucket: "ada-audio", path: filePath },
          });

          if (fnErr || !data?.transcript) {
            console.error("Transcription error:", fnErr, data);
            toast({ title: "Transcription failed", variant: "destructive" });
            return;
          }

          onTranscript(data.transcript, {
            audio_path: filePath,
            language: data.language || "unknown",
            duration_ms: durationMs,
          });
        } catch (err) {
          console.error("Voice pipeline error:", err);
          toast({ title: "Voice processing error", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };
      recorder.stop();
    });
  }, [chatId, userId, onTranscript]);

  return { isRecording, isTranscribing, startRecording, stopRecording };
}
