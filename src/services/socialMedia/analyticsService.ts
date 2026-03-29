/**
 * YANGU Social Media — Analytics Service
 * Handles analytics data fetching, aggregation, and transformation.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  AnalyticsDateRange,
  AnalyticsSummary,
  SocialAnalyticsSnapshot,
} from "@/types/socialMedia";

export const analyticsService = {
  /** Fetch raw snapshots for a date range */
  async getSnapshots(
    userId: string,
    dateRange: AnalyticsDateRange,
    accountId?: string
  ): Promise<SocialAnalyticsSnapshot[]> {
    let query = supabase
      .from("social_analytics_snapshots")
      .select("*")
      .eq("user_id", userId)
      .gte("snapshot_date", dateRange.start_date)
      .lte("snapshot_date", dateRange.end_date)
      .order("snapshot_date", { ascending: true });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      workspace_id: "",
      connected_account_id: row.account_id,
      provider: null,
      snapshot_date: row.snapshot_date,
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: row.impressions || 0,
      reach: 0,
      clicks: row.clicks || 0,
      saves: 0,
      followers: row.followers || 0,
      engagement_rate: row.engagement_rate || 0,
      payload: row.metrics as Record<string, unknown> | null,
      created_at: row.created_at,
    }));
  },

  /** Aggregate workspace-level summary */
  async getWorkspaceSummary(
    userId: string,
    dateRange: AnalyticsDateRange
  ): Promise<AnalyticsSummary> {
    const snapshots = await this.getSnapshots(userId, dateRange);

    const totals = snapshots.reduce(
      (acc, s) => ({
        impressions: acc.impressions + s.impressions,
        clicks: acc.clicks + s.clicks,
        engagement: acc.engagement + s.engagement_rate,
        followers: Math.max(acc.followers, s.followers),
      }),
      { impressions: 0, clicks: 0, engagement: 0, followers: 0 }
    );

    return {
      total_impressions: totals.impressions,
      total_clicks: totals.clicks,
      total_engagement: totals.engagement,
      total_followers: totals.followers,
      avg_engagement_rate: snapshots.length
        ? totals.engagement / snapshots.length
        : 0,
      by_account: [],
    };
  },

  /** Fetch analytics for a specific post */
  async getPostAnalytics(postId: string): Promise<SocialAnalyticsSnapshot[]> {
    const { data, error } = await supabase
      .from("social_analytics_snapshots")
      .select("*")
      .eq("id", postId);

    if (error) throw error;
    return (data || []) as unknown as SocialAnalyticsSnapshot[];
  },

  /** Check if analytics are available (any connected accounts with data) */
  async isAnalyticsReady(userId: string): Promise<boolean> {
    const { count } = await supabase
      .from("social_analytics_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return (count || 0) > 0;
  },
};
