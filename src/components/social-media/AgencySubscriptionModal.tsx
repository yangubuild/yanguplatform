import { useState } from "react";
import { X, Check, Layers, Palette, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgencySubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgencySubscriptionModal({ open, onClose }: AgencySubscriptionModalProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  if (!open) return null;

  const monthlyPrice = 229;
  const yearlyPrice = 183;
  const price = billing === "monthly" ? monthlyPrice : yearlyPrice;

  const features = [
    "5 Workspaces",
    "Team access",
    "Connect to all channels",
    "Unlimited users",
    "Whitelabeled portal",
    "Advanced features",
  ];

  const highlights = [
    {
      icon: Layers,
      title: "Bulk generate posts",
      desc: "Generate large batches of posts at a time, all you have to do is choose the ones you like.",
    },
    {
      icon: Palette,
      title: "Custom designs and text",
      desc: "Content is personalized to the client, but you can edit it further as much as you like.",
    },
    {
      icon: Shield,
      title: "White labeled Solution",
      desc: "The whole process is wrapped in a white labeled solution that makes it easy to work with your clients.",
    },
  ];

  const handleSubscribe = () => {
    toast.info("Agency subscription coming soon. Contact sales for early access.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-[820px] mx-auto my-8">
        <div className="p-6 sm:p-8">
          {/* Close */}
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                billing === "monthly"
                  ? "border-foreground text-foreground bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                billing === "yearly"
                  ? "border-foreground text-foreground bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
            </button>
            {billing === "yearly" && (
              <span className="bg-accent text-accent-foreground text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Save 20%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Plan card */}
            <div className="rounded-xl border border-border p-6">
              <h3 className="text-xl font-bold text-foreground">Pro</h3>
              <p className="text-sm text-muted-foreground mb-6">For agencies and established businesses</p>

              <div className="mb-1">
                {billing === "yearly" && (
                  <span className="text-lg text-muted-foreground line-through mr-2">${monthlyPrice}</span>
                )}
                <span className="text-4xl sm:text-5xl font-bold text-foreground">${price}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                per month{billing === "yearly" ? ", billed annually" : ""}
              </p>

              <div className="border-t border-border pt-4 mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Includes</p>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-foreground shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full bg-foreground text-background hover:bg-foreground/90 mb-2"
                onClick={handleSubscribe}
              >
                Schedule a Demo
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSubscribe}>
                Try for Free
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                + $50 per additional workspace
              </p>
            </div>

            {/* Right: Highlights */}
            <div className="flex flex-col justify-center gap-8 py-4">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center shrink-0">
                    <h.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">{h.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
