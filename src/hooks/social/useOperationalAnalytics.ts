/**
 * YANGU Social Media — Operational Analytics Hook
 * Uses real data from social_post_jobs, social_posts, social_connected_accounts,
 * social_generated_designs, social_design_variations.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";

export interface OperationalMetrics {
  generatedPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  successRate: number;
  connectedAccounts: number;
  expiredAccounts: number;
}

export interface PlatformBreakdown {
  platform: string;
  scheduled: number;
  published: number;
  failed: number;
}

export interface PublishingTrend {
  date: string;
  generated: number;
  scheduled: number;
  published: number;
  failed: number;
}

export interface FailureBreakdown {
  reason: string;
  count: number;
}

export interface RecentPublished {
  id: string;
  caption: string;
  platform: string;
  scheduled_at: string;
  published_at: string | null;
  status: string;
  account_name: string;
}

export interface FailedJob {
  id: string;
  platform: string;
  last_error: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  status: string;
}

export interface AccountHealth {
  id: string;
  platform: string;
  display_name: string;
  status: string;
  needs_reconnect: boolean;
}

export type DatePreset = "today" | "7d" | "30d";

function getDateStart(preset: DatePreset): string {
  const now = new Date();
  if (preset === "today") {
    return now.toISOString().split("T")[0];
  }
  const days = preset === "7d" ? 7 : 30;
  const d = new Date(now.getTime() - days * 86400000);
  return d.toISOString().split("T")[0];
}

export function useOperationalAnalytics(preset: DatePreset = "30d", platform?: string) {
  const { user } = useAuth();
  const dateStart = getDateStart(preset);

  // Metrics summary
  const metricsQuery = useQuery({
    queryKey: [...socialKeys.all, "op-metrics", preset, platform],
    enabled: !!user,
    queryFn: async (): Promise<OperationalMetrics> => {
      if (!user) return { generatedPosts: 0, scheduledPosts: 0, publishedPosts: 0, failedPosts: 0, successRate: 0, connectedAccounts: 0, expiredAccounts: 0 };

      // Generated designs count
      const { count: genCount } = await supabase
        .from("social_generated_designs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dateStart);

      // Jobs by status
      let jobsQ = supabase
        .from("social_post_jobs")
        .select("status")
        .eq("workspace_id", user.id)
        .gte("created_at", dateStart);
      if (platform) jobsQ = jobsQ.eq("platform", platform);
      const { data: jobs } = await jobsQ;

      const scheduled = (jobs || []).filter(j => ["queued", "retrying", "processing"].includes(j.status)).length;
      const published = (jobs || []).filter(j => j.status === "published").length;
      const failed = (jobs || []).filter(j => j.status === "failed").length;
      const total = published + failed;

      // Connected accounts
      const { data: accounts } = await supabase
        .from("social_connected_accounts")
        .select("status")
        .eq("user_id", user.id)
        .neq("status", "disconnected");

      const connected = (accounts || []).filter(a => a.status === "active").length;
      const expired = (accounts || []).filter(a => ["expired", "error"].includes(a.status || "")).length;

      return {
        generatedPosts: genCount || 0,
        scheduledPosts: scheduled,
        publishedPosts: published,
        failedPosts: failed,
        successRate: total > 0 ? Math.round((published / total) * 100) : 0,
        connectedAccounts: connected,
        expiredAccounts: expired,
      };
    },
  });

  // Platform breakdown
  const platformQuery = useQuery({
    queryKey: [...socialKeys.all, "op-platform", preset],
    enabled: !!user,
    queryFn: async (): Promise<PlatformBreakdown[]> => {
      if (!user) return [];
      const { data: jobs } = await supabase
        .from("social_post_jobs")
        .select("platform, status")
        .eq("workspace_id", user.id)
        .gte("created_at", dateStart);

      const map = new Map<string, PlatformBreakdown>();
      for (const j of jobs || []) {
        const p = j.platform || "unknown";
        if (!map.has(p)) map.set(p, { platform: p, scheduled: 0, published: 0, failed: 0 });
        const entry = map.get(p)!;
        if (["queued", "retrying", "processing"].includes(j.status)) entry.scheduled++;
        if (j.status === "published") entry.published++;
        if (j.status === "failed") entry.failed++;
      }
      return Array.from(map.values());
    },
  });

  // Publishing trend (daily)
  const trendQuery = useQuery({
    queryKey: [...socialKeys.all, "op-trend", preset],
    enabled: !!user,
    queryFn: async (): Promise<PublishingTrend[]> => {
      if (!user) return [];

      const { data: jobs } = await supabase
        .from("social_post_jobs")
        .select("scheduled_at, status, created_at, published_at")
        .eq("workspace_id", user.id)
        .gte("created_at", dateStart)
        .order("created_at", { ascending: true });

      const dayMap = new Map<string, PublishingTrend>();
      for (const j of jobs || []) {
        const day = (j.created_at || "").split("T")[0];
        if (!day) continue;
        if (!dayMap.has(day)) dayMap.set(day, { date: day, generated: 0, scheduled: 0, published: 0, failed: 0 });
        const entry = dayMap.get(day)!;
        entry.generated++;
        if (["queued", "retrying", "processing"].includes(j.status)) entry.scheduled++;
        if (j.status === "published") entry.published++;
        if (j.status === "failed") entry.failed++;
      }
      return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  // Failure breakdown
  const failuresQuery = useQuery({
    queryKey: [...socialKeys.all, "op-failures", preset],
    enabled: !!user,
    queryFn: async (): Promise<FailureBreakdown[]> => {
      if (!user) return [];
      const { data: jobs } = await supabase
        .from("social_post_jobs")
        .select("last_error")
        .eq("workspace_id", user.id)
        .eq("status", "failed")
        .gte("created_at", dateStart);

      const map = new Map<string, number>();
      for (const j of jobs || []) {
        const reason = categorizeError((j as any).last_error);
        map.set(reason, (map.get(reason) || 0) + 1);
      }
      return Array.from(map.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Recent published
  const recentQuery = useQuery({
    queryKey: [...socialKeys.all, "op-recent", preset],
    enabled: !!user,
    queryFn: async (): Promise<RecentPublished[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("social_post_jobs")
        .select("id, caption, platform, scheduled_at, published_at, status, account_id")
        .eq("workspace_id", user.id)
        .eq("status", "published")
        .gte("created_at", dateStart)
        .order("published_at", { ascending: false })
        .limit(20);

      return (data || []).map((j: any) => ({
        id: j.id,
        caption: j.caption || "",
        platform: j.platform || "",
        scheduled_at: j.scheduled_at || "",
        published_at: j.published_at,
        status: j.status,
        account_name: "",
      }));
    },
  });

  // Failed/retrying jobs
  const failedJobsQuery = useQuery({
    queryKey: [...socialKeys.all, "op-failed-jobs", preset],
    enabled: !!user,
    queryFn: async (): Promise<FailedJob[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("social_post_jobs")
        .select("id, platform, last_error, attempts, max_attempts, next_retry_at, status")
        .eq("workspace_id", user.id)
        .in("status", ["failed", "retrying"])
        .gte("created_at", dateStart)
        .order("updated_at", { ascending: false })
        .limit(20);

      return (data || []).map((j: any) => ({
        id: j.id,
        platform: j.platform || "",
        last_error: j.last_error,
        attempts: j.attempts || 0,
        max_attempts: j.max_attempts || 3,
        next_retry_at: j.next_retry_at,
        status: j.status,
      }));
    },
  });

  // Account health
  const accountHealthQuery = useQuery({
    queryKey: [...socialKeys.all, "op-account-health"],
    enabled: !!user,
    queryFn: async (): Promise<AccountHealth[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("social_connected_accounts")
        .select("id, provider, display_name, status")
        .eq("user_id", user.id)
        .neq("status", "disconnected");

      return (data || []).map((a: any) => ({
        id: a.id,
        platform: a.provider || "",
        display_name: a.display_name || "",
        status: a.status || "active",
        needs_reconnect: ["expired", "error"].includes(a.status || ""),
      }));
    },
  });

  return {
    metrics: metricsQuery.data,
    platformBreakdown: platformQuery.data || [],
    trend: trendQuery.data || [],
    failures: failuresQuery.data || [],
    recentPublished: recentQuery.data || [],
    failedJobs: failedJobsQuery.data || [],
    accountHealth: accountHealthQuery.data || [],
    isLoading: metricsQuery.isLoading,
  };
}

function categorizeError(error: string | null): string {
  if (!error) return "Unknown";
  const e = error.toLowerCase();
  if (e.includes("auth") || e.includes("token") || e.includes("expired")) return "Auth Expired";
  if (e.includes("media") || e.includes("image") || e.includes("video")) return "Invalid Media";
  if (e.includes("rate") || e.includes("limit") || e.includes("throttl")) return "Rate Limited";
  if (e.includes("timeout") || e.includes("timed out")) return "Timeout";
  if (e.includes("format") || e.includes("unsupported")) return "Unsupported Format";
  if (e.includes("reject") || e.includes("denied") || e.includes("forbidden")) return "Rejected by Platform";
  if (e.includes("server") || e.includes("5") || e.includes("outage")) return "Provider Outage";
  return "Other";
}
