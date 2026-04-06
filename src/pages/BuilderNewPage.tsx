import { useEffect, useCallback, useRef, useState } from "react";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";
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
import { BuilderSettingsDialog } from "@/components/builder-new/BuilderSettingsDialog";
import { BuilderPublishDialog } from "@/components/builder-new/BuilderPublishDialog";
import { useStepController } from "@/components/builder-new/hooks/useStepController";
import { generateWebsiteVariants } from "@/components/builder-new/utils/websiteGenerator";
import type { StepOption } from "@/components/builder-new/hooks/useStepController";
import type { ChatMessage, Selection } from "@/components/builder-new/types/builder.types";
import { classifyUserIntent, getMismatchMessage } from "@/lib/builder/intentClassifier";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function naturalDelay(): Promise<void> {
  const ms = 800 + Math.random() * 700;
  return new Promise(resolve => setTimeout(resolve, ms));
}

type LeftPanelMode = "chat" | "tools";
type ViewportMode = "desktop" | "mobile";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const ctrl = useStepController();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const greetedRef = useRef(false);
  const [isThinking, setIsThinking] = useState(false);

  const [variants, setVariants] = useState<VariantPreviewItem[]>([]);
  const [chosenVariant, setChosenVariant] = useState<string | null>(null);
  const [isChoosingVariant, setIsChoosingVariant] = useState(false);

  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("chat");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection | null>(null);

  // Top bar state
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const handleCanvasSelection = useCallback((sel: CanvasSelection) => {
    setCanvasSelection(sel);
    if (sel.sectionIndex !== undefined) {
      setSelectedSection(sel.sectionIndex.toString());
    }
  }, []);

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

  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const config = ctrl.getStepConfig();
    if (config.adaMessage) addMsg("assistant", config.adaMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevStepRef = useRef(ctrl.currentStep);
  useEffect(() => {
    if (ctrl.currentStep === prevStepRef.current) return;
    prevStepRef.current = ctrl.currentStep;

    if (ctrl.currentStep === "generation") {
      handleGenerate();
      return;
    }

    const config = ctrl.getStepConfig();
    if (config.adaMessage) addDelayedMsg(config.adaMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrl.currentStep]);

  const handleOptionSelect = useCallback((option: StepOption) => {
    addMsg("user", option.label);
    ctrl.handleOptionSelect(option);
  }, [addMsg, ctrl]);

  const handleConfirmMulti = useCallback(() => {
    const step = ctrl.currentStep;
    if (step === "sections") addMsg("user", `Selected: ${ctrl.selectedSections.join(", ")}`);
    else if (step === "delivery_apps") addMsg("user", `Selected: ${ctrl.selectedDeliveryApps.join(", ")}`);
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
    const templateKey = ctrl.selectedTemplateKey || "modern";
    const { userUploadedAssets } = ctrl;

    const htmlVariants = generateWebsiteVariants({
      category: cat,
      businessName: ctrl.businessName || "My Website",
      location: ctrl.businessLocation || "Dubai, UAE",
      scope: ctrl.selectedScope || "showcase",
      style: templateKey,
      styleSpecific: "",
      sections: ctrl.selectedSections,
      deliveryApps: ctrl.selectedDeliveryApps,
      userIdea: ctrl.userIdea || "",
      userLogoUrl: userUploadedAssets.logoUrl,
      userBrandColors: userUploadedAssets.brandColors,
      userImages: userUploadedAssets.images,
    });

    const items: VariantPreviewItem[] = htmlVariants.map((html, i) => ({
      html,
      label: `Design ${i + 1}`,
    }));

    setTimeout(() => {
      setVariants(items);
      ctrl.setIsGenerating(false);
      addMsg("assistant", "Here are 3 design variants! Browse through them and click **Choose this design** on the one you like best.");
    }, 2500);
  }, [ctrl, addMsg]);

  const handleChooseVariant = useCallback((index: number) => {
    const selected = variants[index];
    const selectedHtml = selected.html || "<html><body><p>Generation failed</p></body></html>";
    setChosenVariant(selectedHtml);
    ctrl.setGeneratedHtml(selectedHtml);
    setIsChoosingVariant(false);
    ctrl.setCurrentStep("refinement");
    addMsg("user", `Selected ${selected.label || `Design ${index + 1}`}`);
    addMsg("assistant", "Your website draft is ready! Use the editor tools on the left to make changes, or switch to Ada AI for help.");
    setLeftPanelMode("tools");
  }, [variants, ctrl, addMsg]);

  const handleHtmlChange = useCallback((html: string) => {
    setChosenVariant(html);
    ctrl.setGeneratedHtml(html);
  }, [ctrl]);

  const mismatchHandledRef = useRef(false);

  const handleFreeText = useCallback((text: string) => {
    if (ctrl.currentStep === "greeting") {
      addMsg("user", text);
      if (!mismatchHandledRef.current) {
        const intent = classifyUserIntent(text, ctrl.category);
        if (intent.isMismatch && intent.confidence > 0.3) {
          mismatchHandledRef.current = true;
          const msg = getMismatchMessage(ctrl.category!, intent.detectedCategory);
          addDelayedMsg(msg);
          (ctrl as any).__pendingSwitch = intent.detectedCategory;
          (ctrl as any).__pendingText = text;
          return;
        }
      }
      ctrl.handleGreetingInput(text);
    } else if (ctrl.currentStep === "business_location") {
      addMsg("user", text);
      ctrl.handleLocationInput(text);
    } else {
      addMsg("user", text);
      handleRefinement(text);
    }
  }, [addMsg, ctrl, addDelayedMsg]);

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

  // ─── Editor action handler (left + right panel actions) ───
  const getIframe = useCallback(() => document.querySelector<HTMLIFrameElement>('iframe[title="Editable Website Preview"]'), []);

  const handleEditorAction = useCallback((action: string, payload?: any) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;

    switch (action) {
      // Layout actions → forwarded to iframe
      case "add_section":
      case "move_up":
      case "move_down":
      case "remove_section":
      case "duplicate_section":
        iframe?.contentWindow?.postMessage({ type: "toolbar-action", action }, "*");
        break;

      case "edit_text":
        iframe?.contentWindow?.postMessage({ type: "toggle-edit-mode" }, "*");
        break;

      case "replace_image":
      case "upload_image":
      case "stock_image":
      case "ai_generate_image":
        iframe?.contentWindow?.postMessage({ type: "open-image-picker" }, "*");
        break;

      case "change_colors":
        iframe?.contentWindow?.postMessage({ type: "open-color-picker" }, "*");
        break;

      // Right panel: layout mode/columns
      case "set_layout": {
        if (!doc) break;
        const menuGrid = doc.querySelector('[class*="menu-grid"], [class*="menu-items"], [style*="grid"]');
        if (menuGrid && payload?.mode === "list") {
          (menuGrid as HTMLElement).style.display = "flex";
          (menuGrid as HTMLElement).style.flexDirection = "column";
          (menuGrid as HTMLElement).style.gap = "16px";
          pushUpdate(doc, iframe);
          toast.success("Switched to list layout");
        } else if (menuGrid && payload?.mode === "grid") {
          (menuGrid as HTMLElement).style.display = "grid";
          (menuGrid as HTMLElement).style.gridTemplateColumns = "repeat(2, 1fr)";
          (menuGrid as HTMLElement).style.gap = "24px";
          pushUpdate(doc, iframe);
          toast.success("Switched to grid layout");
        }
        break;
      }

      case "set_columns": {
        if (!doc) break;
        const grid = doc.querySelector('[style*="grid"]');
        if (grid && payload?.columns) {
          (grid as HTMLElement).style.gridTemplateColumns = `repeat(${payload.columns}, 1fr)`;
          pushUpdate(doc, iframe);
          toast.success(`Set to ${payload.columns} columns`);
        }
        break;
      }

      // Right panel: business info
      case "edit_business_name": {
        if (!doc) break;
        const h1 = doc.querySelector("h1");
        if (h1) {
          h1.setAttribute("contenteditable", "true");
          h1.focus();
          toast.info("Click the heading in preview to edit");
        }
        break;
      }

      case "edit_phone":
      case "edit_address":
      case "edit_logo":
        toast.info("Click the element in the preview to edit it directly");
        break;

      // Menu items
      case "add_menu_item": {
        if (!doc) break;
        const menuContainer = doc.querySelector('[class*="menu-grid"], [class*="menu-items"], section:nth-of-type(2) [style*="grid"]');
        if (menuContainer) {
          const card = doc.createElement("div");
          card.className = "menu-item";
          card.style.cssText = "border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);";
          card.innerHTML = `
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" style="width:100%;height:180px;object-fit:cover;" />
            <div style="padding:16px;">
              <h3 contenteditable="true" style="font-size:1.1rem;font-weight:600;margin-bottom:4px;">New Item</h3>
              <p contenteditable="true" style="font-size:0.85rem;opacity:0.7;margin-bottom:8px;">Click to add description</p>
              <span contenteditable="true" style="font-weight:700;font-size:1rem;">$0.00</span>
            </div>`;
          menuContainer.appendChild(card);
          pushUpdate(doc, iframe);
          toast.success("Menu item added! Click to edit it.");
        } else {
          toast.info("Scroll to the menu section first");
        }
        break;
      }

      case "add_category":
        toast.info("Categories will be added in a future update");
        break;
      case "delete_category":
        toast.info("Category management coming soon");
        break;

      // Commerce
      case "order_settings":
        toast.info("Order settings will be available after publishing");
        break;

      // Social
      case "social_links":
        toast.info("Click social icons in the footer to edit links");
        break;

      // Page-level
      case "page_settings":
        setSettingsOpen(true);
        break;
      case "seo_meta":
        setSettingsOpen(true);
        break;

      default:
        toast.info(`${action} — coming soon`);
        break;
    }
  }, [getIframe]);

  const pushUpdate = (doc: Document, iframe: HTMLIFrameElement | null) => {
    if (doc && iframe) {
      const html = doc.documentElement.outerHTML;
      setChosenVariant(html);
      ctrl.setGeneratedHtml(html);
    }
  };

  const handleToggleAdaChat = useCallback(() => {
    setLeftPanelMode(prev => prev === "chat" ? "tools" : "chat");
  }, []);

  const handleBusinessNameChange = useCallback((name: string) => {
    ctrl.setBusinessName?.(name);
  }, [ctrl]);

  // Build selections list
  const selections: Selection[] = [];
  if (ctrl.category) selections.push({ type: "category", label: ctrl.category, value: ctrl.category, timestamp: Date.now() });
  if (ctrl.selectedScope) selections.push({ type: "scope", label: ctrl.selectedScope, value: ctrl.selectedScope, timestamp: Date.now() });
  if (ctrl.selectedAssets) selections.push({ type: "assets", label: ctrl.selectedAssets, value: ctrl.selectedAssets, timestamp: Date.now() });
  ctrl.selectedSections.forEach(s => selections.push({ type: "sections", label: s, value: s, timestamp: Date.now() }));
  ctrl.selectedDeliveryApps.forEach(s => selections.push({ type: "delivery_apps", label: s, value: s, timestamp: Date.now() }));
  if (ctrl.selectedTemplateKey) selections.push({ type: "template", label: ctrl.selectedTemplateKey, value: ctrl.selectedTemplateKey, timestamp: Date.now() });
  if (ctrl.businessLocation) selections.push({ type: "location", label: ctrl.businessLocation, value: ctrl.businessLocation, timestamp: Date.now() });

  const showVariantCarousel = isChoosingVariant && (variants.length > 0 || ctrl.isGenerating);
  const showEditablePreview = !!chosenVariant && !isChoosingVariant;
  const showCenterPanel = showVariantCarousel || showEditablePreview;
  const isEditMode = showEditablePreview;

  const isLoadingState = ctrl.isGenerating || isThinking;
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
          viewportMode={viewportMode}
          onViewportChange={setViewportMode}
          onPublish={() => setPublishOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
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
        {/* Left panel */}
        <div className={`${showCenterPanel ? "w-[360px]" : "flex-1"} min-w-0 border-r border-border shrink-0 transition-all overflow-visible`}>
          {showEditorTools ? (
            <EditorToolsPanel
              onToggleAdaChat={handleToggleAdaChat}
              onAction={handleEditorAction}
              selectedSection={selectedSection}
              businessName={ctrl.businessName}
              category={ctrl.category}
              canvasSelection={canvasSelection}
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

        {/* Center panel */}
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
              onSelectionChange={handleCanvasSelection}
              viewportMode={viewportMode}
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

      {/* Dialogs */}
      <BuilderSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        businessName={ctrl.businessName}
        onBusinessNameChange={handleBusinessNameChange}
        category={ctrl.category}
      />
      <BuilderPublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        businessName={ctrl.businessName}
        category={ctrl.category}
      />
    </div>
  );
}
