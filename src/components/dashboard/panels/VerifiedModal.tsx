import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TICK_OPTIONS = [
  {
    id: "blue",
    label: "Blue Tick",
    description: "Verified Creator / Identity — confirms you are who you say you are.",
    color: "#3b82f6",
  },
  {
    id: "orange",
    label: "Orange Tick",
    description: "Verified Business — confirms your business is registered and operating.",
    color: "#b5622a",
  },
  {
    id: "green",
    label: "Green Tick",
    description: "Verified Organization / Community — for registered organizations and communities.",
    color: "#16a34a",
  },
];

interface VerifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifiedModal({ open, onOpenChange }: VerifiedModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ tick_type: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing verification request on open
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("verification_requests")
      .select("tick_type, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setExistingRequest(data);
        if (data) setSelected(data.tick_type);
        setLoading(false);
      });
  }, [open, user]);

  const currentVerified = (profile as any)?.verified_tick as string | null;

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    try {
      // Upsert verification request
      const { error } = await supabase
        .from("verification_requests")
        .upsert(
          { user_id: user.id, tick_type: selected, status: "pending", updated_at: new Date().toISOString() },
          { onConflict: "user_id,tick_type" }
        );
      if (error) throw error;

      setExistingRequest({ tick_type: selected, status: "pending" });
      toast.success("Verification request submitted! We'll review your application.");
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = existingRequest?.status === "pending";
  const isApproved = existingRequest?.status === "approved" || !!currentVerified;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#111a15", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <BadgeCheck className="w-5 h-5" style={{ color: "#E67E22" }} />
          <DialogTitle className="text-lg font-bold text-foreground">Get Verified</DialogTitle>
        </div>

        {isApproved && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "rgba(22,163,106,0.12)", border: "1px solid rgba(22,163,106,0.2)" }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} />
            <span className="text-xs font-medium" style={{ color: "#16a34a" }}>
              You are verified with a {TICK_OPTIONS.find(t => t.id === (currentVerified || existingRequest?.tick_type))?.label || "tick"}
            </span>
          </div>
        )}

        {isPending && !isApproved && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <Loader2 className="w-4 h-4" style={{ color: "#eab308" }} />
            <span className="text-xs font-medium" style={{ color: "#eab308" }}>
              Your verification request is pending review
            </span>
          </div>
        )}

        <p className="px-6 text-xs mb-4 text-muted-foreground">
          Choose a verification type to build trust with your audience.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-4 space-y-2 pb-4">
            {TICK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => !isApproved && setSelected(opt.id)}
                disabled={isApproved}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-colors text-left"
                style={{
                  background: selected === opt.id ? "rgba(181,98,42,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selected === opt.id ? "rgba(181,98,42,0.3)" : "rgba(255,255,255,0.06)"}`,
                  opacity: isApproved && opt.id !== (currentVerified || existingRequest?.tick_type) ? 0.4 : 1 }}>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selected === opt.id ? opt.color : "rgba(255,255,255,0.2)" }}>
                  {selected === opt.id && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" style={{ color: opt.color }} />
                    <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  </div>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pb-5">
          {isApproved ? (
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(22,163,106,0.15)", color: "#16a34a" }}
              disabled>
              Verified ✓
            </button>
          ) : (
            <button
              disabled={!selected || submitting || isPending}
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity flex items-center justify-center gap-2"
              style={{
                background: selected && !isPending ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
                color: selected && !isPending ? "#fff" : "rgba(255,255,255,0.35)" }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Request Pending" : "Submit Verification Request"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
