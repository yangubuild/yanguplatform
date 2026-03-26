import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, TrendingUp, Globe, BarChart3, RefreshCw, CheckCircle2, XCircle,
  ArrowUpRight, Target,
} from "lucide-react";
import { useState } from "react";

/* ── Capability config ── */
const CAPABILITIES = [
  { key: "ai_shop_builder", label: "AI Shop Builder", icon: "🛒" },
  { key: "ai_bio_pages", label: "AI Bio Pages", icon: "📄" },
  { key: "ai_selling", label: "AI Selling", icon: "💰" },
  { key: "digital_product_uni", label: "Digital Product Uni", icon: "🎓" },
  { key: "ai_avatars", label: "AI Avatars", icon: "🤖" },
  { key: "ai_influencers", label: "AI Influencers", icon: "⭐" },
  { key: "live_selling_ai", label: "Live Selling AI", icon: "📺" },
  { key: "business_communities", label: "Business Communities", icon: "👥" },
  { key: "ai_learning", label: "AI Learning", icon: "📚" },
  { key: "ai_marketing", label: "AI Marketing", icon: "📣" },
  { key: "surface_builder", label: "Surface Builder", icon: "🌐" },
  { key: "ai_discovery_engine", label: "AI Discovery Engine", icon: "🔍" },
] as const;

const AI_PLATFORMS = [
  { key: "chatgpt", label: "ChatGPT", color: "#10A37F" },
  { key: "perplexity", label: "Perplexity", color: "#1FB8CD" },
  { key: "gemini", label: "Gemini", color: "#8E75B2" },
  { key: "claude", label: "Claude", color: "#D97757" },
  { key: "deepseek", label: "DeepSeek", color: "#4F46E5" },
  { key: "copilot", label: "Copilot", color: "#0078D4" },
  { key: "meta_ai", label: "Meta AI", color: "#0668E1" },
];

const REGIONS = [
  { key: "africa", label: "Africa", emoji: "🌍" },
  { key: "middle_east", label: "Middle East", emoji: "🕌" },
  { key: "global", label: "Global", emoji: "🌐" },
];

