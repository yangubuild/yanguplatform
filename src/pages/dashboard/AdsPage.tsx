import { useState } from "react";
import { Sparkles, Megaphone, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/components/ads/CampaignWizard";
import { AiVisibilityWizard } from "@/components/ads/AiVisibilityWizard";
import { AiVisibilityResults } from "@/components/ads/AiVisibilityResults";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TABS = ["AI Visibility", "Campaigns", "Creatives", "Audiences", "Connections"] as const;

export default function AdsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("AI Visibility");
  const [showWizard, setShowWizard] = useState(false);
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Check for existing AI visibility projects
  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ["user-ai-vis-projects", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_ai_visibility_projects" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  if (showCampaignWizard) {
    return <CampaignWizard onClose={() => setShowCampaignWizard(false)} />;
  }

  if (showWizard) {
    return (
      <AiVisibilityWizard
        onClose={() => setShowWizard(false)}
        onComplete={(id) => {
          setShowWizard(false);
          setActiveProjectId(id);
          refetchProjects();
        }}
      />
    );
  }

  if (activeProjectId) {
    return (
      <AiVisibilityResults
        projectId={activeProjectId}
        onClose={() => {
          setActiveProjectId(null);
          refetchProjects();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-foreground">Ads</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/dashboard/promo-codes"}
              className="px-5 h-10"
            >
              <Tag className="w-4 h-4 mr-2" />
              Promo Codes
            </Button>
            <Button
              variant="accent"
              onClick={() => setShowCampaignWizard(true)}
              className="px-5 h-10"
            >
              Launch new campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-border pb-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* AI Visibility Tab */}
        {activeTab === "AI Visibility" && (
          <>
            {projects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Your AI visibility projects</h2>
                  <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
                    + New check
                  </Button>
                </div>
                {projects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProjectId(p.id)}
                    className="w-full rounded-xl border border-border bg-card p-5 text-left hover:border-accent/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{p.business_name}</span>
                      <span className={`text-2xl font-bold ${
                        (p.score ?? 0) < 30 ? "text-red-400" :
                        (p.score ?? 0) < 50 ? "text-orange-400" :
                        (p.score ?? 0) < 70 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {p.score ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{p.business_type?.replace("_", " ")}</span>
                      <span>•</span>
                      <span className="capitalize">{p.region?.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{p.scan_count || 0} scans</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-8 bg-accent/10">
                  <Sparkles className="w-16 h-16 text-accent/60" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Boost your visibility on AI platforms
                </h2>
                <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
                  See how ChatGPT, Google AI, and others present your business. Get discovered by millions.
                </p>
                <Button variant="accent" onClick={() => setShowWizard(true)} className="px-6 h-11">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run AI Visibility Check
                </Button>
              </div>
            )}
          </>
        )}

        {/* Other tabs — empty state */}
        {activeTab !== "AI Visibility" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-32 h-32 rounded-2xl flex items-center justify-center mb-8 bg-accent/10">
              <Megaphone className="w-16 h-16 text-accent/60" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Reach millions through YANGU ads
            </h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
              Target high intent users via search, explore, and platform surfaces
            </p>
            <Button variant="accent" onClick={() => setShowCampaignWizard(true)} className="px-6 h-11">
              Launch new campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
