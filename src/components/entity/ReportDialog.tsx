import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const REPORT_REASONS = [
  "Misleading information",
  "Spam or scam",
  "Inappropriate content",
  "Copyright violation",
  "Impersonation",
  "Other",
];

interface ReportDialogProps {
  entityId: string;
  entityTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ entityId, entityTitle, open, onOpenChange }: ReportDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (!reason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("entity_reports").insert({
      entity_id: entityId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit report", variant: "destructive" });
      return;
    }
    toast({ title: "Report submitted. Thank you." });
    onOpenChange(false);
    setReason("");
    setDetails("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-md rounded-2xl p-6 mx-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-bold">Report</h3>
          <button onClick={() => onOpenChange(false)}><X className="w-5 h-5 text-white/40" /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Report "{entityTitle}" for violating community guidelines
        </p>

        {!user ? (
          <div className="text-center py-4">
            <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to submit a report</p>
            <button onClick={() => navigate("/auth/login")} className="text-xs px-4 py-2 rounded-lg" style={{ background: "rgba(181,98,42,0.2)", color: "#b5622a" }}>Sign in</button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: reason === r ? "rgba(181,98,42,0.15)" : "rgba(255,255,255,0.03)",
                    color: reason === r ? "#b5622a" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${reason === r ? "rgba(181,98,42,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full bg-transparent text-white text-sm mb-4 px-3 py-2 rounded-lg resize-none focus:outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button onClick={handleSubmit} disabled={submitting} className="w-full text-sm py-2.5 rounded-lg font-medium disabled:opacity-50" style={{ background: "linear-gradient(135deg, #c47a3a, #b5622a)", color: "#fff" }}>
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
