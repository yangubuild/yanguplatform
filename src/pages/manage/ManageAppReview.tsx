import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertTriangle, Check, X, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type QueueTab = "submitted" | "needs_review" | "appeals" | "approved";

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-400",
  auto_approved: "bg-emerald-500/10 text-emerald-400",
  auto_rejected: "bg-red-500/10 text-red-400",
  needs_manual_review: "bg-orange-500/10 text-orange-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  published: "bg-emerald-500/10 text-emerald-400",
  suspended: "bg-red-500/10 text-red-300",
  appeal_submitted: "bg-purple-500/10 text-purple-400",
  in_manual_review: "bg-yellow-500/10 text-yellow-400",
  in_review: "bg-yellow-500/10 text-yellow-400",
};

const tabFilters: Record<QueueTab, string[]> = {
  submitted: ["submitted", "in_review"],
  needs_review: ["needs_manual_review", "in_manual_review", "auto_rejected"],
  appeals: ["appeal_submitted"],
  approved: ["approved", "auto_approved"],
};

export default function ManageAppReview() {
  const [activeTab, setActiveTab] = useState<QueueTab>("submitted");
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*, developer_apps!inner(name, slug, org_id)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = listings?.filter((l) => tabFilters[activeTab].includes(l.status)) || [];
  const tabs: { id: QueueTab; label: string; count: number }[] = [
    { id: "submitted", label: "Submitted", count: listings?.filter((l) => tabFilters.submitted.includes(l.status)).length || 0 },
    { id: "needs_review", label: "Needs Review", count: listings?.filter((l) => tabFilters.needs_review.includes(l.status)).length || 0 },
    { id: "appeals", label: "Appeals", count: listings?.filter((l) => tabFilters.appeals.includes(l.status)).length || 0 },
    { id: "approved", label: "Ready to Publish", count: listings?.filter((l) => tabFilters.approved.includes(l.status)).length || 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">App Review Queue</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedListing(null); }}
            className="px-4 py-2.5 text-sm transition-colors rounded-t-lg flex items-center gap-2"
            style={{
              color: activeTab === tab.id ? "#F46D2A" : "rgba(255,255,255,0.5)",
              background: activeTab === tab.id ? "rgba(244,109,42,0.08)" : "transparent",
              borderBottom: activeTab === tab.id ? "2px solid #F46D2A" : "2px solid transparent",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-white/30 animate-spin" /></div>
      ) : selectedListing ? (
        <ReviewDetail listingId={selectedListing} onBack={() => setSelectedListing(null)} />
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              onClick={() => setSelectedListing(listing.id)}
              className="rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-sm font-semibold">{listing.name}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    {(listing.developer_apps as any)?.name} • {listing.category || "No category"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ScopeRiskSummary appId={listing.app_id} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[listing.status] || "bg-white/10 text-white/40"}`}>
                    {listing.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-sm text-center py-8">No items in this queue.</p>
      )}
    </div>
  );
}

function ScopeRiskSummary({ appId }: { appId: string }) {
  const { data: scopes } = useQuery({
    queryKey: ["admin-app-scopes", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_scopes")
        .select("scope_key, status, developer_scope_registry!inner(risk_level)")
        .eq("app_id", appId);
      if (error) throw error;
      return data;
    },
  });

  const highRisk = scopes?.filter((s) => (s.developer_scope_registry as any)?.risk_level === "high").length || 0;
  if (highRisk === 0) return null;

  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" /> {highRisk} high-risk
    </span>
  );
}

function ReviewDetail({ listingId, onBack }: { listingId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: listing } = useQuery({
    queryKey: ["admin-listing-detail", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*, developer_apps!inner(name, slug, org_id)")
        .eq("id", listingId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: scopes } = useQuery({
    queryKey: ["admin-listing-scopes", listing?.app_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_scopes")
        .select("*, developer_scope_registry!inner(*)")
        .eq("app_id", listing!.app_id);
      if (error) throw error;
      return data;
    },
    enabled: !!listing?.app_id,
  });

  const { data: runs } = useQuery({
    queryKey: ["admin-review-runs", listingId],
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

  const { data: appeals } = useQuery({
    queryKey: ["admin-appeals", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_review_appeals")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const runAutoReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("run_auto_review", { p_listing_id: listingId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Auto-review complete");
      queryClient.invalidateQueries({ queryKey: ["admin-listing-detail", listingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-review-runs", listingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setReviewState = useMutation({
    mutationFn: async (newState: string) => {
      if (newState === "rejected" && !notes.trim()) {
        throw new Error("Notes required for rejection");
      }
      const { error } = await supabase.rpc("set_listing_review_state", {
        p_listing_id: listingId,
        p_new_state: newState,
        p_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("State updated");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-listing-detail", listingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-review-runs", listingId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishListing = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("publish_app_listing", { p_listing_id: listingId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing published!");
      queryClient.invalidateQueries({ queryKey: ["admin-listing-detail", listingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!listing) return <Loader2 className="w-5 h-5 text-white/30 animate-spin" />;

  const latestRun = runs?.[0];
  const latestReasons = (latestRun?.reasons as any[]) || [];

  return (
    <div>
      <button onClick={onBack} className="text-sm text-white/50 hover:text-white/70 mb-4">← Back to queue</button>

      {/* Listing info */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-bold">{listing.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[listing.status] || ""}`}>{listing.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-white/40">App:</span> <span className="text-white/70">{(listing.developer_apps as any)?.name}</span></div>
          <div><span className="text-white/40">Category:</span> <span className="text-white/70">{listing.category || "—"}</span></div>
          <div><span className="text-white/40">Pricing:</span> <span className="text-white/70">{listing.pricing_model || "free"}</span></div>
          <div><span className="text-white/40">Slug:</span> <span className="text-white/70 font-mono">{listing.slug}</span></div>
        </div>
        {listing.summary && <p className="text-xs text-white/50 mt-3">{listing.summary}</p>}
      </div>

      {/* Scopes requested */}
      {scopes && scopes.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Requested Scopes</h3>
          <div className="space-y-1">
            {scopes.map((s) => {
              const reg = s.developer_scope_registry as any;
              return (
                <div key={s.scope_key} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <code className="text-white/70 font-mono">{s.scope_key}</code>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[`${reg?.risk_level === 'high' ? 'auto_rejected' : reg?.risk_level === 'medium' ? 'needs_manual_review' : 'auto_approved'}`] || ""}`}>
                      {reg?.risk_level}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[s.status === 'granted' ? 'approved' : s.status === 'denied' ? 'rejected' : 'submitted'] || ""}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest auto-review */}
      {latestRun && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-white text-sm font-semibold mb-2">Latest Review (Score: {latestRun.score}/100)</h3>
          {latestReasons.length > 0 ? (
            <div className="space-y-2">
              {latestReasons.map((r: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                    r.severity === "critical" ? "bg-red-500/10 text-red-400" :
                    r.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>{r.severity}</span>
                  <div>
                    <p className="text-white/70 font-medium">{r.title}</p>
                    <p className="text-white/40">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-400">No issues found.</p>
          )}
        </div>
      )}

      {/* Appeals */}
      {appeals && appeals.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.12)" }}>
          <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-400" /> Appeals</h3>
          {appeals.map((a) => (
            <div key={a.id} className="mb-3 last:mb-0">
              <p className="text-xs text-white/70">{a.message}</p>
              {a.evidence_links && (a.evidence_links as string[]).length > 0 && (
                <div className="mt-1">
                  {(a.evidence_links as string[]).map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline block">{link}</a>
                  ))}
                </div>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${statusColors[a.status] || ""}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Admin actions */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
        <h3 className="text-white text-sm font-semibold mb-3">Admin Actions</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Review notes (required for rejection)..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm text-white/90 mb-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
        />
        <div className="flex flex-wrap gap-2">
          {listing.status === "submitted" && (
            <ActionButton label="Run Auto-Review" onClick={() => runAutoReview.mutate()} isPending={runAutoReview.isPending} />
          )}
          <ActionButton label="In Review" onClick={() => setReviewState.mutate("in_review")} isPending={setReviewState.isPending} />
          <ActionButton label="In Manual Review" onClick={() => setReviewState.mutate("in_manual_review")} isPending={setReviewState.isPending} />
          <ActionButton label="Approve" onClick={() => setReviewState.mutate("approved")} isPending={setReviewState.isPending} variant="success" />
          <ActionButton label="Reject" onClick={() => setReviewState.mutate("rejected")} isPending={setReviewState.isPending} variant="danger" />
          {(listing.status === "approved" || listing.status === "auto_approved") && (
            <ActionButton label="Publish" onClick={() => publishListing.mutate()} isPending={publishListing.isPending} variant="primary" />
          )}
          <ActionButton label="Suspend" onClick={() => setReviewState.mutate("suspended")} isPending={setReviewState.isPending} variant="danger" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, isPending, variant }: {
  label: string; onClick: () => void; isPending: boolean; variant?: "success" | "danger" | "primary";
}) {
  const bg = variant === "success" ? "rgba(34,197,94,0.15)" :
    variant === "danger" ? "rgba(239,68,68,0.15)" :
    variant === "primary" ? "linear-gradient(135deg, #F46D2A, #d45a1f)" :
    "rgba(255,255,255,0.06)";
  const color = variant === "success" ? "rgb(134,239,172)" :
    variant === "danger" ? "rgb(252,165,165)" :
    variant === "primary" ? "white" : "rgba(255,255,255,0.7)";

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
      style={{ background: bg, color }}
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : label}
    </button>
  );
}
