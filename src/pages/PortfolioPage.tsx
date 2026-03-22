import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageIcon } from "lucide-react";

export default function PortfolioPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["portfolio-project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_projects")
        .select("id, title, brand_name, brand_description, album_published, album_slug")
        .eq("album_slug", slug)
        .eq("album_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ["portfolio-assets", project?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_assets")
        .select("id, title, file_url, thumbnail_url, asset_type, created_at")
        .eq("project_id", project!.id)
        .order("variation_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!project?.id,
  });

  if (loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <ImageIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Portfolio Not Found</h1>
        <p className="text-muted-foreground">
          This portfolio doesn't exist or hasn't been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">
            {project.brand_name || project.title}
          </h1>
          {project.brand_description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {project.brand_description}
            </p>
          )}
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loadingAssets ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !assets?.length ? (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No assets in this portfolio yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl overflow-hidden border border-border/40 bg-card group">
                <div className="aspect-square bg-muted/20 relative">
                  {asset.file_url || asset.thumbnail_url ? (
                    <img
                      src={asset.thumbnail_url || asset.file_url || ""}
                      alt={asset.title || "Asset"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {asset.title && (
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-foreground truncate">
                      {asset.title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Created with Yangu Studio
        </p>
      </footer>
    </div>
  );
}
