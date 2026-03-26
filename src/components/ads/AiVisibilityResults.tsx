import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle, Crown, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  projectId: string;
  onClose: () => void;
}

const SCORE_LABELS: Record<string, { label: string; color: string }> = {
  invisible: { label: "Invisible in AI", color: "text-red-400" },
  weak: { label: "Weak presence", color: "text-orange-400" },
  growing: { label: "Growing visibility", color: "text-yellow-400" },
  strong: { label: "Strong positioning", color: "text-green-400" },
  dominant: { label: "Dominant AI presence", color: "text-emerald-400" },
};

function getScoreInfo(score: number) {
  if (score < 30) return SCORE_LABELS.invisible;
  if (score < 50) return SCORE_LABELS.weak;
  if (score < 70) return SCORE_LABELS.growing;
  if (score < 85) return SCORE_LABELS.strong;
  return SCORE_LABELS.dominant;
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

  // If no results yet, trigger a scan
  const shouldScan = !resultsLoading && results.length === 0 && !scanning;

  if (shouldScan && project) {
    // Auto-trigger first scan
    setTimeout(() => runScan(), 500);
  }

  const score = project?.score ?? 0;
  const scoreInfo = getScoreInfo(score);
  const mentioned = results.filter((r: any) => r.business_mentioned);
  const mentionRate = results.length > 0 ? Math.round((mentioned.length / results.length) * 100) : 0;
  const competitors = [...new Set(results.flatMap((r: any) => r.competitors_mentioned || []))];
  const notMentioned = results.filter((r: any) => !r.business_mentioned);

  const isLoading = projectLoading || resultsLoading || scanning;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-foreground font-semibold">AI Visibility Report</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runScan}
            disabled={scanning}
            className="text-xs"
          >
            {scanning ? "Scanning..." : "Run Scan"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {isLoading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">
              {scanning ? "Running AI visibility scan..." : "Loading results..."}
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">This may take a moment</p>
          </div>
        ) : (
          <>
            {/* Score Card */}
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {project?.business_name || "Your business"} visibility score
              </p>
              <div className="text-6xl font-bold text-foreground mb-2">{score}</div>
              <div className="text-sm text-muted-foreground mb-1">/ 100</div>
              <span className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</span>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Insights</h3>
              <div className="space-y-2">
                {mentionRate === 0 ? (
                  <InsightRow icon={XCircle} color="text-red-400" text="Not appearing in AI search results" />
                ) : mentionRate < 50 ? (
                  <InsightRow icon={AlertTriangle} color="text-orange-400" text={`Appearing in only ${mentionRate}% of relevant queries`} />
                ) : (
                  <InsightRow icon={CheckCircle} color="text-green-400" text={`Appearing in ${mentionRate}% of relevant queries`} />
                )}
                {competitors.length > 0 && (
                  <InsightRow icon={AlertTriangle} color="text-orange-400" text={`${competitors.length} competitors dominate results`} />
                )}
                {notMentioned.length > 0 && (
                  <InsightRow icon={XCircle} color="text-red-400" text={`Missing from ${notMentioned.length} key queries`} />
                )}
              </div>
            </div>

            {/* Competitors */}
            {competitors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Competitors found</h3>
                <div className="flex flex-wrap gap-2">
                  {competitors.slice(0, 10).map((c: string) => (
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
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Create content targeting "{project?.business_type?.replace("_", " ")}" queries</p>
                <p>• Improve positioning for {project?.region === "africa" ? "African" : project?.region === "middle_east" ? "Middle Eastern" : "global"} market</p>
                <p>• Add capability descriptions to your YANGU surface</p>
                <p>• Build comparison content vs top competitors</p>
              </div>
            </div>

            {/* Monetization */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Grow your visibility</h3>

              {/* Free tier info */}
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

              {/* Pro */}
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

              {/* Done for you */}
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

function InsightRow({ icon: Icon, color, text }: { icon: any; color: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
