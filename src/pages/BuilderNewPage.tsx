import { useEffect, useCallback, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { VariantPreviewCarousel } from "@/components/builder-new/VariantPreviewCarousel";
import type { VariantPreviewItem } from "@/components/builder-new/VariantPreviewCarousel";
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { BuilderEditorTopBar } from "@/components/builder-new/BuilderEditorTopBar";
import { EditorToolsPanel } from "@/components/builder-new/EditorToolsPanel";
import { EmenuEditorPanel } from "@/components/builder-new/EmenuEditorPanel";
import { ButtonEditorPanel } from "@/components/builder-new/ButtonEditorPanel";
import { TextEditorPanel } from "@/components/builder-new/TextEditorPanel";
import { SectionEditorPanel } from "@/components/builder-new/SectionEditorPanel";
import { ImageEditorPanel } from "@/components/builder-new/ImageEditorPanel";
import { BuilderSettingsDialog } from "@/components/builder-new/BuilderSettingsDialog";
import { BuilderPublishDialog } from "@/components/builder-new/BuilderPublishDialog";
import { useStepController } from "@/components/builder-new/hooks/useStepController";
import { generateWebsiteVariants } from "@/components/builder-new/utils/websiteGenerator";
import type { StepOption } from "@/components/builder-new/hooks/useStepController";
import type { ChatMessage, Selection } from "@/components/builder-new/types/builder.types";
import { classifyUserIntent, getMismatchMessage } from "@/lib/builder/intentClassifier";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { getEngine } from "@/lib/builder/engineRegistry";
import { mergeIntoDefault } from "@/lib/builderDefaults";
import { getTemplate } from "@/config/templateRegistry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function naturalDelay(): Promise<void> {
  const ms = 800 + Math.random() * 700;
  return new Promise(resolve => setTimeout(resolve, ms));
}

type LeftPanelMode = "chat" | "tools";
type ViewportMode = "desktop" | "mobile";

interface BuilderNewPageProps {
  embedded?: boolean;
  initialCategory?: string | null;
  onBack?: () => void;
}

