import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Puzzle, Code2, ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS: Record<string, string> = {
  ai_tool: "AI tool",
  shop_plugin: "Shop plugin",
  community_addon: "Community add-on",
  other: "Other",
};

export default function Marketplace() {
  const navigate = useNavigate();

  const { data: apps, isLoading } = useQuery({
    queryKey: ["public-marketplace-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_apps")
        .select("id, name, slug, description, category, github_url, demo_url, created_at")
        .eq("review_status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-accent" />
              <span className="text-[10px] uppercase tracking-widest text-accent/80">Yangu App Marketplace</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
              Apps built by the Yangu community
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Browse approved developer apps — AI tools, shop plugins, community add-ons and more.
              All apps have been reviewed by the Yangu team.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate("/developers/portal")}>
              <Code2 className="w-4 h-4" /> Build an app
            </Button>
            <Button variant="accent" onClick={() => navigate("/developers/portal/apps")}>
              Submit your app
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : apps && apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app: any) => (
              <article
                key={app.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <Puzzle className="w-9 h-9 text-accent" />
                  {app.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                      {CATEGORY_LABELS[app.category] || app.category}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{app.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {app.description || "No description provided."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 mt-auto">
                  {app.demo_url && (
                    <a
                      href={app.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs inline-flex items-center gap-1 text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" /> Demo
                    </a>
                  )}
                  {app.github_url && (
                    <a
                      href={app.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:underline">
                      <ExternalLink className="w-3 h-3" /> Source
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-16 text-center">
            <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-foreground font-semibold mb-1">No apps yet</h2>
            <p className="text-sm text-muted-foreground mb-5">
              The marketplace is just getting started. Be the first to ship.
            </p>
            <Button variant="accent" onClick={() => navigate("/developers/portal/apps")}>
              Submit your app
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}