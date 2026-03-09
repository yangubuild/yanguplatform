import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupStep } from "./steps/SetupStep";
import { CreativesStep } from "./steps/CreativesStep";
import { BudgetStep } from "./steps/BudgetStep";

const STEPS = ["Setup", "Creatives", "Budget"] as const;
type Step = (typeof STEPS)[number];

interface CampaignWizardProps {
  onClose: () => void;
}

export interface CampaignData {
  name: string;
  selectedProduct: string | null;
  globalReach: boolean;
  location: string;
  creatives: CreativeItem[];
  dailyBudget: number;
  searchAd?: SearchAdEntry | null;
}

export interface SearchAdEntry {
  surfaceId: string;
  surfaceTitle: string;
  surfaceSlug: string;
  coverImage?: string;
  productType: string;
  category: string;
  description: string;
}

export interface CreativeItem {
  id: string;
  type: "image" | "video";
  src: string;
  caption: string;
  cropRatio?: string;
}

export function CampaignWizard({ onClose }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("Setup");
  const [data, setData] = useState<CampaignData>({
    name: "",
    selectedProduct: null,
    globalReach: true,
    location: "",
    creatives: [],
    dailyBudget: 50,
  });

  const stepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setCurrentStep(STEPS[stepIndex + 1]);
  };
  const goBack = () => {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1]);
  };

  const handleLaunch = () => {
    onClose();
  };

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b border-white/10"
        style={{ background: "#08120D" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-semibold">Launch campaign</span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep !== "Budget" && (
              <Button
                variant="accent"
                onClick={goNext}
                className="rounded-xl px-5 h-9"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-2 text-sm">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <button
                  onClick={() => i <= stepIndex && setCurrentStep(step)}
                  className="px-6 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: i === stepIndex
                      ? "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)"
                      : i < stepIndex
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(255,255,255,0.04)",
                    color: i === stepIndex
                      ? "#fff"
                      : i < stepIndex
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.3)",
                    cursor: i <= stepIndex ? "pointer" : "default",
                  }}
                >
                  {step}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {currentStep === "Setup" && (
          <SetupStep data={data} onChange={setData} />
        )}
        {currentStep === "Creatives" && (
          <CreativesStep data={data} onChange={setData} />
        )}
        {currentStep === "Budget" && (
          <BudgetStep data={data} onChange={setData} />
        )}
      </div>
    </div>
  );
}
