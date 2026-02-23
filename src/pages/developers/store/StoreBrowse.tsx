import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocsPage } from "@/components/developers/DocsPage";
import { Store, Loader2, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreBrowse() {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["app-store-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DocsPage breadcrumb="Developers" title="App Store" subtitle="Browse apps built by the community and verified by yangu.">
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => navigate(`/developers/store/${listing.slug}`)}
              className="text-left rounded-xl p-5 transition-colors hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {listing.icon_url ? (
                <img src={listing.icon_url} alt="" className="w-10 h-10 rounded-lg mb-3" />
              ) : (
                <Puzzle className="w-10 h-10 mb-3" style={{ color: "#F46D2A" }} />
              )}
              <h3 className="text-white font-semibold text-sm mb-1">{listing.name}</h3>
              <p className="text-xs text-white/40">{listing.summary || "No description"}</p>
              {listing.category && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">{listing.category}</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Store className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No apps published yet. Be the first to submit one.</p>
          <Button variant="accent" onClick={() => navigate("/developers/console/submissions/new")} className="mt-4">
            Submit an App
          </Button>
        </div>
      )}
    </DocsPage>
  );
}