export default function BuilderNewPage({ embedded = false, initialCategory = null, onBack }: BuilderNewPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const resolvedCategory = initialCategory ?? urlCategory;
  const ctrl = useStepController();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const greetedRef = useRef(false);
  const [isThinking, setIsThinking] = useState(false);
  const { user } = useAuth();
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();

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

  // Set initial category from URL param
  const categorySetRef = useRef(false);
  useEffect(() => {
    if (resolvedCategory && !categorySetRef.current) {
      categorySetRef.current = true;
      if (["emenu", "eshop", "estore", "esite", "community", "influencer"].includes(resolvedCategory)) {
        ctrl.setCategory(resolvedCategory as any);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCategory]);

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

  /**
   * When a variant is chosen:
   * - For emenu: create a real surface and navigate to SellerEditor (old editor with real publish)
   * - For other categories: stay in BuilderNewPage edit mode (existing behavior)
   */
  const handleChooseVariant = useCallback(async (index: number) => {
    const selected = variants[index];
    const selectedHtml = selected.html || "<html><body><p>Generation failed</p></body></html>";
    const cat = ctrl.category;

    // For emenu: create real surface and hand off to SellerEditor
    if (cat === "emenu" && user?.id) {
      const engine = getEngine("emenu");
      if (!engine) {
        toast.error("Emenu engine not found");
        return;
      }

      addMsg("user", `Selected ${selected.label || `Design ${index + 1}`}`);
      addMsg("assistant", "Creating your menu... Hang tight!");

      const businessName = ctrl.businessName || "My Restaurant";
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      const templateKey = ctrl.selectedTemplateKey || "";

      // Look up the selected template preset to build real sections from its patches
      const templatePreset = templateKey ? getTemplate("emenu", templateKey) : null;

      let seedSections: { type: string; schema: Record<string, unknown>; core_slot?: string }[];

      if (templatePreset && Object.keys(templatePreset.patches).length > 0) {
        // ─── Template-aware section generation ───
        // Use the template's sectionOrder if available, otherwise derive from patches
        const sectionOrder = templatePreset.reference?.sectionOrder || [];
        const patchEntries = Object.entries(templatePreset.patches) as [string, { schema: Record<string, unknown> }][];

        // Map core_slot → section type
        const SLOT_TO_TYPE: Record<string, string> = {
          header: "header",
          hero: "hero",
          main_content: "menu",
          offer: "offer",
          footer: "footer",
          showcase: "showcase",
        };

        // Build sections in sectionOrder if available, then add any remaining patches
        const orderedSlots: string[] = [];
        const patchSlots = new Set(patchEntries.map(([slot]) => slot));

        if (sectionOrder.length > 0) {
          // Map sectionOrder types back to slot keys
          const TYPE_TO_SLOT: Record<string, string> = {};
          for (const [slot, type] of Object.entries(SLOT_TO_TYPE)) TYPE_TO_SLOT[type] = slot;
          // Also handle compound names like "menu_grid" → main_content
          TYPE_TO_SLOT["menu_grid"] = "main_content";
          TYPE_TO_SLOT["about_story"] = "offer";
          TYPE_TO_SLOT["testimonials"] = "offer";
          TYPE_TO_SLOT["categories"] = "main_content";
          TYPE_TO_SLOT["featured"] = "main_content";

          for (const sectionName of sectionOrder) {
            const slot = TYPE_TO_SLOT[sectionName] || sectionName;
            if (patchSlots.has(slot) && !orderedSlots.includes(slot)) {
              orderedSlots.push(slot);
            }
          }
        }

        // Add any remaining patches not covered by sectionOrder
        for (const [slot] of patchEntries) {
          if (!orderedSlots.includes(slot)) orderedSlots.push(slot);
        }

        seedSections = orderedSlots.map((slot) => {
          const patch = templatePreset.patches[slot as keyof typeof templatePreset.patches];
          if (!patch) return null;
          const sectionType = SLOT_TO_TYPE[slot] || slot;
          const schema = mergeIntoDefault(sectionType, { ...patch.schema });

          // Inject business name into hero
          if (sectionType === "hero") {
            if (!schema.headline || schema.headline === "Your Headline") {
              schema.headline = businessName;
            }
            if (ctrl.businessLocation && !schema.subheadline) {
              schema.subheadline = ctrl.businessLocation;
            }
          }

          // Inject business location into footer
          if (sectionType === "footer" && ctrl.businessLocation) {
            if (!schema.address) schema.address = ctrl.businessLocation;
          }

          return { type: sectionType, schema, core_slot: slot };
        }).filter((s): s is NonNullable<typeof s> => s !== null);
      } else {
        // ─── Fallback: no template preset found, use engine defaults ───
        seedSections = engine.defaultSections.map((s) => {
          const schema = mergeIntoDefault(s.type, s.schema);
          if (s.type === "hero") {
            schema.headline = businessName;
            if (ctrl.businessLocation) schema.subheadline = ctrl.businessLocation;
          }
          if (s.type === "menu") {
            schema.categories = [
              {
                name: "Starters",
                items: [
                  { name: "House Salad", price: 8, description: "Fresh mixed greens", image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
                  { name: "Soup of the Day", price: 6, description: "Ask your server", image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop" },
                ],
              },
              {
                name: "Main Course",
                items: [
                  { name: "Grilled Chicken", price: 15, description: "Served with vegetables", image_url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop" },
                  { name: "Pasta Primavera", price: 12, description: "Seasonal vegetables", image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop" },
                ],
              },
              {
                name: "Desserts",
                items: [
                  { name: "Chocolate Cake", price: 7, description: "Rich and decadent", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop" },
                ],
              },
            ];
          }
          if (s.type === "footer") {
            schema.phone = "";
            schema.address = ctrl.businessLocation || "";
          }
          return { type: s.type, schema, core_slot: s.core_slot };
        });
      }

      const metadata: Record<string, unknown> = {
        brand: { primary_color: "#b5622a" },
        industry: "restaurant",
        business: {
          name: businessName,
          location: ctrl.businessLocation || "",
        },
        builder_new_template: templateKey || "default",
        builder_new_html: selectedHtml,
        template_family: templatePreset?.template_family || null,
      };

      try {
        await initAndNavigate({
          surfaceType: "emenu",
          slug,
          title: businessName,
          seedSections,
          metadata,
        });
        // Navigation happens inside initAndNavigate — it will go to /builder/:surfaceId → SellerEditor
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create menu surface");
      }
      return;
    }

    // Default behavior for non-emenu categories: stay in BuilderNewPage edit mode
    setChosenVariant(selectedHtml);
    ctrl.setGeneratedHtml(selectedHtml);
    setIsChoosingVariant(false);
    ctrl.setCurrentStep("refinement");
    addMsg("user", `Selected ${selected.label || `Design ${index + 1}`}`);
    addMsg("assistant", "Your website draft is ready! Use the editor tools on the left to make changes, or switch to Ada AI for help.");
    setLeftPanelMode("tools");
  }, [variants, ctrl, addMsg, user, initAndNavigate]);

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

      // Button editor actions
      case "set_button_color": {
        if (!doc) break;
        const btnSel = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btnSel && payload?.color) {
          btnSel.style.backgroundColor = payload.color;
          const isLight = payload.color === "#ffffff" || payload.color === "#d4a853";
          btnSel.style.color = isLight ? "#1a1a1a" : "#ffffff";
          pushUpdate(doc, iframe);
        } else { toast.info("Click a button in the preview first"); }
        break;
      }

      case "set_button_shape": {
        if (!doc) break;
        const btnShape = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btnShape && payload?.radius) { btnShape.style.borderRadius = payload.radius; pushUpdate(doc, iframe); }
        else { toast.info("Click a button in the preview first"); }
        break;
      }

      case "set_button_size": {
        if (!doc) break;
        const btnSize = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btnSize && payload?.padding) {
          btnSize.style.padding = payload.padding;
          if (payload.fontSize) btnSize.style.fontSize = payload.fontSize;
          pushUpdate(doc, iframe);
        } else { toast.info("Click a button in the preview first"); }
        break;
      }

      case "set_button_align": {
        if (!doc) break;
        const btnAlign = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btnAlign && payload?.align) {
          const parent = btnAlign.parentElement;
          if (parent) { parent.style.display = "flex"; parent.style.justifyContent = payload.align; }
          pushUpdate(doc, iframe);
        } else { toast.info("Click a button in the preview first"); }
        break;
      }

      // Text style actions
      case "set_text_style": {
        if (!doc) break;
        const textEl = doc.querySelector('.yangu-el-selected') as HTMLElement | null;
        if (textEl && payload) {
          Object.entries(payload).forEach(([k, v]) => { (textEl.style as any)[k] = v; });
          pushUpdate(doc, iframe);
        } else { toast.info("Click a text element in the preview first"); }
        break;
      }

      // Section style actions
      case "set_section_style": {
        if (!doc) break;
        const secEl = doc.querySelector('.section-selected') as HTMLElement | null;
        if (secEl && payload) {
          Object.entries(payload).forEach(([k, v]) => { (secEl.style as any)[k] = v; });
          pushUpdate(doc, iframe);
        } else { toast.info("Click a section in the preview first"); }
        break;
      }

      case "set_section_bg_image": {
        iframe?.contentWindow?.postMessage({ type: "open-image-picker" }, "*");
        break;
      }

      // Image style actions
      case "set_image_style": {
        if (!doc) break;
        const imgEl = doc.querySelector('.yangu-img-selected') as HTMLElement | null;
        if (imgEl && payload) {
          Object.entries(payload).forEach(([k, v]) => { (imgEl.style as any)[k] = v; });
          pushUpdate(doc, iframe);
        } else { toast.info("Click an image in the preview first"); }
        break;
      }

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

      case "order_settings":
        toast.info("Order settings will be available after publishing");
        break;

      case "social_links":
        toast.info("Click social icons in the footer to edit links");
        break;

      case "page_settings":
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

  const isLoadingState = ctrl.isGenerating || isThinking || isInitializing;
  const showEditorTools = isEditMode && leftPanelMode === "tools";
  const showChat = !isEditMode || leftPanelMode === "chat";

  return (
    <div className={`${embedded ? "h-[calc(100vh-64px)]" : "h-screen"} flex flex-col bg-background`}>
      {/* Chat phase: show a back bar */}
      {!isEditMode && onBack && (
        <div className="shrink-0 border-b border-border px-4 py-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}
      {/* Only show the builder top bar during in-page edit mode */}
      {isEditMode && (
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

        {/* Right panel — context-aware */}
        <div className="w-[260px] shrink-0 hidden md:block overflow-hidden">
          {isEditMode && canvasSelection?.kind === "button" ? (
            <ButtonEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : isEditMode && canvasSelection?.kind === "text" ? (
            <TextEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : isEditMode && canvasSelection?.kind === "section" ? (
            <SectionEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} sectionIndex={canvasSelection.sectionIndex} />
          ) : isEditMode && canvasSelection?.kind === "image" ? (
            <ImageEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : isEditMode && ctrl.category === "emenu" ? (
            <EmenuEditorPanel businessName={ctrl.businessName} category={ctrl.category} onAction={handleEditorAction} />
          ) : (
            <SelectionPanel selections={selections} category={ctrl.category} generatedHtml={ctrl.generatedHtml} isGenerating={ctrl.isGenerating} onGenerate={handleGenerate} />
          )}
        </div>
      </div>

      {/* Dialogs — only for non-emenu categories (emenu uses SellerEditor's real publish) */}
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
