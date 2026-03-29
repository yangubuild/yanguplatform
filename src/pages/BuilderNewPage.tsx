import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { VariantPreviewCarousel } from "@/components/builder-new/VariantPreviewCarousel";
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { BuilderEditorTopBar } from "@/components/builder-new/BuilderEditorTopBar";
import { useStepController } from "@/components/builder-new/hooks/useStepController";
import { generateWebsiteVariants } from "@/components/builder-new/utils/websiteGenerator";
import type { StepOption } from "@/components/builder-new/hooks/useStepController";
import type { ChatMessage, Selection } from "@/components/builder-new/types/builder.types";
import yanguLogo from "@/assets/yangu-logo-full.png";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const ctrl = useStepController();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const greetedRef = useRef(false);

  // Multi-variant state
  const [variants, setVariants] = useState<string[]>([]);
  const [chosenVariant, setChosenVariant] = useState<string | null>(null);
  const [isChoosingVariant, setIsChoosingVariant] = useState(false);

  const addMsg = useCallback((role: "user" | "assistant", content: string) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), role, content, timestamp: Date.now() };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  // Show Ada's first message
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const config = ctrl.getStepConfig();
    if (config.adaMessage) addMsg("assistant", config.adaMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When step changes, add Ada's message
  const prevStepRef = useRef(ctrl.currentStep);
  useEffect(() => {
    if (ctrl.currentStep === prevStepRef.current) return;
    prevStepRef.current = ctrl.currentStep;

    if (ctrl.currentStep === "generation") {
      handleGenerate();
      return;
    }

    const config = ctrl.getStepConfig();
    if (config.adaMessage) addMsg("assistant", config.adaMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrl.currentStep]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    addMsg("user", option.label);
    ctrl.handleOptionSelect(option);
  }, [addMsg, ctrl]);

  const handleConfirmMulti = useCallback(() => {
    const step = ctrl.currentStep;
    if (step === "sections") {
      addMsg("user", `Selected: ${ctrl.selectedSections.join(", ")}`);
    } else if (step === "delivery_apps") {
      addMsg("user", `Selected: ${ctrl.selectedDeliveryApps.join(", ")}`);
    }
    ctrl.confirmMultiSelect();
  }, [addMsg, ctrl]);

  const handleGenerate = useCallback(() => {
    if (!ctrl.category) ctrl.setCategory("esite");
    ctrl.setIsGenerating(true);
    setIsChoosingVariant(true);
    setChosenVariant(null);
    setVariants([]);
    addMsg("assistant", "⚡ Generating 3 unique designs based on your selections...");

    const cat = ctrl.category || "esite";
    const htmlVariants = generateWebsiteVariants({
      category: cat,
      businessName: ctrl.businessName || "My Website",
      location: "Dubai, UAE",
      scope: ctrl.selectedScope || "showcase",
      style: ctrl.selectedStyleCategory || "modern",
      styleSpecific: ctrl.selectedStyleSpecific || "",
      sections: ctrl.selectedSections,
      deliveryApps: ctrl.selectedDeliveryApps,
      userIdea: ctrl.userIdea || "",
    });

    setTimeout(() => {
      setVariants(htmlVariants);
      ctrl.setIsGenerating(false);
      addMsg("assistant", "Here are 3 design variants! Browse through them and click **Choose this design** on the one you like best.");
    }, 2500);
  }, [ctrl, addMsg]);

  const handleChooseVariant = useCallback((index: number) => {
    const selected = variants[index];
    setChosenVariant(selected);
    setIsChoosingVariant(false);
    ctrl.setGeneratedHtml(selected);
    ctrl.setCurrentStep("refinement");
    addMsg("user", `Selected Design ${index + 1}`);
    addMsg("assistant", "Your website draft is ready! Use the toolbar to edit text, replace images, or describe changes in the chat.");
  }, [variants, ctrl, addMsg]);

  const handleHtmlChange = useCallback((html: string) => {
    setChosenVariant(html);
    ctrl.setGeneratedHtml(html);
  }, [ctrl]);

  const handleFreeText = useCallback((text: string) => {
    if (ctrl.currentStep === "greeting") {
      addMsg("user", text);
      ctrl.handleGreetingInput(text);
    } else {
      addMsg("user", text);
      addMsg("assistant", "I'll work on that refinement for you. (Refinement AI coming soon!)");
    }
  }, [addMsg, ctrl]);

  // Build selections list
  const selections: Selection[] = [];
  if (ctrl.category) selections.push({ type: "category", label: ctrl.category, value: ctrl.category, timestamp: Date.now() });
  if (ctrl.selectedScope) selections.push({ type: "scope", label: ctrl.selectedScope, value: ctrl.selectedScope, timestamp: Date.now() });
  if (ctrl.selectedAssets) selections.push({ type: "assets", label: ctrl.selectedAssets, value: ctrl.selectedAssets, timestamp: Date.now() });
  ctrl.selectedSections.forEach(s => selections.push({ type: "sections", label: s, value: s, timestamp: Date.now() }));
  ctrl.selectedDeliveryApps.forEach(s => selections.push({ type: "delivery_apps", label: s, value: s, timestamp: Date.now() }));
  if (ctrl.selectedStyleCategory) selections.push({ type: "style_category", label: ctrl.selectedStyleCategory, value: ctrl.selectedStyleCategory, timestamp: Date.now() });
  if (ctrl.selectedStyleSpecific) selections.push({ type: "style_specific", label: ctrl.selectedStyleSpecific, value: ctrl.selectedStyleSpecific, timestamp: Date.now() });

  // Determine center panel state
  const showVariantCarousel = isChoosingVariant && (variants.length > 0 || ctrl.isGenerating);
  const showEditablePreview = !!chosenVariant && !isChoosingVariant;
  const showCenterPanel = showVariantCarousel || showEditablePreview;
  const isEditMode = showEditablePreview;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar: show editor bar in edit mode, logo bar otherwise */}
      {isEditMode ? (
        <BuilderEditorTopBar businessName={ctrl.businessName} category={ctrl.category} />
      ) : (
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border shrink-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <img src={yanguLogo} alt="Yangu" className="h-5 w-auto opacity-70" />
          <span className="text-sm font-medium text-foreground">Website Builder</span>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className={`${showCenterPanel ? "w-[360px]" : "flex-1"} min-w-0 border-r border-border shrink-0 transition-all overflow-visible`}>
          <ChatInterface
            messages={messages}
            isLoading={ctrl.isGenerating}
            onSend={handleFreeText}
            stepConfig={ctrl.getStepConfig()}
            onOptionSelect={handleOptionSelect}
            onConfirmMulti={handleConfirmMulti}
            multiSelected={
              ctrl.currentStep === "sections" ? ctrl.selectedSections :
              ctrl.currentStep === "delivery_apps" ? ctrl.selectedDeliveryApps :
              []
            }
            inputAllowed={ctrl.inputAllowed}
            currentStep={ctrl.currentStep}
            builderMode={isEditMode ? "edit" : "new"}
            selections={selections}
          />
        </div>

        {/* Center panel — variant carousel or editable preview */}
        {showVariantCarousel && (
          <div className="flex-1 min-w-0 border-r border-border">
            <VariantPreviewCarousel
              variants={variants}
              onChoose={handleChooseVariant}
              isGenerating={ctrl.isGenerating}
            />
          </div>
        )}

        {showEditablePreview && (
          <div className="flex-1 min-w-0 border-r border-border">
            <EditablePreview
              html={chosenVariant!}
              onHtmlChange={handleHtmlChange}
            />
          </div>
        )}

        {/* Selections panel */}
        <div className="w-[260px] shrink-0 hidden md:block overflow-hidden">
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
