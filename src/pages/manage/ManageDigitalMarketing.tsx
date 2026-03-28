import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Share2, Globe, TrendingUp, Eye, MousePointer, BarChart3,
  Calendar, Plug, Search, Activity, Loader2, Plus, Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { getPlatform } from "@/lib/socialPlatformRegistry";
import instagramIcon from "@/assets/icons/instagram.png";
import tiktokIcon from "@/assets/icons/tiktok.png";
import facebookIcon from "@/assets/icons/facebook.png";
import xIcon from "@/assets/icons/x.png";
import youtubeIcon from "@/assets/icons/youtube.png";
import websiteIcon from "@/assets/icons/website.png";
import linkedinIcon from "@/assets/icons/linkedin.png";

const PLATFORM_ICON_MAP: Record<string, string> = {
  instagram: instagramIcon,
  tiktok: tiktokIcon,
  facebook: facebookIcon,
  x: xIcon,
  linkedin: linkedinIcon,
  youtube: youtubeIcon,
};

const DEFAULT_PLATFORMS = ["instagram", "tiktok", "facebook", "x", "linkedin", "youtube"];

function useSocialConnections() {
  return useQuery({
    queryKey: ["manage", "social-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("*")
        .order("platform");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useSocialPosts() {
  return useQuery({
    queryKey: ["manage", "social-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useDepartmentReports() {
  return useQuery({
    queryKey: ["manage", "daily-reports-digital"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_reports")
        .select("*")
        .eq("department", "digital_marketing")
        .order("report_date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const THIRD_PARTY_TOOLS = [
  { name: "Buffer", description: "Social media scheduling" },
  { name: "Hootsuite", description: "Social media management" },
  { name: "Sprout Social", description: "Social analytics & engagement" },
  { name: "Google Analytics", description: "Web analytics" },
  { name: "Google Search Console", description: "SEO & search performance" },
];

export default function ManageDigitalMarketing() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: connections = [], isLoading: connLoading } = useSocialConnections();
  const { data: posts = [], isLoading: postsLoading } = useSocialPosts();
  const { data: reports = [] } = useDepartmentReports();

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostPlatform, setNewPostPlatform] = useState("instagram");

  const connectedCount = connections.filter((c: any) => c.status === "connected").length;
  const totalFollowers = connections.reduce((s: number, c: any) => s + (c.followers_count || 0), 0);

  // Build a map of connected platforms
  const connMap = new Map(connections.map((c: any) => [c.platform, c]));

  const createPost = useMutation({
    mutationFn: async () => {
      if (!newPostContent.trim()) throw new Error("Content required");
      const { error } = await supabase
        .from("social_posts")
        .insert({
          platform: newPostPlatform,
          content: newPostContent.trim(),
          status: "draft",
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "social-posts"] });
      setNewPostContent("");
      toast.success("Post draft created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Digital Marketing" description="Social media, SEO, analytics & performance tracking" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Connected Platforms" value={connectedCount} icon={<Share2 className="h-4 w-4" />} />
        <AdminMetricCard label="Total Followers" value={totalFollowers.toLocaleString()} icon={<Eye className="h-4 w-4" />} />
        <AdminMetricCard label="Scheduled Posts" value={posts.filter((p: any) => p.status === "scheduled").length} icon={<Calendar className="h-4 w-4" />} />
        <AdminMetricCard label="Drafts" value={posts.filter((p: any) => p.status === "draft").length} icon={<Search className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="social">
        <TabsList>
          <TabsTrigger value="social">Social Accounts</TabsTrigger>
          <TabsTrigger value="scheduler">Post Scheduler</TabsTrigger>
          <TabsTrigger value="seo">SEO & Rankings</TabsTrigger>
          <TabsTrigger value="heatmaps">Hot Mapping</TabsTrigger>
          <TabsTrigger value="tools">Third-Party Tools</TabsTrigger>
          <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
        </TabsList>

        {/* Social Accounts — live from social_connections */}
        <TabsContent value="social" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Social Media Accounts</h3>
            {connLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_PLATFORMS.map((platform) => {
                  const conn = connMap.get(platform) as any;
                  const isConnected = conn?.status === "connected";
                  return (
                    <div key={platform} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img src={PLATFORM_ICON_MAP[platform] || websiteIcon} alt={platform} className="h-5 w-5 object-contain" />
                          <span className="text-sm font-medium text-[hsl(var(--admin-text))] capitalize">{platform}</span>
                        </div>
                        <Badge variant="outline" className={isConnected ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>
                          {isConnected ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {isConnected ? `${(conn.followers_count || 0).toLocaleString()} followers` : "—"}
                        </span>
                        <Button variant="outline" size="sm" className="text-xs">
                          {isConnected ? "Manage" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminGlassCard>
        </TabsContent>

        {/* Post Scheduler — live from social_posts */}
        <TabsContent value="scheduler" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Post Scheduler</h3>
            </div>

            {/* New post form */}
            <div className="rounded-lg border border-border p-3 mb-4 space-y-2">
              <Textarea
                placeholder="Write your post content..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newPostPlatform}
                  onChange={(e) => setNewPostPlatform(e.target.value)}
                  className="text-xs rounded border border-border bg-background px-2 py-1"
                >
                  {DEFAULT_PLATFORMS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
                <Button size="sm" onClick={() => createPost.mutate()} disabled={createPost.isPending}>
                  {createPost.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                  Create Draft
                </Button>
              </div>
            </div>

            {postsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : posts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No posts yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post: any) => (
                  <div key={post.id} className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="capitalize">{post.platform}</span>
                        <span>•</span>
                        <span>{format(new Date(post.created_at), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{post.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">SEO & Domain Rankings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {["yangu.io", "yangu.shop", "yangu.store", "yangu.studio"].map((d) => (
                <div key={d} className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-3">
                  <p className="text-sm font-mono font-medium text-foreground">{d}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Rank: —</span>
                    <span>Daily Visits: —</span>
                    <span>Trend: —</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Connect Google Search Console for live data</p>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="heatmaps" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Click Heatmaps & User Journey</h3>
            <div className="py-12 text-center text-muted-foreground text-sm">
              <MousePointer className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Heatmap tracking not yet configured</p>
              <p className="text-xs mt-1">Integrate with Hotjar, Microsoft Clarity, or PostHog for click heatmaps</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plug className="h-4 w-4 mr-2" /> Configure Analytics
              </Button>
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Third-Party Integrations</h3>
            <div className="space-y-3">
              {THIRD_PARTY_TOOLS.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.3)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--admin-text))]">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Plug className="h-3.5 w-3.5 mr-1.5" /> Connect
                  </Button>
                </div>
              ))}
            </div>
          </AdminGlassCard>
        </TabsContent>

        {/* Daily Report — live from department_reports */}
        <TabsContent value="daily-report" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Daily Performance Reports</h3>
            {reports.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No reports submitted yet</p>
                <p className="text-xs mt-1">Reports are submitted via the Department Reports section</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r: any) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{r.report_date}</span>
                      <Badge variant="outline" className="text-[9px]">digital_marketing</Badge>
                    </div>
                    {r.summary && <p className="text-xs text-muted-foreground">{r.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </AdminGlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
