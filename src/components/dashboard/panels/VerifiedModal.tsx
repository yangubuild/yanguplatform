import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck } from "lucide-react";

const TICK_OPTIONS = [
  {
    id: "blue",
    label: "Blue Tick",
    description: "Verified identity — confirms you are who you say you are.",
    color: "#3b82f6",
  },
  {
    id: "green",
    label: "Green Tick",
    description: "Verified business — confirms your business is registered and operating.",
    color: "#22c55e",
  },
  {
    id: "orange",
    label: "Orange Tick",
    description: "Premium creator — for top-tier creators and influencers.",
    color: "#f97316",
  },
];

interface VerifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifiedModal({ open, onOpenChange }: VerifiedModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#1a2129", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-2">
          <BadgeCheck className="w-5 h-5" style={{ color: "#E67E22" }} />
          <DialogTitle className="text-lg font-bold text-white">Get Verified</DialogTitle>
        </div>

        <p className="px-6 text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Choose a verification type to build trust with your audience.
        </p>

        <div className="px-4 space-y-2 pb-4">
          {TICK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-colors text-left"
              style={{
                background: selected === opt.id ? "rgba(181,98,42,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected === opt.id ? "rgba(181,98,42,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: selected === opt.id ? opt.color : "rgba(255,255,255,0.2)" }}
              >
                {selected === opt.id && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" style={{ color: opt.color }} />
                  <span className="text-sm font-semibold text-white">{opt.label}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {opt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-5">
          <button
            disabled={!selected}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{
              background: selected ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
              color: selected ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          >
            Continue to Payment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
