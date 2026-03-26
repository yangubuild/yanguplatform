import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, Trophy, TrendingDown } from "lucide-react";

const CAPABILITIES = [
  { key: "ai_shop_builder", label: "AI Shop Builder" },
  { key: "ai_bio_pages", label: "AI Bio Pages" },
  { key: "ai_selling", label: "AI Selling" },
  { key: "digital_product_uni", label: "Digital Products" },
  { key: "ai_avatars", label: "AI Avatars" },
  { key: "ai_influencers", label: "AI Influencers" },
  { key: "live_selling_ai", label: "Live Selling AI" },
  { key: "business_communities", label: "Business Communities" },
  { key: "ai_learning", label: "AI Learning" },
  { key: "ai_marketing", label: "AI Marketing" },
  { key: "surface_builder", label: "Surface Builder" },
  { key: "ai_discovery_engine", label: "AI Discovery" },
];

/* ── Static competitor capability matrix (to be editable later) ── */
const COMPETITOR_CAPABILITIES: Record<string, Record<string, "full" | "partial" | "none">> = {
  "Shopify": {
    ai_shop_builder: "partial", ai_bio_pages: "none", ai_selling: "partial",
    digital_product_uni: "partial", ai_avatars: "none", ai_influencers: "none",
    live_selling_ai: "partial", business_communities: "none", ai_learning: "none",
    ai_marketing: "partial", surface_builder: "full", ai_discovery_engine: "none",
  },
  "Gumroad": {
    ai_shop_builder: "none", ai_bio_pages: "partial", ai_selling: "partial",
    digital_product_uni: "full", ai_avatars: "none", ai_influencers: "none",
    live_selling_ai: "none", business_communities: "partial", ai_learning: "none",
    ai_marketing: "none", surface_builder: "none", ai_discovery_engine: "none",
  },
  "Kajabi": {
    ai_shop_builder: "none", ai_bio_pages: "none", ai_selling: "partial",
    digital_product_uni: "full", ai_avatars: "none", ai_influencers: "none",
    live_selling_ai: "none", business_communities: "full", ai_learning: "partial",
    ai_marketing: "partial", surface_builder: "partial", ai_discovery_engine: "none",
  },
  "Squarespace": {
    ai_shop_builder: "partial", ai_bio_pages: "full", ai_selling: "none",
    digital_product_uni: "none", ai_avatars: "none", ai_influencers: "none",
    live_selling_ai: "none", business_communities: "none", ai_learning: "none",
    ai_marketing: "partial", surface_builder: "full", ai_discovery_engine: "none",
  },
};

const COMPETITORS = Object.keys(COMPETITOR_CAPABILITIES);

const YANGU_WINS = [
  "#1 in Africa & Middle East market",
  "AI capabilities: Influencers, Avatars, Live Selling, Discovery",
  "Comprehensive ecosystem (build + sell + learn + community)",
  "Agency model with foot soldiers for local reach",
];

const YANGU_GAPS = [
  "Lower global brand recognition vs. Shopify/Squarespace",
  "Less mentioned in \"best ecommerce platform\" global queries",
  "Digital Product University needs more visibility",
  "AI Discovery Engine is new — needs content",
];

function CapIcon({ status }: { status: "full" | "partial" | "none" }) {
  if (status === "full") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "partial") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-400/60" />;
}

