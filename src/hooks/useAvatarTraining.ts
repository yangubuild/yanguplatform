import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainingJob {
  id: string;
  user_id: string;
  status: string;
  provider: string;
  payload: Record<string, unknown>;
  avatar_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export function useAvatarTraining() {
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [latestJob, setLatestJob] = useState<TrainingJob | null>(null);

  const startTraining = async (provider: string = "heygen", payload?: Record<string, unknown>) => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("avatar-train-start", {
        body: { provider, payload },
      });
      if (error) throw error;

      const job = data.job as TrainingJob;
      setLatestJob(job);

      if (job.status === "not_enabled") {
        toast.info(data.message || "Avatar training is not currently enabled.");
      } else {
        toast.success("Training job created!");
      }
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to start training");
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("avatar-train-status", {
        method: "GET",
      });
      if (error) throw error;
      setJobs(data.jobs || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(`avatar-train-status?job_id=${jobId}`, {
        method: "GET",
      });
      if (error) throw error;
      if (data.job) setLatestJob(data.job);
      return data.job;
    } catch {
      return null;
    }
  };

  return { startTraining, isStarting, fetchJobs, isLoading, jobs, latestJob, pollJob };
}
