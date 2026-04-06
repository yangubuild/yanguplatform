import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { VariantPreviewCarousel } from "@/components/builder-new/VariantPreviewCarousel";
import type { VariantPreviewItem } from "@/components/builder-new/VariantPreviewCarousel";
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { BuilderEditorTopBar } from "@/components/builder-new/BuilderEditorTopBar";
import { EditorToolsPanel } from "@/components/builder-new/EditorToolsPanel";
import { EmenuEditorPanel } from "@/components/builder-new/EmenuEditorPanel";
import { useStepController } from "@/components/builder-new/hooks/useStepController";
import { generateWebsiteVariants } from "@/components/builder-new/utils/websiteGenerator";
import type { StepOption } from "@/components/builder-new/hooks/useStepController";
import type { ChatMessage, Selection } from "@/components/builder-new/types/builder.types";
import emenuPlateriaImg from "@/assets/styles/emenu_plateria.jpg";
import emenuYumixImg from "@/assets/styles/emenu_yumix.jpg";
import emenuZooomImg from "@/assets/styles/emenu_zooom.jpg";

/** Reference template keys that use static screenshot previews */
const REFERENCE_TEMPLATE_KEYS = ["emenu_plateria", "emenu_yumix", "emenu_zooom"];
const REFERENCE_PREVIEWS: Record<string, { imageUrl: string; label: string }> = {
  emenu_plateria: { imageUrl: emenuPlateriaImg, label: "Plateria" },
  emenu_yumix: { imageUrl: emenuYumixImg, label: "Yumix" },
  emenu_zooom: { imageUrl: emenuZooomImg, label: "Zooom" },
};
import yanguLogo from "@/assets/yangu-logo-full.png";
import { supabase } from "@/integrations/supabase/client";