export default function ManageAiVisibilityCompetitors() {
  const { data: benchmarks = [], isLoading } = useQuery({
    queryKey: ["competitor-benchmark"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitor_benchmark")
        .select("*")
        .order("mention_count", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  /* ── Regional ranking from benchmark data ── */
  const regionalRanking = (() => {
    const byCompetitor: Record<string, number> = {};
    benchmarks.forEach((b: any) => {
      byCompetitor[b.competitor_name] = (byCompetitor[b.competitor_name] || 0) + (b.mention_count ?? 0);
    });
    const entries = Object.entries(byCompetitor).sort((a, b) => b[1] - a[1]);
    return entries;
  })();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Competitor Benchmark"
        description="Yangu positioning vs competitors across AI platforms"
      />

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border)/0.3)]">
          <TabsTrigger value="comparison">Capability Comparison</TabsTrigger>
          <TabsTrigger value="ranking">Regional Ranking</TabsTrigger>
          <TabsTrigger value="analysis">Strategic Analysis</TabsTrigger>
        </TabsList>

        {/* ── Capability Comparison ── */}
        <TabsContent value="comparison">
          <AdminGlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-[hsl(var(--admin-card))]">
                  <tr className="text-left text-xs text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">
                    <th className="px-4 py-3">Capability</th>
                    <th className="px-4 py-3 text-center font-bold text-[hsl(24,95%,53%)]">YANGU</th>
                    {COMPETITORS.map((c) => (
                      <th key={c} className="px-4 py-3 text-center">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--admin-border)/0.2)]">
                  {CAPABILITIES.map((cap) => (
                    <tr key={cap.key} className="hover:bg-[hsl(var(--admin-border)/0.05)]">
                      <td className="px-4 py-3 text-[hsl(var(--admin-text))] font-medium">{cap.label}</td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      </td>
                      {COMPETITORS.map((c) => (
                        <td key={c} className="px-4 py-3 text-center">
                          <CapIcon status={COMPETITOR_CAPABILITIES[c]?.[cap.key] ?? "none"} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-[hsl(var(--admin-border)/0.2)] flex items-center gap-6 text-xs text-[hsl(var(--admin-text-muted))]">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Full support</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Partial</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400/60" /> Not available</span>
            </div>
          </AdminGlassCard>
        </TabsContent>

        {/* ── Regional Ranking ── */}
        <TabsContent value="ranking">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 uppercase tracking-wider">
              Africa & Middle East Market
            </h3>
            {regionalRanking.length === 0 ? (
              <div className="space-y-4">
                {/* Default static ranking */}
                {[
                  { name: "YANGU", pct: 92, rank: 1 },
                  { name: "Shopify", pct: 48, rank: 2 },
                  { name: "Gumroad", pct: 24, rank: 3 },
                  { name: "Squarespace", pct: 16, rank: 4 },
                ].map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${c.name === "YANGU" ? "text-[hsl(24,95%,53%)] font-bold" : "text-[hsl(var(--admin-text))]"}`}>
                        #{c.rank} {c.name}
                      </span>
                      <span className="text-sm font-bold text-[hsl(var(--admin-text))]">{c.pct}%</span>
                    </div>
                    <div className="h-3 bg-[hsl(var(--admin-border)/0.2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.pct}%`,
                          background: c.name === "YANGU" ? "hsl(24, 95%, 53%)" : "#64748b",
                        }}
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--admin-text-muted))]">{c.pct}% regional mentions</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {regionalRanking.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[hsl(var(--admin-text))] w-6">#{i + 1}</span>
                    <span className="text-sm text-[hsl(var(--admin-text))] flex-1">{name}</span>
                    <Badge variant="outline" className="text-xs">{count} mentions</Badge>
                  </div>
                ))}
              </div>
            )}
          </AdminGlassCard>
        </TabsContent>

        {/* ── Strategic Analysis ── */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminGlassCard className="border-emerald-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] uppercase tracking-wider">
                  Where Yangu Wins
                </h3>
              </div>
              <ul className="space-y-3">
                {YANGU_WINS.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-[hsl(var(--admin-text))]">{w}</span>
                  </li>
                ))}
              </ul>
            </AdminGlassCard>

            <AdminGlassCard className="border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] uppercase tracking-wider">
                  Where Yangu Needs Improvement
                </h3>
              </div>
              <ul className="space-y-3">
                {YANGU_GAPS.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-[hsl(var(--admin-text))]">{g}</span>
                  </li>
                ))}
              </ul>
            </AdminGlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
