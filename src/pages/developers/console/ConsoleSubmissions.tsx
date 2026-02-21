import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Send, Plus, Loader2, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/50",
  submitted: "bg-blue-500/10 text-blue-400",
  in_review: "bg-yellow-500/10 text-yellow-400",
  auto_approved: "bg-emerald-500/10 text-emerald-400",
  auto_rejected: "bg-red-500/10 text-red-400",
  needs_manual_review: "bg-orange-500/10 text-orange-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  published: "bg-emerald-500/10 text-emerald-400",
  suspended: "bg-red-500/10 text-red-300",
  appeal_submitted: "bg-purple-500/10 text-purple-400",
  in_manual_review: "bg-yellow-500/10 text-yellow-400",
};

const statusLabels: Record<string, string> = {
  auto_approved: "Auto-Approved",
  auto_rejected: "Auto-Rejected",
  needs_manual_review: "Needs Manual Review",
  appeal_submitted: "Appeal Submitted",
  in_manual_review: "In Manual Review",
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
        <Button variant="accent" onClick={() => navigate("/developers/console/submissions/new")}>
          <Plus className="w-4 h-4" /> New Submission
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
      ) : listings && listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing) => (
            <SubmissionCard key={listing.id} listing={listing} />
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

function SubmissionCard({ listing }: { listing: any }) {
  const [showReasons, setShowReasons] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);
  const canAppeal = listing.status === "auto_rejected" || listing.status === "rejected";

  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">{listing.name}</h3>
          <p className="text-xs text-white/40 mt-1">{listing.summary || "No summary"}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[listing.status] || "bg-white/10 text-white/40"}`}>
          {statusLabels[listing.status] || listing.status}
        </span>
      </div>

      {listing.status === "needs_manual_review" && (
        <div className="mt-3 rounded-lg p-3 flex items-start gap-2" style={{ background: "rgba(244,109,42,0.06)", border: "1px solid rgba(244,109,42,0.15)" }}>
          <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-300">Your submission requires manual review. This may take a few business days.</p>
        </div>
      )}

      {listing.status === "appeal_submitted" && (
        <div className="mt-3 rounded-lg p-3 flex items-start gap-2" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
          <p className="text-xs text-purple-300">Your appeal has been submitted and is awaiting review.</p>
        </div>
      )}

      {listing.review_notes && (
        <p className="text-xs text-white/40 mt-3 italic border-t border-white/5 pt-3">Review: {listing.review_notes}</p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <ReviewReasonsButton listingId={listing.id} showReasons={showReasons} setShowReasons={setShowReasons} />
        {canAppeal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAppeal(!showAppeal)}
            className="text-purple-400 hover:text-purple-300 text-xs"
          >
            {showAppeal ? "Cancel" : "Appeal"}
          </Button>
        )}
      </div>

      {showReasons && <ReviewReasons listingId={listing.id} />}
      {showAppeal && <AppealForm listingId={listing.id} onSubmitted={() => setShowAppeal(false)} />}
    </div>
  );
}

function ReviewReasonsButton({ listingId, showReasons, setShowReasons }: { listingId: string; showReasons: boolean; setShowReasons: (v: boolean) => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowReasons(!showReasons)}
      className="text-white/50 text-xs"
    >
      {showReasons ? "Hide Details" : "View Review Details"}
    </Button>
  );
}

function ReviewReasons({ listingId }: { listingId: string }) {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["review-runs", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_review_runs")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2 className="w-4 h-4 text-white/30 animate-spin mt-3" />;
  if (!runs || runs.length === 0) return <p className="text-xs text-white/30 mt-3">No review data yet.</p>;

  const latest = runs[0];
  const reasons = (latest.reasons as any[]) || [];

  return (
    <div className="mt-3 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/50">
          {latest.mode === "auto" ? "Automated Review" : "Manual Review"} • Score: {latest.score}/100
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[latest.decision] || "bg-white/10 text-white/40"}`}>
          {statusLabels[latest.decision] || latest.decision}
        </span>
      </div>
      {reasons.length > 0 ? (
        <div className="space-y-2">
          {reasons.map((r: any, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                r.severity === "critical" ? "bg-red-500/10 text-red-400" :
                r.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}>{r.severity}</span>
              <div>
                <p className="text-xs text-white/70 font-medium">{r.title}</p>
                <p className="text-xs text-white/40">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/30">No issues found.</p>
      )}
    </div>
  );
}

function AppealForm({ listingId, onSubmitted }: { listingId: string; onSubmitted: () => void }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState("");

  const submitAppeal = useMutation({
    mutationFn: async () => {
      const evidenceLinks = links.split("\n").map((l) => l.trim()).filter(Boolean);
      const { error } = await supabase.rpc("submit_appeal", {
        p_listing_id: listingId,
        p_message: message,
        p_evidence_links: evidenceLinks,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appeal submitted");
      queryClient.invalidateQueries({ queryKey: ["my-app-listings"] });
      onSubmitted();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mt-3 rounded-lg p-4" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.12)" }}>
      <h4 className="text-xs text-white/70 font-semibold mb-2">Submit Appeal</h4>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Explain why you believe this decision should be reconsidered..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-sm text-white/90 mb-2"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
      />
      <textarea
        value={links}
        onChange={(e) => setLinks(e.target.value)}
        placeholder="Supporting links (one per line, optional)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm text-white/90 mb-3 font-mono"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
      />
      <Button
        variant="accent"
        size="sm"
        onClick={() => submitAppeal.mutate()}
        disabled={!message.trim() || submitAppeal.isPending}
      >
        {submitAppeal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit Appeal"}
      </Button>
    </div>
  );
}
