import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";
import { Eye, Heart, MessageSquare, Share2, MousePointerClick } from "lucide-react";
import type { AnalyticsDateRange } from "@/types/socialMedia";

interface PostAnalyticsRow {
  id: string;
  caption: string;
  platform: string | null;
  published_at: string | null;
  primary_media_url: string | null;
  metrics: {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    engagement_rate?: number;
  };
}

interface AnalyticsByPostTabProps {
  hasAccounts: boolean;
  dateRange: AnalyticsDateRange;
  selectedAccountId: string | null;
}

export function AnalyticsByPostTab({
  hasAccounts,
  dateRange,
  selectedAccountId,
}: AnalyticsByPostTabProps) {
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social", "analytics", "by-post", dateRange, selectedAccountId],
    enabled: !!user && hasAccounts,
    queryFn: async (): Promise<PostAnalyticsRow[]> => {
      if (!user) return [];

      // Get published posts with their targets and any snapshot metrics
      let postsQ = supabase
        .from("social_posts")
        .select("id, content, platform, published_at, primary_media_url")
        .eq("created_by", user.id)
        .eq("status", "published")
        .gte("published_at", dateRange.start_date)
        .lte("published_at", dateRange.end_date + "T23:59:59")
        .order("published_at", { ascending: false })
        .limit(50);

      const { data: postRows, error } = await postsQ;
      if (error) throw error;
      if (!postRows?.length) return [];

      // Fetch analytics snapshots for these posts
      const postIds = postRows.map((p) => p.id);
      const { data: snapshots } = await supabase
        .from("social_analytics_snapshots")
        .select("*")
        .in("post_id", postIds);

      const snapshotMap = new Map<string, typeof snapshots>();
      (snapshots || []).forEach((s: any) => {
        const arr = snapshotMap.get(s.post_id) || [];
        arr.push(s);
        snapshotMap.set(s.post_id, arr);
      });

      // Also check targets for metrics_summary
      const { data: targets } = await supabase
        .from("social_post_targets")
        .select("post_id, metrics_summary, connected_account_id")
        .in("post_id", postIds);

      const targetMetrics = new Map<string, Record<string, number>>();
      (targets || []).forEach((t: any) => {
        if (t.metrics_summary && typeof t.metrics_summary === "object") {
          const existing = targetMetrics.get(t.post_id) || {};
          for (const [k, v] of Object.entries(t.metrics_summary as Record<string, number>)) {
            existing[k] = (existing[k] || 0) + (typeof v === "number" ? v : 0);
          }
          targetMetrics.set(t.post_id, existing);
        }
      });

      return postRows.map((p) => {
        const tm = targetMetrics.get(p.id) || {};
        const snaps = snapshotMap.get(p.id) || [];
        // Aggregate from snapshots if available, else from target metrics
        const aggSnap = (snaps as any[]).reduce(
          (acc: any, s: any) => ({
            impressions: acc.impressions + (s.impressions || 0),
            likes: acc.likes + (s.likes || 0),
            comments: acc.comments + (s.comments || 0),
            shares: acc.shares + (s.shares || 0),
            clicks: acc.clicks + (s.clicks || 0),
          }),
          { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
        );

        return {
          id: p.id,
          caption: p.content || "",
          platform: p.platform,
          published_at: p.published_at,
          primary_media_url: p.primary_media_url,
          metrics: {
            impressions: aggSnap.impressions || tm.impressions || 0,
            likes: aggSnap.likes || tm.likes || 0,
            comments: aggSnap.comments || tm.comments || 0,
            shares: aggSnap.shares || tm.shares || 0,
            clicks: aggSnap.clicks || tm.clicks || 0,
          },
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!hasAccounts) {
    return <AnalyticsEmptyState hasAccounts={false} />;
  }

  if (!posts?.length) {
    return (
      <AnalyticsEmptyState hasAccounts={true} />
    );
  }

  return (
    <div className="space-y-3 mt-6">
      {posts.map((post) => (
        <Card key={post.id} className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {post.primary_media_url && (
                <img
                  src={post.primary_media_url}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 mb-1">
                  {post.caption || "Untitled post"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                  {post.platform && (
                    <span className="capitalize">{post.platform}</span>
                  )}
                  {post.published_at && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {(post.metrics.impressions || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {(post.metrics.likes || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {(post.metrics.comments || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    {(post.metrics.shares || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    {(post.metrics.clicks || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
