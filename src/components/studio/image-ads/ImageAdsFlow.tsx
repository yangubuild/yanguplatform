import { useState } from "react";
import { ImageAdsLinkStep } from "./ImageAdsLinkStep";
import { ImageAdsSelectProduct } from "./ImageAdsSelectProduct";
import { ImageAdsManualSetup } from "./ImageAdsManualSetup";
import { CreditBadge } from "@/components/studio/CreditBadge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";

export type ImageAdsStep = "link" | "select-product" | "manual-setup";

export default function ImageAdsFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImageAdsStep>("link");

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background relative">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === "link" ? navigate("/dashboard/studio") : setStep("link"))}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "link" ? "Studio" : "Back"}
          </button>
          <span className="text-lg font-bold text-foreground">Image Ads</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback
          </button>
          <CreditBadge />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-y-auto">
        {step === "link" && (
          <ImageAdsLinkStep
            onSelectProduct={() => setStep("select-product")}
            onManualSetup={() => setStep("manual-setup")}
          />
        )}
        {step === "manual-setup" && (
          <ImageAdsManualSetup onBack={() => setStep("link")} />
        )}
        {step === "select-product" && (
          <ImageAdsSelectProduct
            onCancel={() => setStep("link")}
            onSelect={() => setStep("link")}
          />
        )}
      </div>
    </div>
  );
}
