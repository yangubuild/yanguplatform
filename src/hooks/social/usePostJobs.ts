/**
 * YANGU Social Media — Post Job Management Hook
 * Query job states + manual actions (retry, cancel, reschedule).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────

export type PostJobStatus = "queued" | "processing" | "published" | "failed" | "retrying" | "cancelled";

export interface PostJob {
  id: string;
  post_id: string;
  workspace_id: string;
  platform: string;
  account_id: string;
  variant_url: string | null;
  caption: string;
  hashtags: string[];
  scheduled_at: string;
  status: PostJobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  claimed_at: string | null;
  published_at: string | null;
  external_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostJobEvent {
  id: string;
  job_id: string;
  event_type: string;
  message: string | null;
  error_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Hook ─────────────────────────────────────────────────

export function usePostJobs(workspaceId: string | null, statusFilter?: PostJobStatus) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: [...socialKeys.all, "jobs", workspaceId, statusFilter],
    enabled: !!user && !!workspaceId,
    queryFn: async (): Promise<PostJob[]> => {
      let q = supabase
        .from("social_post_jobs")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("scheduled_at", { ascending: true });

      if (statusFilter) {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PostJob[];
    },
  });

  const jobEventsQuery = (jobId: string) =>
    supabase
      .from("social_post_job_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

  // ── Manual Actions ───────────────────────────────────

  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("social_post_jobs")
        .update({
          status: "queued" as any,
          next_retry_at: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", jobId)
        .in("status", ["failed"]);

      if (error) throw error;

      await supabase.from("social_post_job_events").insert({
        job_id: jobId,
        event_type: "retry_manual",
        message: "Manually queued for retry",
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "jobs"] });
      toast.success("Job queued for retry");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("social_post_jobs")
        .update({
          status: "cancelled" as any,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", jobId)
        .in("status", ["queued", "retrying"]);

      if (error) throw error;

      await supabase.from("social_post_job_events").insert({
        job_id: jobId,
        event_type: "cancelled",
        message: "Manually cancelled",
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "jobs"] });
      toast.success("Job cancelled");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ jobId, scheduledAt }: { jobId: string; scheduledAt: string }) => {
      const { error } = await supabase
        .from("social_post_jobs")
        .update({
          status: "queued" as any,
          scheduled_at: scheduledAt,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", jobId)
        .in("status", ["queued", "retrying", "failed"]);

      if (error) throw error;

      await supabase.from("social_post_job_events").insert({
        job_id: jobId,
        event_type: "rescheduled",
        message: `Rescheduled to ${scheduledAt}`,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "jobs"] });
      toast.success("Job rescheduled");
    },
  });

  // ── Create jobs from a scheduled post ────────────────

  const createJobsMutation = useMutation({
    mutationFn: async (params: {
      postId: string;
      workspaceId: string;
      targets: Array<{
        platform: string;
        accountId: string;
        variantUrl?: string;
      }>;
      caption: string;
      hashtags?: string[];
      scheduledAt: string;
    }) => {
      const jobs = params.targets.map((t) => ({
        post_id: params.postId,
        workspace_id: params.workspaceId,
        platform: t.platform,
        account_id: t.accountId,
        variant_url: t.variantUrl || null,
        caption: params.caption,
        hashtags: params.hashtags || [],
        scheduled_at: params.scheduledAt,
        status: "queued",
      }));

      const { error } = await supabase
        .from("social_post_jobs")
        .insert(jobs as any);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "jobs"] });
    },
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    error: jobsQuery.error,
    refetch: jobsQuery.refetch,
    getJobEvents: jobEventsQuery,
    retryJob: retryMutation.mutateAsync,
    cancelJob: cancelMutation.mutateAsync,
    rescheduleJob: rescheduleMutation.mutateAsync,
    createJobs: createJobsMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
