import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle, Crown, Zap, Shield, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { YanguLoader } from "@/components/primitives/YanguLoader";

interface Props {
  projectId: string;
  onClose: () => void;
}

const SCORE_LABELS: Record<string, { label: string; color: string }> = {
  invisible: { label: "Invisible in AI", color: "text-destructive" },
  weak: { label: "Weak presence", color: "text-warning" },
  growing: { label: "Growing visibility", color: "text-warning" },
  strong: { label: "Strong positioning", color: "text-success" },
  dominant: { label: "Dominant AI presence", color: "text-success" },
};

function getScoreInfo(score: number) {
  if (score < 30) return SCORE_LABELS.invisible;
  if (score < 50) return SCORE_LABELS.weak;
  if (score < 70) return SCORE_LABELS.growing;
  if (score < 85) return SCORE_LABELS.strong;
  return SCORE_LABELS.dominant;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  shop: "shop",
  bio_page: "bio page",
  digital_products: "digital products",
  community: "community",
  influencer: "creator brand",
};

const AI_PLATFORMS = ["chatgpt", "perplexity", "gemini"];

function platformLabel(p: string) {
  const m: Record<string, string> = { chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini" };
  return m[p] || p;
}

export function AiVisibilityResults({ projectId, onClose }: Props) {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["user-ai-project", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_ai_visibility_projects" as any)
        .select("*")
        .eq("id", projectId)
        .single();
      return data as any;
    },
  });

  const { data: results = [], isLoading: resultsLoading, refetch } = useQuery({
    queryKey: ["user-ai-results", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_ai_visibility_results" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("tracked_at", { ascending: false })
        .limit(50);
      return (data || []) as any[];
    },
  });

  const runScan = async () => {
    setScanning(true);
    try {
      const { error } = await supabase.functions.invoke("ai-visibility-user-scan", {
        body: { projectId },
      });
      if (error) throw error;
      toast.success("Scan complete!");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  // Auto-trigger first scan
  const shouldScan = !resultsLoading && results.length === 0 && !scanning;
  if (shouldScan && project) {
    setTimeout(() => runScan(), 500);
  }

  const score = project?.score ?? 0;
  const scoreInfo = getScoreInfo(score);
  const businessType = project?.business_type || "shop";
  const businessLabel = BUSINESS_TYPE_LABELS[businessType] || businessType.replace("_", " ");
  const mentioned = results.filter((r: any) => r.business_mentioned);
  const mentionRate = results.length > 0 ? Math.round((mentioned.length / results.length) * 100) : 0;

  // Per-platform breakdown
  const platformSummary = AI_PLATFORMS.map((p) => {
    const platformResults = results.filter((r: any) => r.ai_platform === p);
    const mentionedInPlatform = platformResults.filter((r: any) => r.business_mentioned);
    const competitors = [...new Set(platformResults.flatMap((r: any) => r.competitors_mentioned || []))];
    const topQuery = platformResults[0]?.query || null;
    return {
      platform: p,
      scanned: platformResults.length > 0,
      totalQueries: platformResults.length,
      mentioned: mentionedInPlatform.length > 0,
      mentionCount: mentionedInPlatform.length,
      competitors: competitors.slice(0, 5),
      topQuery,
    };
  });

  // All competitors (already category-filtered by edge function)
  const allCompetitors = [...new Set(results.flatMap((r: any) => r.competitors_mentioned || []))];

  // Top query findings (source + query + result)
  const queryFindings = results.slice(0, 8).map((r: any) => ({
    platform: r.ai_platform,
    query: r.query,
    mentioned: r.business_mentioned,
    position: r.business_position,
    competitors: (r.competitors_mentioned || []).slice(0, 3),
    sentiment: r.sentiment,
  }));

  // Generate real quick fixes from scan gaps
  const quickFixes: string[] = [];
  if (mentionRate === 0) {
    quickFixes.push(`Create content targeting "${businessLabel}" queries to get mentioned by AI platforms`);
  } else if (mentionRate < 50) {
    quickFixes.push(`Improve content coverage — only appearing in ${mentionRate}% of ${businessLabel} queries`);
  }

  const missingPlatforms = platformSummary.filter((p) => p.scanned && !p.mentioned);
  if (missingPlatforms.length > 0) {
    quickFixes.push(`Not appearing on ${missingPlatforms.map((p) => platformLabel(p.platform)).join(", ")} — create platform-specific content`);
  }

  const region = project?.region;
  if (region === "africa" || region === "middle_east") {
    const regionLabel = region === "africa" ? "Africa" : "Middle East";
    quickFixes.push(`Add ${regionLabel}-specific positioning and market language to your content`);
  }

  if (allCompetitors.length > 2) {
    quickFixes.push(`Create comparison content against top competitors like ${allCompetitors.slice(0, 3).join(", ")}`);
  }

  const capabilitiesSeen = [...new Set(results.flatMap((r: any) => r.capability_mentioned || []))];
  if (capabilitiesSeen.length < 3) {
    quickFixes.push("Add AI builder / AI selling wording to your YANGU surface to improve capability recognition");
  }

  if (quickFixes.length === 0) {
    quickFixes.push("Keep publishing content and monitoring your visibility weekly");
  }

  const isLoading = projectLoading || resultsLoading || scanning;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-foreground font-semibold">AI Visibility Report</span>
          </div>
          <Button variant="outline" size="sm" onClick={runScan} disabled={scanning} className="text-xs">
            {scanning ? "Scanning..." : "Run Scan"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {isLoading && results.length === 0 ? (
          <YanguLoader
            statusText={scanning ? "Running AI visibility scan…" : "Loading results…"}
            state="loading"
            fullScreen={false}
          />
        ) : (
          <>
            {/* Score Card */}
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                AI Visibility Score for your {businessLabel}
              </p>
              <div className="text-6xl font-bold text-foreground mb-2">{score}</div>
              <div className="text-sm text-muted-foreground mb-1">/ 100</div>
              <span className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</span>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>Mention rate: {mentionRate}%</span>
                <span>•</span>
                <span>Queries scanned: {results.length}</span>
              </div>
            </div>

            {/* AI Sources Scanned */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" /> AI Sources Scanned
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {platformSummary.map((ps) => (
                  <div key={ps.platform} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{platformLabel(ps.platform)}</span>
                      {!ps.scanned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No data</span>
                      ) : ps.mentioned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">Mentioned</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Not mentioned</span>
                      )}
                    </div>
                    {ps.scanned && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{ps.totalQueries} queries scanned</p>
                        {ps.competitors.length > 0 && (
                          <p className="truncate">Top: {ps.competitors.slice(0, 3).join(", ")}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Query Findings */}
            {queryFindings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Search className="w-4 h-4" /> Top Query Findings
                </h3>
                <div className="space-y-2">
                  {queryFindings.map((qf, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                      {qf.mentioned ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-success mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{platformLabel(qf.platform)}:</span>{" "}
                          For "{qf.query}",{" "}
                          {qf.mentioned
                            ? qf.position
                              ? `you appeared at position #${qf.position}.`
                              : "you were mentioned."
                            : "you were not mentioned."}
                          {qf.competitors.length > 0 &&
                            ` ${qf.competitors.join(", ")} ${qf.mentioned ? "also " : ""}appeared.`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitors Found */}
            {allCompetitors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Competitors found in {businessLabel} queries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allCompetitors.slice(0, 12).map((c: string) => (
                    <span key={c} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Fixes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Quick fixes</h3>
              <div className="space-y-2">
                {quickFixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-warning mt-0.5" />
                    <p className="text-sm text-foreground">{fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monetization */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Grow your visibility</h3>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Free</span>
                  <span className="text-xs text-muted-foreground ml-auto">Current plan</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 1 scan</li>
                  <li>• Limited insights</li>
                </ul>
              </div>

              <div className="rounded-xl border border-accent/50 bg-accent/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">Track & grow your AI visibility</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>• Weekly automated scans</li>
                  <li>• Full visibility dashboard</li>
                  <li>• Competitor tracking</li>
                  <li>• Capability breakdown</li>
                  <li>• Email reports</li>
                </ul>
                <Button variant="accent" className="w-full" onClick={() => navigate("/dashboard/profile/subscription")}>
                  Upgrade to Pro
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">We improve your visibility for you</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                  <li>• Content creation</li>
                  <li>• AI optimization</li>
                  <li>• Strategy & consulting</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Request growth service
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
