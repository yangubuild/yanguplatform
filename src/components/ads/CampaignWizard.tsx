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
    // TODO: persist campaign
    onClose();
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b border-white/10"
        style={{ background: "#0a0a0a" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-semibold">Launch campaign</span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep !== "Budget" ? (
              <Button
                onClick={goNext}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 h-9"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleLaunch}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 h-9"
              >
                Launch campaign
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === stepIndex
                      ? "bg-blue-600 text-white"
                      : i < stepIndex
                      ? "bg-white/10 text-white/70 cursor-pointer"
                      : "bg-white/5 text-white/30"
                  }`}
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