function naturalDelay(): Promise<void> {
  const ms = 800 + Math.random() * 700;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Left panel mode: "chat" = onboarding/Ada chat, "tools" = editor tools */
type LeftPanelMode = "chat" | "tools";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const ctrl = useStepController();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const greetedRef = useRef(false);
  const [isThinking, setIsThinking] = useState(false);

  // Multi-variant state
  const [variants, setVariants] = useState<VariantPreviewItem[]>([]);
  const [chosenVariant, setChosenVariant] = useState<string | null>(null);
  const [isChoosingVariant, setIsChoosingVariant] = useState(false);

  // Left panel mode: defaults to "chat" during onboarding, auto-switches to "tools" after generation
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("chat");

  // Track selected section from EditablePreview
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const addMsg = useCallback((role: "user" | "assistant", content: string) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), role, content, timestamp: Date.now() };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const addDelayedMsg = useCallback(async (content: string) => {
    setIsThinking(true);
    await naturalDelay();
    setIsThinking(false);
    addMsg("assistant", content);
  }, [addMsg]);

  // Show Ada's first message
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const config = ctrl.getStepConfig();
    if (config.adaMessage) addMsg("assistant", config.adaMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When step changes, add Ada's message with delay
  const prevStepRef = useRef(ctrl.currentStep);
  useEffect(() => {
    if (ctrl.currentStep === prevStepRef.current) return;
    prevStepRef.current = ctrl.currentStep;

    if (ctrl.currentStep === "generation") {
      handleGenerate();
      return;
    }

    const config = ctrl.getStepConfig();
    if (config.adaMessage) {
      addDelayedMsg(config.adaMessage);
    }
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

  const handleConfirmAssetUpload = useCallback(() => {
    const { userUploadedAssets } = ctrl;
    const parts: string[] = [];
    if (userUploadedAssets.logoUrl) parts.push("Logo uploaded");
    if (userUploadedAssets.brandColors.length) parts.push(`${userUploadedAssets.brandColors.length} colors`);
    if (userUploadedAssets.images.length) parts.push(`${userUploadedAssets.images.length} images`);
    addMsg("user", `Assets: ${parts.join(", ") || "None"}`);
    ctrl.confirmAssetUpload();
  }, [addMsg, ctrl]);

  const handleGenerate = useCallback(() => {
    if (!ctrl.category) ctrl.setCategory("esite");
    ctrl.setIsGenerating(true);
    setIsChoosingVariant(true);
    setChosenVariant(null);
    setVariants([]);
    addMsg("assistant", "⚡ Generating 3 unique designs based on your selections...");

    const cat = ctrl.category || "esite";
    const { userUploadedAssets } = ctrl;

    const htmlVariants = generateWebsiteVariants({
      category: cat,
      businessName: ctrl.businessName || "My Website",
      location: ctrl.businessLocation || "Dubai, UAE",
      scope: ctrl.selectedScope || "showcase",
      style: ctrl.selectedTemplateKey || "modern",
      styleSpecific: "",
      sections: ctrl.selectedSections,
      deliveryApps: ctrl.selectedDeliveryApps,
      userIdea: ctrl.userIdea || "",
      userLogoUrl: userUploadedAssets.logoUrl,
      userBrandColors: userUploadedAssets.brandColors,
      userImages: userUploadedAssets.images,
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
    addMsg("assistant", "Your website draft is ready! Use the editor tools on the left to make changes, or switch to Ada AI for help.");
    // AUTO-SWITCH: left panel transitions from chat to editor tools
    setLeftPanelMode("tools");
  }, [variants, ctrl, addMsg]);

  const handleHtmlChange = useCallback((html: string) => {
    setChosenVariant(html);
    ctrl.setGeneratedHtml(html);
  }, [ctrl]);

  const handleFreeText = useCallback((text: string) => {
    if (ctrl.currentStep === "greeting") {
      addMsg("user", text);
      ctrl.handleGreetingInput(text);
    } else if (ctrl.currentStep === "business_location") {
      addMsg("user", text);
      ctrl.handleLocationInput(text);
    } else {
      addMsg("user", text);
      handleRefinement(text);
    }
  }, [addMsg, ctrl]);

  const handleRefinement = useCallback(async (text: string) => {
    setIsThinking(true);
    try {
      const templateLabel = ctrl.selectedTemplateKey || "custom";
      const sections = ctrl.selectedSections.join(", ") || "hero, menu, about";
      const sysPrompt = `You are Ada, a website editor assistant. The user has a generated website draft based on the "${templateLabel}" emenu template. Current sections: ${sections}. Business: ${ctrl.businessName || "the user's business"}. Location: ${ctrl.businessLocation || "unspecified"}. The user wants refinements. Respond with clear, actionable suggestions. If they ask to change text, colors, or layout, describe exactly what to change. Keep responses short and helpful. Do NOT output JSON — respond in plain friendly text.`;

      const { data } = await supabase.functions.invoke("together-chat", {
        body: {
          messages: [
            { role: "system", content: sysPrompt },
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          temperature: 0.7,
          max_tokens: 400,
        },
      });

      const reply = data?.content || "I'll apply that change. Use the editor tools to make direct edits, or describe more changes here.";
      setIsThinking(false);
      addMsg("assistant", reply);
    } catch {
      setIsThinking(false);
      addMsg("assistant", "I had trouble processing that. Try using the editor tools to make edits directly, or describe the change again.");
    }
  }, [messages, ctrl, addMsg]);

  // Handle editor tool actions from EditorToolsPanel
  const handleEditorAction = useCallback((action: string) => {
    // These actions are forwarded to the EditablePreview via postMessage or direct calls
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Editable Website Preview"]');
    if (!iframe?.contentWindow) return;

    switch (action) {
      case "edit_text":
        // Toggle edit mode in the preview
        iframe.contentWindow.postMessage({ type: "toggle-edit-mode" }, "*");
        break;
      case "replace_image":
        iframe.contentWindow.postMessage({ type: "open-image-picker" }, "*");
        break;
      case "add_section":
      case "move_up":
      case "move_down":
      case "remove_section":
      case "duplicate_section":
        iframe.contentWindow.postMessage({ type: "toolbar-action", action }, "*");
        break;
      case "change_colors":
        // Open color picker dialog — handled by EditablePreview
        iframe.contentWindow.postMessage({ type: "open-color-picker" }, "*");
        break;
      default:
        break;
    }
  }, []);

  // Toggle between editor tools and Ada chat
  const handleToggleAdaChat = useCallback(() => {
    setLeftPanelMode(prev => prev === "chat" ? "tools" : "chat");
  }, []);

  // Build selections list
  const selections: Selection[] = [];
  if (ctrl.category) selections.push({ type: "category", label: ctrl.category, value: ctrl.category, timestamp: Date.now() });
  if (ctrl.selectedScope) selections.push({ type: "scope", label: ctrl.selectedScope, value: ctrl.selectedScope, timestamp: Date.now() });
  if (ctrl.selectedAssets) selections.push({ type: "assets", label: ctrl.selectedAssets, value: ctrl.selectedAssets, timestamp: Date.now() });
  ctrl.selectedSections.forEach(s => selections.push({ type: "sections", label: s, value: s, timestamp: Date.now() }));
  ctrl.selectedDeliveryApps.forEach(s => selections.push({ type: "delivery_apps", label: s, value: s, timestamp: Date.now() }));
  if (ctrl.selectedTemplateKey) selections.push({ type: "template", label: ctrl.selectedTemplateKey, value: ctrl.selectedTemplateKey, timestamp: Date.now() });
  if (ctrl.businessLocation) selections.push({ type: "location", label: ctrl.businessLocation, value: ctrl.businessLocation, timestamp: Date.now() });

  // Determine center panel state
  const showVariantCarousel = isChoosingVariant && (variants.length > 0 || ctrl.isGenerating);
  const showEditablePreview = !!chosenVariant && !isChoosingVariant;
  const showCenterPanel = showVariantCarousel || showEditablePreview;
  const isEditMode = showEditablePreview;

  const isLoadingState = ctrl.isGenerating || isThinking;

  // In edit mode, show EditorToolsPanel by default; chat is toggled via Ada button
  const showEditorTools = isEditMode && leftPanelMode === "tools";
  const showChat = !isEditMode || leftPanelMode === "chat";

  return (
    <div className="h-screen flex flex-col bg-background">
      {isEditMode ? (
        <BuilderEditorTopBar
          businessName={ctrl.businessName}
          category={ctrl.category}
          onToggleAdaChat={handleToggleAdaChat}
          isAdaChatOpen={leftPanelMode === "chat"}
        />
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
        {/* Left panel: Editor Tools (default in edit mode) or Chat (default in onboarding / toggled in edit mode) */}
        <div className={`${showCenterPanel ? "w-[360px]" : "flex-1"} min-w-0 border-r border-border shrink-0 transition-all overflow-visible`}>
          {showEditorTools ? (
            <EditorToolsPanel
              onToggleAdaChat={handleToggleAdaChat}
              onAction={handleEditorAction}
              selectedSection={selectedSection}
              businessName={ctrl.businessName}
              category={ctrl.category}
            />
          ) : (
            <ChatInterface
              messages={messages}
              isLoading={isLoadingState}
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
              userAssets={ctrl.userUploadedAssets}
              onAssetsChange={ctrl.setUserUploadedAssets}
              onConfirmAssetUpload={handleConfirmAssetUpload}
              businessName={ctrl.businessName}
              onConfirmAiLogo={ctrl.confirmAiLogo}
            />
          )}
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

        {/* Right panel */}
        <div className="w-[260px] shrink-0 hidden md:block overflow-hidden">
          {isEditMode && ctrl.category === "emenu" ? (
            <EmenuEditorPanel
              businessName={ctrl.businessName}
              category={ctrl.category}
              onAction={handleEditorAction}
            />
          ) : (
            <SelectionPanel
              selections={selections}
              category={ctrl.category}
              generatedHtml={ctrl.generatedHtml}
              isGenerating={ctrl.isGenerating}
              onGenerate={handleGenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
