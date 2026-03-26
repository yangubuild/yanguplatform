import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, TrendingUp, Globe, BarChart3, RefreshCw, CheckCircle2, XCircle,
  Target, Shield, Layers, Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

const SCORE_LABELS: Record<string, { label: string; color: string }> = {
  "Dominant AI Presence": { label: "Dominant AI Presence", color: "#22c55e" },
  "Strong Positioning": { label: "Strong Positioning", color: "#3b82f6" },
  "Growing Visibility": { label: "Growing Visibility", color: "#f59e0b" },
  "Weak Presence": { label: "Weak Presence", color: "#f97316" },
  "Invisible in AI": { label: "Invisible in AI", color: "#ef4444" },
  "No data": { label: "No Data", color: "#6b7280" },
};

interface VisibilityScore {
  total_score: number;
  mention_score: number;
  position_score: number;
  capability_score: number;
  positioning_score: number;
  competitive_score: number;
  mention_rate_pct: number;
  avg_position: number | null;
  capabilities_covered: number;
  positioning_match_pct: number;
  interpretation: string;
  total_queries: number;
  mentioned_count: number;
}

export default function ManageAiVisibility() {
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  /* ── Computed Score via RPC ── */
  const { data: score, isLoading: scoreLoading } = useQuery({
    queryKey: ["ai-visibility-score"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_ai_visibility_score", { p_days: 30 });
      if (error) throw error;
      return data as unknown as VisibilityScore;
    },
  });

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

  /* ── Capability breakdown (from raw data) ── */
  const capabilityStats = CAPABILITIES.map((cap) => {
    const relevant = tracking.filter((t: any) =>
      (t.capability_mentioned as string[] | null)?.includes(cap.key)
    );
    const total = tracking.length || 1;
    return { ...cap, count: relevant.length, pct: Math.round((relevant.length / total) * 100) };
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
    return { ...r, total: relevant.length, mentioned, pct: relevant.length > 0 ? Math.round((mentioned / relevant.length) * 100) : 0 };
  });

  /* ── Platform breakdown ── */
  const platformStats = AI_PLATFORMS.map((p) => {
    const relevant = tracking.filter((t: any) => t.ai_platform === p.key);
    const mentioned = relevant.filter((t: any) => t.yangu_mentioned).length;
    return { ...p, total: relevant.length, mentioned, pct: relevant.length > 0 ? Math.round((mentioned / relevant.length) * 100) : 0 };
  });

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const { error } = await supabase.functions.invoke("ai-visibility-scan");
      if (error) throw error;
      toast.success("Scan complete — refreshing data");
      queryClient.invalidateQueries({ queryKey: ["ai-visibility-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["ai-visibility-score"] });
      queryClient.invalidateQueries({ queryKey: ["ai-visibility-settings"] });
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    }
    setScanning(false);
  };

  const isLoading = trackingLoading || scoreLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalScore = score?.total_score ?? 0;
  const interp = SCORE_LABELS[score?.interpretation ?? "No data"] ?? SCORE_LABELS["No data"];

  const SCORE_COMPONENTS = [
    { label: "Mention Rate", value: score?.mention_score ?? 0, max: 30, icon: <Eye className="h-4 w-4" />, detail: `${score?.mention_rate_pct ?? 0}% of queries` },
    { label: "Position Score", value: score?.position_score ?? 0, max: 20, icon: <TrendingUp className="h-4 w-4" />, detail: score?.avg_position ? `Avg rank` : "No data" },
    { label: "Capability Coverage", value: score?.capability_score ?? 0, max: 20, icon: <Layers className="h-4 w-4" />, detail: `${score?.capabilities_covered ?? 0}/12 capabilities` },
    { label: "Positioning Match", value: score?.positioning_score ?? 0, max: 15, icon: <Target className="h-4 w-4" />, detail: `${score?.positioning_match_pct ?? 0}% aligned` },
    { label: "Competitive Strength", value: score?.competitive_score ?? 0, max: 15, icon: <Shield className="h-4 w-4" />, detail: "vs competitors" },
  ];

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

      {/* ── POSITIONING SCORE HERO ── */}
      <AdminGlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Big score circle */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--admin-border)/0.2)" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="56" fill="none"
                stroke={interp.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(totalScore / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', sans-serif" }}>
                {totalScore}
              </span>
              <span className="text-xs text-[hsl(var(--admin-text-muted))]">/100</span>
            </div>
          </div>

          {/* Score details */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', sans-serif" }}>
              YANGU POSITIONING SCORE
            </h3>
            <Badge
              className="mt-1 text-white border-0"
              style={{ backgroundColor: interp.color }}>
              {interp.label}
            </Badge>
            <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
              Mentioned in {score?.mentioned_count ?? 0}/{score?.total_queries ?? 0} queries •{" "}
              {score?.capabilities_covered ?? 0}/12 capabilities recognized •{" "}
              {score?.positioning_match_pct ?? 0}% positioning alignment
            </p>
          </div>
        </div>

        {/* Component bars */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-6">
          {SCORE_COMPONENTS.map((c) => {
            const pct = c.max > 0 ? Math.round((c.value / c.max) * 100) : 0;
            return (
              <div key={c.label} className="bg-[hsl(var(--admin-border)/0.08)] rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {c.icon}
                  <span className="text-xs font-medium text-[hsl(var(--admin-text))] truncate">{c.label}</span>
                </div>
                <div className="text-xl font-bold text-[hsl(var(--admin-text))]" style={{ fontFamily: "'Lufga', sans-serif" }}>
                  {c.value}<span className="text-xs font-normal text-[hsl(var(--admin-text-muted))]">/{c.max}</span>
                </div>
                <div className="h-1.5 bg-[hsl(var(--admin-border)/0.2)] rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct > 70 ? "#22c55e" : pct > 40 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <p className="text-[10px] text-[hsl(var(--admin-text-muted))] mt-1">{c.detail}</p>
              </div>
            );
          })}
        </div>
      </AdminGlassCard>

      {/* ── Score Interpretation Legend ── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SCORE_LABELS).filter(([k]) => k !== "No data").map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[hsl(var(--admin-text-muted))]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.color }} />
            {val.label}
          </div>
        ))}
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
            {tracking.length === 0 && (
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
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-[hsl(var(--admin-card))]">
                  <tr className="text-left text-xs text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Mentioned</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Capabilities</th>
                    <th className="px-4 py-3">Sentiment</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--admin-border)/0.2)]">
                  {tracking.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-[hsl(var(--admin-text-muted))]">
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
                        <td className="px-4 py-3 text-[hsl(var(--admin-text))] max-w-[180px] truncate">{t.query}</td>
                        <td className="px-4 py-3">
                          {t.yangu_mentioned ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--admin-text))] font-semibold">
                          {t.yangu_mentioned && t.yangu_position ? `#${t.yangu_position}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-0.5">
                            {((t.capability_mentioned as string[]) ?? []).slice(0, 3).map((c: string) => (
                              <Badge key={c} variant="outline" className="text-[10px] px-1 py-0 border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))]">
                                {CAPABILITIES.find(cap => cap.key === c)?.icon ?? "·"}
                              </Badge>
                            ))}
                            {((t.capability_mentioned as string[]) ?? []).length > 3 && (
                              <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">
                                +{(t.capability_mentioned as string[]).length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${
                              t.sentiment === "positive" ? "border-emerald-500/40 text-emerald-500" :
                              t.sentiment === "negative" ? "border-red-500/40 text-red-500" :
                              t.sentiment === "mixed" ? "border-amber-500/40 text-amber-500" :
                              "border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]"
                            }`}>
                            {t.sentiment || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {t.positioning_match ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
                          )}
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
