import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RenderStatus = "idle" | "starting" | "processing" | "completed" | "failed";

export function useVideoRender() {
  const [status, setStatus] = useState<RenderStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startRender = useCallback(async (payload: {
    timeline?: unknown;
    output?: unknown;
    title?: string;
  }) => {
    setStatus("starting");
    setVideoUrl(null);
    setError(null);
    setProgress(0);
    stopPolling();

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("video-render-start", {
        body: payload,
      });

      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error(data?.error || "Failed to start render");

      const jobId = data.job_id;
      setStatus("processing");
      toast.success("Render started!");

      // Start polling
      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        // Simulate progress (Shotstack renders typically take 30-120s)
        setProgress(Math.min(90, pollCount * 5));

        try {
          const { data: statusData, error: statusErr } = await supabase.functions.invoke(
            `video-render-status?job_id=${jobId}`,
            { method: "GET" }
          );

          if (statusErr) return;

          if (statusData?.status === "completed") {
            setStatus("completed");
            setVideoUrl(statusData.video_url);
            setProgress(100);
            stopPolling();
            toast.success("Video rendered successfully!");
          } else if (statusData?.status === "failed") {
            setStatus("failed");
            setError(statusData.error || "Render failed");
            stopPolling();
            toast.error("Render failed: " + (statusData.error || "Unknown error"));
          }
        } catch {
          // Silent polling failure
        }

        // Timeout after 5 minutes
        if (pollCount > 60) {
          setStatus("failed");
          setError("Render timed out");
          stopPolling();
          toast.error("Render timed out after 5 minutes");
        }
      }, 5000);

      return data;
    } catch (err: any) {
      setStatus("failed");
      setError(err.message || "Failed to start render");
      toast.error(err.message || "Failed to start render");
      return null;
    }
  }, [stopPolling]);

  const reset = useCallback(() => {
    setStatus("idle");
    setVideoUrl(null);
    setError(null);
    setProgress(0);
    stopPolling();
  }, [stopPolling]);

  return { status, videoUrl, error, progress, startRender, reset };
}
