import { useState } from "react";
import { X, Sparkles, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const DURATION_OPTIONS = [
  { key: "hour", label: "1 Hour", price: 199, cents: 199 },
  { key: "day", label: "1 Day", price: 499, cents: 499 },
  { key: "week", label: "1 Week", price: 1999, cents: 1999 },
  { key: "month", label: "1 Month", price: 4999, cents: 4999 },
];

interface CreateTrendModalProps {
  onClose: () => void;
}

export function CreateTrendModal({ onClose }: CreateTrendModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"compose" | "payment">("compose");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("day");
  const [submitting, setSubmitting] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isValid = text.trim().length > 0 && wordCount <= 3 && text.length <= 30;

  const handleGenerate = async () => {
    setGenerating(true);
    // Simple AI-assisted generation using predefined templates
    const templates = [
      "Sell Faster Today", "Dubai Deals Now", "Shop Smart Here",
      "Fresh Finds Daily", "Best Prices Live", "New Arrivals Now",
      "Trending Sales Here", "Hot Deals Today", "Save More Now",
    ];
    const random = templates[Math.floor(Math.random() * templates.length)];
    await new Promise((r) => setTimeout(r, 600));
    setText(random);
    setGenerating(false);
  };

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    const duration = DURATION_OPTIONS.find((d) => d.key === selectedDuration)!;
    const now = new Date();
    let endsAt = new Date(now);
    if (duration.key === "hour") endsAt.setHours(endsAt.getHours() + 1);
    else if (duration.key === "day") endsAt.setDate(endsAt.getDate() + 1);
    else if (duration.key === "week") endsAt.setDate(endsAt.getDate() + 7);
    else endsAt.setMonth(endsAt.getMonth() + 1);

    const { error } = await supabase.from("live_trends").insert({
      user_id: user.id,
      text: text.trim(),
      duration_type: duration.key,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "active",
      payment_amount_cents: duration.cents,
    });

    if (error) {
      toast.error("Failed to create trend");
      setSubmitting(false);
      return;
    }
    toast.success("Trend is now live! 🔥");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{ background: "#111820", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <span className="text-sm font-semibold text-foreground">Create Trend</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "compose" ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Your trend text (max 3 words)
              </label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={30}
                placeholder="e.g. Sell Faster Today"
                className="w-full px-4 py-3 rounded-xl text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
                style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className={`text-[10px] ${wordCount > 3 ? "text-red-400" : "text-muted-foreground"}`}>
                  {wordCount}/3 words
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Generate
                </button>
              </div>
            </div>

            {/* Preview */}
            {text.trim() && (
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="text-xs text-muted-foreground block mb-1">Preview</span>
                <span className="text-lg font-bold text-foreground">{text.trim()}</span>
              </div>
            )}

            <Button
              onClick={() => setStep("payment")}
              disabled={!isValid}
              className="w-full rounded-xl h-10"
              style={{ background: isValid ? "#f59e0b" : undefined, color: isValid ? "#000" : undefined }}>
              Continue to Payment
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Duration selection */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Choose duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDuration(d.key)}
                    className="px-3 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedDuration === d.key ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                      border: selectedDuration === d.key ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <span className="text-sm font-medium text-foreground block">{d.label}</span>
                    <span className="text-xs text-muted-foreground">${(d.price / 100).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Trend text</span>
                <span className="text-foreground font-medium">"{text.trim()}"</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground">{DURATION_OPTIONS.find((d) => d.key === selectedDuration)?.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-foreground font-semibold">Total</span>
                <span className="font-bold" style={{ color: "#f59e0b" }}>
                  ${(DURATION_OPTIONS.find((d) => d.key === selectedDuration)!.price / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("compose")} className="flex-1 rounded-xl h-10">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl h-10"
                style={{ background: "#f59e0b", color: "#000" }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay & Go Live"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
