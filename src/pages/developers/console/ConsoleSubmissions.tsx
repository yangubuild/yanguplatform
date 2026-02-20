import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Send, Plus, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/50",
  submitted: "bg-blue-500/10 text-blue-400",
  in_review: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  published: "bg-emerald-500/10 text-emerald-400",
  suspended: "bg-red-500/10 text-red-300",
};

export default function ConsoleSubmissions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-app-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*, developer_apps!inner(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <DocsPage breadcrumb="Console" title="Submissions" subtitle="Track your App Store submissions and their review status.">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/developers/console/submissions/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F46D2A, #d45a1f)" }}
        >
          <Plus className="w-4 h-4" /> New Submission
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
      ) : listings && listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm">{listing.name}</h3>
                  <p className="text-xs text-white/40 mt-1">{listing.summary || "No summary"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[listing.status] || "bg-white/10 text-white/40"}`}>
                  {listing.status}
                </span>
              </div>
              {listing.review_notes && (
                <p className="text-xs text-white/40 mt-3 italic border-t border-white/5 pt-3">Review: {listing.review_notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Send className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No submissions yet. Submit your first app.</p>
        </div>
      )}
    </DocsPage>
  );
}
