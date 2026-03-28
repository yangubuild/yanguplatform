import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { SitePreview } from "@/components/builder-new/SitePreview";
import { useStepController } from "@/components/builder-new/hooks/useStepController";
import { generateWebsiteHTML } from "@/components/builder-new/utils/websiteGenerator";
import type { StepOption } from "@/components/builder-new/hooks/useStepController";
import type { ChatMessage } from "@/components/builder-new/types/builder.types";
import type { Selection } from "@/components/builder-new/types/builder.types";
import yanguLogo from "@/assets/yangu-logo-full.png";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const ctrl = useStepController();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const greetedRef = useRef(false);

  // Helper to add a message
  const addMsg = useCallback((role: "user" | "assistant", content: string) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), role, content, timestamp: Date.now() };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // Show Ada's first message for current step
  useEffect(() => {
    if (greetedRef.current && ctrl.currentStep === "greeting") return;
    greetedRef.current = true;
    const config = ctrl.getStepConfig();
    if (config.adaMessage) {
      addMsg("assistant", config.adaMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When step changes, add Ada's message for that step
  const prevStepRef = useRef(ctrl.currentStep);
  useEffect(() => {
    if (ctrl.currentStep === prevStepRef.current) return;
    prevStepRef.current = ctrl.currentStep;

    // Handle generation step
    if (ctrl.currentStep === "confirmation") {
      handleGenerate();
      return;
    }

    const config = ctrl.getStepConfig();
    if (config.adaMessage) {
      addMsg("assistant", config.adaMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrl.currentStep]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    // Add user bubble showing what was clicked
    addMsg("user", option.label);
    // Process selection
    ctrl.handleOptionSelect(option);
  }, [addMsg, ctrl]);

  const handleConfirmMulti = useCallback(() => {
    const step = ctrl.currentStep;
    if (step === "assets") {
      addMsg("user", `Selected: ${ctrl.selectedSections.join(", ")}`);
    } else if (step === "sections") {
      addMsg("user", `Selected: ${ctrl.selectedDeliveryApps.join(", ")}`);
    }
    ctrl.confirmMultiSelect();
  }, [addMsg, ctrl]);

  const handleGenerate = useCallback(() => {
    if (!ctrl.category) {
      // Default category if not detected
      ctrl.setCategory("esite");
    }
    ctrl.setIsGenerating(true);
    addMsg("assistant", "⚡ Generating your website... This will take a moment.");

    const cat = ctrl.category || "esite";
    const html = generateWebsiteHTML({
      category: cat,
      businessName: ctrl.businessName || "My Website",
      location: "Dubai, UAE",
      scope: ctrl.selectedScope || "showcase",
      style: ctrl.selectedStyleCategory || "modern",
      styleSpecific: ctrl.selectedStyleSpecific || "",
      sections: ctrl.selectedSections,
      deliveryApps: ctrl.selectedDeliveryApps,
      userIdea: "",
    });

    setTimeout(() => {
      ctrl.setGeneratedHtml(html);
      ctrl.setIsGenerating(false);
      ctrl.setCurrentStep("refinement");
    }, 1500);
  }, [ctrl, addMsg]);

  const handleFreeText = useCallback((text: string) => {
    addMsg("user", text);
    addMsg("assistant", "I'll work on that refinement for you. (Refinement coming soon!)");
  }, [addMsg]);

  // Build selections list for panel
  const selections: Selection[] = [];
  if (ctrl.selectedScope) selections.push({ type: "scope", label: ctrl.selectedScope, value: ctrl.selectedScope, timestamp: Date.now() });
  if (ctrl.selectedAssets) selections.push({ type: "assets", label: ctrl.selectedAssets, value: ctrl.selectedAssets, timestamp: Date.now() });
  ctrl.selectedSections.forEach(s => selections.push({ type: "sections", label: s, value: s, timestamp: Date.now() }));
  ctrl.selectedDeliveryApps.forEach(s => selections.push({ type: "delivery_apps", label: s, value: s, timestamp: Date.now() }));
  if (ctrl.selectedStyleCategory) selections.push({ type: "style_category", label: ctrl.selectedStyleCategory, value: ctrl.selectedStyleCategory, timestamp: Date.now() });
  if (ctrl.selectedStyleSpecific) selections.push({ type: "style_specific", label: ctrl.selectedStyleSpecific, value: ctrl.selectedStyleSpecific, timestamp: Date.now() });

  const showPreview = !!ctrl.generatedHtml;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <img src={yanguLogo} alt="Yangu" className="h-6 w-auto opacity-70" />
        <span className="text-sm font-medium text-foreground">Website Builder</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className={`${showPreview ? "w-[380px]" : "flex-1"} min-w-0 border-r border-border shrink-0 transition-all overflow-visible`}>
          <ChatInterface
            messages={messages}
            isLoading={ctrl.isGenerating}
            onSend={handleFreeText}
            stepConfig={ctrl.getStepConfig()}
            onOptionSelect={handleOptionSelect}
            onConfirmMulti={handleConfirmMulti}
            multiSelected={
              ctrl.currentStep === "assets" ? ctrl.selectedSections :
              ctrl.currentStep === "sections" && ctrl.isFoodCategory ? ctrl.selectedDeliveryApps :
              []
            }
            inputAllowed={ctrl.inputAllowed}
            currentStep={ctrl.currentStep}
            builderMode="new"
            selections={selections}
          />
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="flex-1 min-w-0 border-r border-border">
            <SitePreview html={ctrl.generatedHtml!} />
          </div>
        )}

        {/* Selections panel */}
        <div className="w-[280px] shrink-0 hidden md:block overflow-hidden">
          <SelectionPanel
            selections={selections}
            category={ctrl.category}
            generatedHtml={ctrl.generatedHtml}
            isGenerating={ctrl.isGenerating}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    </div>
  );
}