export default function ManageAiVisibility() {
  const [scanning, setScanning] = useState(false);

  const { data: tracking = [], isLoading: trackingLoading } = useQuery({
    queryKey: ["ai-visibility-tracking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_visibility_tracking")
        .select("*")
        .order("tracked_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["ai-visibility-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_visibility_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  /* ── Derived stats ── */
  const totalQueries = tracking.length;
  const mentionedCount = tracking.filter((t: any) => t.yangu_mentioned).length;
  const mentionRate = totalQueries > 0 ? Math.round((mentionedCount / totalQueries) * 100) : 0;
  const avgPosition = (() => {
    const withPos = tracking.filter((t: any) => t.yangu_mentioned && t.yangu_position);
    if (withPos.length === 0) return "—";
    const avg = withPos.reduce((sum: number, t: any) => sum + (t.yangu_position ?? 0), 0) / withPos.length;
    return `#${avg.toFixed(1)}`;
  })();
  const positioningMatchRate = (() => {
    const matched = tracking.filter((t: any) => t.positioning_match).length;
    return totalQueries > 0 ? Math.round((matched / totalQueries) * 100) : 0;
  })();

  /* ── Capability breakdown ── */
  const capabilityStats = CAPABILITIES.map((cap) => {
    const relevant = tracking.filter((t: any) =>
      (t.capability_mentioned as string[] | null)?.includes(cap.key)
    );
    const total = tracking.length || 1;
    return {
      ...cap,
      count: relevant.length,
      pct: Math.round((relevant.length / total) * 100),
    };
  }).sort((a, b) => b.pct - a.pct);

  /* ── Regional breakdown ── */
  const regionStats = REGIONS.map((r) => {
    const relevant = tracking.filter((t: any) => {
      const q = (t.query as string).toLowerCase();
      if (r.key === "africa") return q.includes("africa") || q.includes("kenya") || q.includes("nigeria");
      if (r.key === "middle_east") return q.includes("middle east") || q.includes("uae") || q.includes("saudi");
      return true;
    });
    const mentioned = relevant.filter((t: any) => t.yangu_mentioned).length;
    return {
      ...r,
      total: relevant.length,
      mentioned,
      pct: relevant.length > 0 ? Math.round((mentioned / relevant.length) * 100) : 0,
    };
  });

  /* ── Platform breakdown ── */
  const platformStats = AI_PLATFORMS.map((p) => {
    const relevant = tracking.filter((t: any) => t.ai_platform === p.key);
    const mentioned = relevant.filter((t: any) => t.yangu_mentioned).length;
    return {
      ...p,
      total: relevant.length,
      mentioned,
      pct: relevant.length > 0 ? Math.round((mentioned / relevant.length) * 100) : 0,
    };
  });

  const handleRunScan = async () => {
    setScanning(true);
    try {
      await supabase.functions.invoke("ai-visibility-scan");
    } catch { /* */ }
    setScanning(false);
  };

  if (trackingLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Visibility Dashboard"
        description="Track how AI platforms present Yangu vs competitors"
        actions={
          <Button
            size="sm"
            onClick={handleRunScan}
            disabled={scanning}
            className="bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)] text-white">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : "Run Scan"}
          </Button>
        }
      />

      {/* ── Top Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Positioning Score"
          value={`${mentionRate}/100`}
          icon={<Target className="h-4 w-4" />}
          trend={<span className="text-xs text-emerald-500 font-medium">▲ Active</span>}
        />
        <AdminMetricCard
          label="Mention Rate"
          value={`${mentionRate}%`}
          icon={<Eye className="h-4 w-4" />}
          trend={<span className="text-xs text-[hsl(var(--admin-text-muted))]">{mentionedCount}/{totalQueries} queries</span>}
        />
        <AdminMetricCard
          label="Avg Position"
          value={avgPosition}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <AdminMetricCard
          label="Positioning Match"
          value={`${positioningMatchRate}%`}
          icon={<BarChart3 className="h-4 w-4" />}
          trend={<span className="text-xs text-[hsl(var(--admin-text-muted))]">alignment</span>}
        />
      </div>

      <Tabs defaultValue="capabilities" className="space-y-4">
        <TabsList className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border)/0.3)]">
          <TabsTrigger value="capabilities">Capability Breakdown</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
          <TabsTrigger value="regions">Regional</TabsTrigger>
          <TabsTrigger value="recent">Recent Mentions</TabsTrigger>
        </TabsList>

        {/* ── Capability Breakdown ── */}
        <TabsContent value="capabilities">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 uppercase tracking-wider">
              Capability Visibility Breakdown
            </h3>
            <div className="space-y-3">
              {capabilityStats.map((cap) => (
                <div key={cap.key} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{cap.icon}</span>
                  <span className="text-sm text-[hsl(var(--admin-text))] w-44 truncate">{cap.label}</span>
                  <div className="flex-1 h-3 bg-[hsl(var(--admin-border)/0.2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cap.pct}%`,
                        background: cap.pct > 70 ? "#22c55e" : cap.pct > 40 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[hsl(var(--admin-text))] w-12 text-right">
                    {cap.pct}%
                  </span>
                  <span className="text-xs text-[hsl(var(--admin-text-muted))] w-16">
                    ({cap.count} hits)
                  </span>
                </div>
              ))}
            </div>
            {totalQueries === 0 && (
              <p className="text-sm text-[hsl(var(--admin-text-muted))] text-center py-8">
                No tracking data yet. Run your first scan to start collecting data.
              </p>
            )}
          </AdminGlassCard>
        </TabsContent>

        {/* ── By Platform ── */}
        <TabsContent value="platforms">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {platformStats.map((p) => (
              <AdminGlassCard key={p.key} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">{p.label}</span>
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', sans-serif" }}>
                  {p.pct}%
                </div>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  Mentioned in {p.mentioned}/{p.total} queries
                </p>
                <div className="mt-2 h-2 bg-[hsl(var(--admin-border)/0.2)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                </div>
              </AdminGlassCard>
            ))}
          </div>
        </TabsContent>

        {/* ── Regional ── */}
        <TabsContent value="regions">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 uppercase tracking-wider">
              Regional Visibility
            </h3>
            <div className="space-y-5">
              {regionStats.map((r) => (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[hsl(var(--admin-text))]">
                      {r.emoji} {r.label}
                    </span>
                    <span className="text-sm font-bold text-[hsl(var(--admin-text))]">{r.pct}%</span>
                  </div>
                  <div className="h-4 bg-[hsl(var(--admin-border)/0.2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${r.pct}%`,
                        background: r.pct > 80 ? "#22c55e" : r.pct > 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                    {r.mentioned}/{r.total} queries • {r.pct > 80 ? "Dominant" : r.pct > 50 ? "Strong" : "Growing"}
                  </p>
                </div>
              ))}
            </div>
          </AdminGlassCard>
        </TabsContent>

        {/* ── Recent Mentions ── */}
        <TabsContent value="recent">
          <AdminGlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-[hsl(var(--admin-card))]">
                  <tr className="text-left text-xs text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Mentioned</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Sentiment</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--admin-border)/0.2)]">
                  {tracking.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[hsl(var(--admin-text-muted))]">
                        No tracking data yet. Click "Run Scan" to start.
                      </td>
                    </tr>
                  ) : (
                    tracking.slice(0, 50).map((t: any) => (
                      <tr key={t.id} className="hover:bg-[hsl(var(--admin-border)/0.05)]">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
                            {AI_PLATFORMS.find((p) => p.key === t.ai_platform)?.label || t.ai_platform}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--admin-text))] max-w-[200px] truncate">{t.query}</td>
                        <td className="px-4 py-3">
                          {t.yangu_mentioned ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--admin-text))] font-semibold">
                          {t.yangu_mentioned ? `#${t.yangu_position ?? "—"}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${
                              t.sentiment === "positive" ? "border-emerald-500/40 text-emerald-500" :
                              t.sentiment === "negative" ? "border-red-500/40 text-red-500" :
                              "border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]"
                            }`}>
                            {t.sentiment || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[hsl(var(--admin-text-muted))]">
                          {new Date(t.tracked_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminGlassCard>
        </TabsContent>
      </Tabs>

      {/* ── Settings summary ── */}
      {settings && (
        <AdminGlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">Scan Settings</p>
              <p className="text-sm text-[hsl(var(--admin-text))] mt-1">
                {(settings.tracked_queries as string[])?.length ?? 0} tracked queries •{" "}
                {(settings.tracked_ai_platforms as string[])?.length ?? 0} platforms •{" "}
                Frequency: {settings.scan_frequency}
              </p>
              {settings.last_full_scan && (
                <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-0.5">
                  Last full scan: {new Date(settings.last_full_scan).toLocaleString()}
                </p>
              )}
            </div>
            <Globe className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
          </div>
        </AdminGlassCard>
      )}
    </div>
  );
}
