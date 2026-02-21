import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocsPage, PlaceholderBlock } from "@/components/developers/DocsPage";
import { Puzzle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreListing() {
  const { appSlug } = useParams<{ appSlug: string }>();
  const navigate = useNavigate();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["store-listing", appSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*")
        .eq("slug", appSlug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!appSlug,
  });

  if (isLoading) {
    return (
      <DocsPage breadcrumb="App Store" title="Loading..." subtitle="">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </DocsPage>
    );
  }

  if (!listing) {
    return (
      <DocsPage breadcrumb="App Store" title="App not found" subtitle="This listing doesn't exist or isn't published.">
        <Button variant="ghost" size="sm" onClick={() => navigate("/developers/store")} className="text-white/50">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Button>
      </DocsPage>
    );
  }

  return (
    <DocsPage breadcrumb="App Store" title={listing.name} subtitle={listing.summary || ""}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/developers/store")} className="text-white/50 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Button>

      <div className="flex items-start gap-6 mb-8">
        {listing.icon_url ? (
          <img src={listing.icon_url} alt="" className="w-16 h-16 rounded-xl" />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,109,42,0.1)" }}>
            <Puzzle className="w-8 h-8" style={{ color: "#F46D2A" }} />
          </div>
        )}
        <div>
          {listing.category && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 mb-2 inline-block">{listing.category}</span>}
          <p className="text-sm text-white/50 mt-2">{listing.description || listing.summary || "No detailed description."}</p>
          <p className="text-xs text-white/30 mt-2">Pricing: {listing.pricing_model || "free"}</p>
        </div>
      </div>

      {listing.screenshots && listing.screenshots.length > 0 && (
        <div className="mb-8">
          <h3 className="text-white/70 text-sm font-semibold mb-3">Screenshots</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {listing.screenshots.map((url, i) => (
              <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      <PlaceholderBlock title="Install flow" items={["One-click install to your surface", "Permission scope review", "Configuration wizard", "Uninstall and data cleanup"]} />
    </DocsPage>
  );
}
