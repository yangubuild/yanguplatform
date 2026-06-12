/**
 * EmenuNewEditor — Full Emenu editor with persistence, undo/redo,
 * theme, magic editor toolbar, and fully wired side panels.
 */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { persistBlobUrls } from "@/lib/builder/persistBlobUrls";
import { sanitizeEditorHtml } from "@/lib/builder/editorHtml";
import { EditorColorPickerDialog } from "@/components/builder-new/EditorColorPickerDialog";
import { EditorImagePickerDialog } from "@/components/builder-new/EditorImagePickerDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, AlertTriangle, Monitor, Smartphone, Sparkles,
  Settings, ClipboardList, Rocket, X, Undo2, Redo2, Wand2, ExternalLink,
} from "lucide-react";
import { useAdaBuilderChat } from "@/components/builder-new/ada/useAdaBuilderChat";
// PERF: Ada panel is heavy — load it only when the user opens it.
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
const AdaBuilderPanel = lazy(() =>
  import("@/components/builder-new/ada/AdaBuilderPanel").then((m) => ({ default: m.AdaBuilderPanel })),
);
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { EditorToolsPanel } from "@/components/builder-new/EditorToolsPanel";
import { EmenuEditorPanel } from "@/components/builder-new/EmenuEditorPanel";
import { TextEditorPanel } from "@/components/builder-new/TextEditorPanel";
import { SectionEditorPanel } from "@/components/builder-new/SectionEditorPanel";
import { MagicEditorToolbar } from "@/components/builder-new/MagicEditorToolbar";
import { ProductCardEditorModal, ProductDeleteConfirmModal } from "@/components/builder-new/ProductCardEditorModal";
import { ButtonStylePanel } from "@/components/builder-new/ButtonStylePanel";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { CommerceConfigPanel } from "@/components/commerce/CommerceConfigPanel";
import { CompleteSetupBanner } from "@/components/commerce/CompleteSetupBanner";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { useEditorHistory } from "@/hooks/useEditorHistory";
import { useDebounce } from "@/hooks/useDebounce";
import { getSellerMode } from "@/lib/builder/sellerModes";
import type { CanvasSelection, ProductCardData } from "@/lib/builder/selectionTypes";
import type { BuilderSurfaceType } from "@/types/builder";
import { toast } from "sonner";

type LeftMode = "tools" | "ada" | "commerce";
type PreviewViewport = "desktop" | "mobile";

const BUILDER_CATEGORY_BY_SURFACE_TYPE: Record<string, string> = {
  eshop: "eshop",
  emenu: "emenu",
  quick_site: "esite",
  store_listing: "estore",
  live_bio: "influencer",
  community_group: "community",
  community_listing: "community",
};

const BUILDER_CATEGORY_BY_SELLER_MODE: Record<string, string> = {
  menu: "emenu",
  shop: "eshop",
  catalog: "estore",
  service: "esite",
  bio: "influencer",
  community: "community",
};

function isLightHex(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

const PRODUCT_CURRENCY_CODE_PATTERN = /(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|R)/i;
const PRODUCT_PRICE_TOKEN_PATTERN = /[$€£₦]|\b(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|R)\b/i;

function isProductPriceText(text: string): boolean {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 0 && compact.length < 24 && PRODUCT_PRICE_TOKEN_PATTERN.test(compact) && /\d/.test(compact);
}

function getRecognizedCurrencyAffix(existingPrice: string): { prefix: string; suffix: string } {
  const compact = existingPrice.replace(/\s+/g, " ").trim();
  if (!compact) return { prefix: "", suffix: "" };

  const prefixMatch = compact.match(new RegExp(`^((?:[$€£₦]|${PRODUCT_CURRENCY_CODE_PATTERN.source})\\s*)`, "i"));
  if (prefixMatch?.[1] && PRODUCT_PRICE_TOKEN_PATTERN.test(prefixMatch[1])) {
    return { prefix: prefixMatch[1], suffix: "" };
  }

  const suffixMatch = compact.match(new RegExp(`(\\s*(?:${PRODUCT_CURRENCY_CODE_PATTERN.source}))$`, "i"));
  if (suffixMatch?.[1] && PRODUCT_PRICE_TOKEN_PATTERN.test(suffixMatch[1])) {
    return { prefix: "", suffix: suffixMatch[1].trim() };
  }

  return { prefix: "", suffix: "" };
}

function getProductNameElement(card: ParentNode): HTMLElement | null {
  const persisted = card.querySelector<HTMLElement>('[data-product-role="title"]');
  if (persisted) return persisted;

  const candidates = Array.from(card.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,strong,[style*='font-weight:700'],[style*='font-weight:600'],[style*='font-weight: 700'],[style*='font-weight: 600']"));
  return candidates.find((candidate) => {
    const text = candidate.textContent?.replace(/\s+/g, " ").trim() || "";
    return Boolean(text) && !isProductPriceText(text);
  }) || null;
}

function getProductPriceElement(card: ParentNode): HTMLElement | null {
  const persisted = card.querySelector<HTMLElement>('[data-product-role="price"]');
  if (persisted) return persisted;

  const candidates = Array.from(card.querySelectorAll<HTMLElement>("span,p,div,strong"));
  return candidates.find((candidate) => {
    if (candidate.closest(".yangu-product-controls")) return false;
    if (candidate.querySelector("button,a,h1,h2,h3,h4,h5,h6,img")) return false;
    const text = candidate.textContent?.replace(/\s+/g, " ").trim() || "";
    return isProductPriceText(text);
  }) || null;
}

function getProductDescriptionElement(
  card: ParentNode,
  nameElement?: Element | null,
  priceElement?: Element | null,
): HTMLElement | null {
  const nameText = nameElement?.textContent?.replace(/\s+/g, " ").trim() || "";
  const persisted = card.querySelector<HTMLElement>('[data-product-role="description"]');
  if (persisted) {
    const persistedText = persisted.textContent?.replace(/\s+/g, " ").trim() || "";
    const persistedDirectText = getDirectProductText(persisted);
    if (persistedText && persistedText !== nameText && persistedDirectText !== nameText && !isProductPriceText(persistedText)) {
      return persisted;
    }
    persisted.removeAttribute("data-product-role");
  }

  const candidates = Array.from(card.querySelectorAll<HTMLElement>("p,span,div"));

  return candidates.find((candidate) => {
    if (candidate === nameElement || candidate === priceElement) return false;
    if (candidate.closest(".yangu-product-controls")) return false;
    if (candidate.querySelector("button,a,h1,h2,h3,h4,h5,h6,img")) return false;
    const text = candidate.textContent?.replace(/\s+/g, " ").trim() || "";
    if (!text || text === nameText || getDirectProductText(candidate) === nameText || isProductPriceText(text) || text.length > 220) return false;
    return true;
  }) || null;
}

function getSiblingCurrencyAffix(card: Element | null): { prefix: string; suffix: string } {
  if (!card?.parentElement) return { prefix: "", suffix: "" };
  const siblings = card.parentElement.querySelectorAll('[data-product-role="price"]');
  for (let i = 0; i < siblings.length; i++) {
    const sib = siblings[i];
    if (sib.closest('[data-product-card]') === card) continue;
    const text = sib.textContent?.replace(/\s+/g, " ").trim() || "";
    if (!text) continue;
    const affix = getRecognizedCurrencyAffix(text);
    if (affix.prefix || affix.suffix) return affix;
  }
  return { prefix: "", suffix: "" };
}

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", NGN: "₦",
  UGX: "UGX ", KES: "KES ", TZS: "TZS ", AED: "AED ", ZAR: "R",
};

function formatProductPrice(nextPrice: string, existingPrice: string, card?: Element | null, surfaceCurrency?: string): string {
  const trimmed = nextPrice.trim();
  if (!trimmed) return "";
  if (isProductPriceText(trimmed)) return trimmed;

  // Step 1: current card affix
  let { prefix, suffix } = getRecognizedCurrencyAffix(existingPrice);

  // Step 2: sibling cards
  if (!prefix && !suffix && card) {
    const sib = getSiblingCurrencyAffix(card);
    prefix = sib.prefix;
    suffix = sib.suffix;
  }

  // Step 3: surface configured currency
  if (!prefix && !suffix && surfaceCurrency) {
    const sym = CURRENCY_SYMBOL_MAP[surfaceCurrency.toUpperCase()];
    if (sym) prefix = sym;
    else prefix = surfaceCurrency.toUpperCase() + " ";
  }

  if (prefix) return `${prefix}${trimmed}`;
  if (suffix) return `${trimmed} ${suffix}`;
  return trimmed;
}

function getProductScopedElement(card: ParentNode, role: "title" | "description" | "price" | "badge", nodeId?: string): HTMLElement | null {
  if (nodeId) {
    const byNode = card.querySelector<HTMLElement>(`[data-yangu-node-id="${nodeId}"]`);
    if (byNode) return byNode;
  }

  return card.querySelector<HTMLElement>(`[data-product-role="${role}"]`);
}

function normalizeProductNodeText(text: string | null | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function getDirectProductText(element: Element): string {
  return normalizeProductNodeText(
    Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join(" ")
  );
}

function removeDuplicateProductNameNodes(
  card: HTMLElement,
  nameText: string,
  keepNodes: Array<Element | null | undefined>,
): void {
  const normalizedName = normalizeProductNodeText(nameText);
  if (!normalizedName) return;

  const protectedNodes = keepNodes.filter((node): node is Element => Boolean(node));
  const candidates = Array.from(card.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,span,div,strong,b,small"));

  candidates.forEach((node) => {
    if (protectedNodes.some((protectedNode) => node === protectedNode || node.contains(protectedNode) || protectedNode.contains(node))) return;
    if (node.closest(".yangu-product-controls")) return;
    if (node.querySelector("img,button,a,svg,input,select,textarea")) return;

    const fullText = normalizeProductNodeText(node.textContent);
    const directText = getDirectProductText(node);

    if (fullText === normalizedName) {
      node.remove();
      return;
    }

    if (directText !== normalizedName) return;

    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && normalizeProductNodeText(child.textContent)) {
        child.remove();
      }
    });

    if (!normalizeProductNodeText(node.textContent) && node.children.length === 0) {
      node.remove();
    }
  });
}

function createProductBadgeElement(doc: Document, text: string): HTMLSpanElement {
  const badge = doc.createElement("span");
  badge.textContent = text;
  badge.setAttribute("data-product-role", "badge");
  badge.style.display = "inline-flex";
  badge.style.alignItems = "center";
  badge.style.padding = "0.25rem 0.625rem";
  badge.style.borderRadius = "0.625rem";
  badge.style.background = "hsl(43 96% 56% / 0.16)";
  badge.style.color = "hsl(32 95% 44%)";
  badge.style.fontSize = "0.75rem";
  badge.style.fontWeight = "600";
  badge.style.lineHeight = "1.1";
  badge.style.marginBottom = "0.5rem";
  return badge;
}

export default function EmenuNewEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch the live published URL for this surface
  const { data: liveUrl } = useQuery({
    queryKey: ["live-url", surfaceId],
    enabled: !!surfaceId,
    queryFn: async () => {
      const { data } = await supabase
        .from("builder_publishes")
        .select("slug, domain_id")
        .eq("surface_id", surfaceId!)
        .eq("state", "published")
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const { data: domain } = await supabase
        .from("domains")
        .select("host")
        .eq("id", data.domain_id)
        .maybeSingle();
      if (!domain?.host) return null;
      return `https://${domain.host}/${data.slug}`;
    },
    staleTime: 30_000,
  });
  
  const [magicEditorOn, setMagicEditorOn] = useState(true);
  const [leftMode, setLeftMode] = useState<LeftMode>("tools");
  const adaChat = useAdaBuilderChat();
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductCardData | null>(null);
  const [pendingProductDelete, setPendingProductDelete] = useState<ProductCardData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedButtonColor, setSavedButtonColor] = useState<string | undefined>(undefined);
  const [savedButtonRadius, setSavedButtonRadius] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const pendingNavRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current user ID for commerce config
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setCurrentUserId(session.user.id);
    });
  }, []);

  const {
    editorState, isLoading, error, sections, activePage, activePageId,
    setActivePageId, pageSettings, savePageSettings, isSavingPageSettings,
    updateSectionSchema, refreshEditor,
  } = useBuilderEditor(surfaceId);

  // ─── Per-page HTML storage ───
  // Store each page's HTML in metadata.pages_html[pageId]
  const getPageHtmlKey = useCallback((pageId: string) => `page_html_${pageId}`, []);

  const surfaceMeta = (editorState?.surface?.metadata as any) || {};
  const pagesHtml: Record<string, string> = surfaceMeta.pages_html || {};
  const mainHtml = surfaceMeta.builder_new_html || null;

  // Current page HTML: check pages_html first, then fall back to main builder_new_html
  const currentPageSavedHtml = activePageId
    ? (pagesHtml[activePageId] || mainHtml)
    : mainHtml;

  const [liveHtml, setLiveHtml] = useState<string | null>(null);
  const liveHtmlRef = useRef<string | null>(null);
  const { pushState, undo, redo, canUndo, canRedo, initHistory } = useEditorHistory(null);

  useEffect(() => {
    liveHtmlRef.current = liveHtml;
  }, [liveHtml]);

  // Bind ADA to real editor state for verified mutations
  const pushStateRef = useRef(pushState);
  pushStateRef.current = pushState;
  useEffect(() => {
    if (!editorState) return;
    const st = editorState.surface.surface_type || "emenu";
    const title = editorState.surface.title || "Untitled";
    adaChat.bindEditor({
      getHtml: () => liveHtmlRef.current,
      setHtml: (html: string) => {
        setLiveHtml(html);
        setHasUnsavedChanges(true);
        pushStateRef.current(html);
      },
      surfaceType: st,
      surfaceTitle: title,
    });
  }, [editorState, adaChat.bindEditor]);

  // Load HTML when page/surface changes
  useEffect(() => {
    if (!currentPageSavedHtml) {
      setLiveHtml(null);
      return;
    }

    if (currentPageSavedHtml.includes("blob:")) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const fixed = await persistBlobUrls(currentPageSavedHtml, session.user.id);
            setLiveHtml(fixed);
            initHistory(fixed);
          } else {
            setLiveHtml(currentPageSavedHtml);
            initHistory(currentPageSavedHtml);
          }
        } catch {
          setLiveHtml(currentPageSavedHtml);
          initHistory(currentPageSavedHtml);
        }
      })();
    } else {
      setLiveHtml(currentPageSavedHtml);
      initHistory(currentPageSavedHtml);
    }
  }, [currentPageSavedHtml, activePageId, initHistory]);


  const saveHtml = useCallback(async (html: string) => {
    if (!surfaceId || !html) return;
    setIsSaving(true);
    try {
      const stForSanitize = editorState?.surface?.surface_type;
      let persistedHtml = sanitizeEditorHtml(html, { surfaceType: stForSanitize });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        persistedHtml = await persistBlobUrls(persistedHtml, session.user.id);
      }

      const { data: surfData } = await supabase
        .from("builder_surfaces")
        .select("metadata")
        .eq("id", surfaceId)
        .single();
      
      const currentMeta = (surfData?.metadata as any) || {};
      const updatedPagesHtml = { ...(currentMeta.pages_html || {}) };

      if (activePageId) {
        updatedPagesHtml[activePageId] = persistedHtml;
      }

      await supabase.from("builder_surfaces").update({
        metadata: {
          ...currentMeta,
          builder_new_html: persistedHtml, // Always keep main html current
          pages_html: updatedPagesHtml,
        },
      }).eq("id", surfaceId);

      if (persistedHtml !== html) {
        setLiveHtml((current) => current === html ? persistedHtml : current);
      }

      if (liveHtmlRef.current === html) {
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Autosave failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [surfaceId, activePageId]);

  // Trigger autosave on changes
  useEffect(() => {
    if (!hasUnsavedChanges || !liveHtml) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveHtml(liveHtml);
    }, 3000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [hasUnsavedChanges, liveHtml, saveHtml]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (liveHtml) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveHtml(liveHtml);
      toast.success("Saved!");
    }
  }, [liveHtml, saveHtml]);

  // Keyboard shortcut: Ctrl+S, Ctrl+Z, Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undo();
        if (prev) { setLiveHtml(prev); setHasUnsavedChanges(true); }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey)) ) {
        e.preventDefault();
        const next = redo();
        if (next) { setLiveHtml(next); setHasUnsavedChanges(true); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleManualSave, undo, redo]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const safeNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) { pendingNavRef.current = path; setShowLeaveWarning(true); }
    else navigate(path);
  }, [hasUnsavedChanges, navigate]);

  const confirmLeave = useCallback(() => {
    setShowLeaveWarning(false);
    setHasUnsavedChanges(false);
    if (pendingNavRef.current) { navigate(pendingNavRef.current); pendingNavRef.current = null; }
  }, [navigate]);

  const handleCanvasSelection = useCallback((sel: CanvasSelection) => {
    // Body/HTML click → deselect (neutral state, no toolbar)
    if (sel.kind === "page" && (!sel.sectionIndex || sel.sectionIndex < 0)) {
      setCanvasSelection(null);
      return;
    }
    // Clicks on generic divs inside a section → treat as section selection
    if (sel.kind === "page" && sel.sectionIndex !== undefined && sel.sectionIndex >= 0) {
      // Preserve elRect so the Magic Editor floating toolbar can position itself.
      // (Audit Failure 4 / Root Cause B2.)
      setCanvasSelection({ ...sel, kind: "section", tag: "SECTION", nodeId: undefined, elRect: sel.elRect });
      return;
    }
    setCanvasSelection(sel);
  }, []);

  // Escape key deselects in parent window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCanvasSelection(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleHtmlChange = useCallback((html: string) => {
    setLiveHtml(html);
    setHasUnsavedChanges(true);
    pushState(html);
  }, [pushState]);

  // ─── Undo/Redo buttons ───
  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) { setLiveHtml(prev); setHasUnsavedChanges(true); }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) { setLiveHtml(next); setHasUnsavedChanges(true); }
  }, [redo]);

  // ─── Iframe helpers ───
  const getIframe = useCallback(() => document.querySelector<HTMLIFrameElement>('iframe[title="Editable Website Preview"]'), []);

  // ─── Read saved button style from iframe after HTML loads ───
  useEffect(() => {
    // Saved metadata wins — pre-select the persisted button style on load.
    const bs = (surfaceMeta as any)?.button_style;
    if (bs?.color) setSavedButtonColor(bs.color);
    if (bs?.borderRadius) setSavedButtonRadius(bs.borderRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState?.surface]);

  useEffect(() => {
    if (!liveHtml) return;
    const timer = setTimeout(() => {
      const iframe = getIframe();
      const iDoc = iframe?.contentDocument;
      if (!iDoc) return;
      const bodyColor = iDoc.body.getAttribute("data-product-button-color");
      const bodyRadius = iDoc.body.getAttribute("data-product-button-radius");
      const firstCard = iDoc.querySelector<HTMLElement>('[data-product-card="true"]');
      const cardColor = firstCard?.getAttribute("data-product-button-color");
      const cardRadius = firstCard?.getAttribute("data-product-button-radius");
      const color = cardColor || bodyColor;
      const radius = cardRadius || bodyRadius;
      if (color) setSavedButtonColor(color);
      if (radius) setSavedButtonRadius(radius);
    }, 800);
    return () => clearTimeout(timer);
  }, [liveHtml, getIframe]);


  const getSelectedElement = useCallback((doc: Document): HTMLElement | null => {
    if (canvasSelection?.nodeId) {
      const el = doc.querySelector(`[data-yangu-node-id="${canvasSelection.nodeId}"]`) as HTMLElement | null;
      if (el) return el;
    }
    return doc.querySelector('.yangu-el-selected') as HTMLElement
      || doc.querySelector('.yangu-btn-selected') as HTMLElement
      || doc.querySelector('.section-selected') as HTMLElement
      || null;
  }, [canvasSelection?.nodeId]);

  const clearIframeEditorDecorations = useCallback(() => {
    const iframe = getIframe();
    iframe?.contentWindow?.postMessage({ type: "clear-editor-selection" }, "*");
    setCanvasSelection(null);
  }, [getIframe]);

  const pushUpdate = useCallback((doc: Document, _iframe: HTMLIFrameElement | null) => {
    if (!doc) return;
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.yangu-editor-inject').forEach(el => el.remove());
    clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover,.yangu-card-selected,.yangu-product-card').forEach(el => {
      el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover','yangu-card-selected','yangu-product-card');
    });
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[data-yangu-node-id]').forEach(el => el.removeAttribute('data-yangu-node-id'));
    clone.querySelectorAll('[data-section-idx]').forEach(el => el.removeAttribute('data-section-idx'));
    clone.querySelectorAll('*').forEach(el => {
      const ca = el.getAttribute('class');
      if (ca !== null && !ca.trim()) el.removeAttribute('class');
    });
    const html = clone.outerHTML;
    setLiveHtml(html);
    setHasUnsavedChanges(true);
    pushState(html);
  }, [pushState]);

  const openProductEditor = useCallback((product: ProductCardData) => {
    setCanvasSelection(null);
    setPendingProductDelete(null);
    setEditingProduct(product);
  }, []);

  const openProductDeleteConfirm = useCallback((product: ProductCardData) => {
    setCanvasSelection(null);
    setEditingProduct(null);
    setPendingProductDelete(product);
  }, []);

  const handleProductSave = useCallback((product: ProductCardData) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const card = doc.querySelector(`[data-yangu-node-id="${product.nodeId}"]`) as HTMLElement | null;
    if (!card) {
      toast.error("Product card not found.");
      return;
    }

    card.setAttribute("data-product-card", "true");

    let nameElement = getProductScopedElement(card, "title", product.titleNodeId) || getProductNameElement(card);
    let priceElement = getProductScopedElement(card, "price", product.priceNodeId) || getProductPriceElement(card);
    let badgeElement = getProductScopedElement(card, "badge", product.badgeNodeId);
    let descriptionElement = getProductScopedElement(card, "description", product.descriptionNodeId) || getProductDescriptionElement(card, nameElement, priceElement);

    const contentAnchor = nameElement || descriptionElement || priceElement || badgeElement;
    const contentParent = contentAnchor?.parentElement || card;
    const trimmedName = product.name.trim();

    if (trimmedName) {
      card.setAttribute("data-product-title", trimmedName);
    } else {
      card.removeAttribute("data-product-title");
    }

    const normalizedName = normalizeProductNodeText(trimmedName);
    const allTitleNodes = Array.from(card.querySelectorAll<HTMLElement>('[data-product-role="title"]'));
    allTitleNodes.forEach((node) => {
      if (node === nameElement) return;
      const nodeText = normalizeProductNodeText(node.textContent);
      if (!normalizedName || nodeText === normalizedName) node.remove();
      else node.removeAttribute("data-product-role");
    });

    if (nameElement) {
      nameElement.textContent = trimmedName || nameElement.textContent || "Product";
      nameElement.setAttribute("data-product-role", "title");
    } else {
      const createdTitle = doc.createElement("h3");
      createdTitle.textContent = trimmedName || "Product";
      createdTitle.style.fontWeight = "700";
      createdTitle.style.margin = "0";
      createdTitle.style.lineHeight = "1.25";
      createdTitle.setAttribute("data-product-role", "title");

      if (descriptionElement && descriptionElement.parentElement === contentParent) {
        contentParent.insertBefore(createdTitle, descriptionElement);
      } else if (priceElement && priceElement.parentElement === contentParent) {
        contentParent.insertBefore(createdTitle, priceElement);
      } else {
        contentParent.appendChild(createdTitle);
      }

      nameElement = createdTitle;
    }

    if (priceElement) {
      if (product.price.trim()) {
        priceElement.textContent = formatProductPrice(product.price, priceElement.textContent || product.price, card, editorState?.surface?.metadata && (editorState.surface.metadata as any)?.currency);
        priceElement.setAttribute("data-product-role", "price");
      } else {
        priceElement.remove();
        priceElement = null;
      }
    } else if (product.price.trim() && contentParent) {
      const createdPrice = doc.createElement("span");
      createdPrice.textContent = formatProductPrice(product.price, product.price, card, editorState?.surface?.metadata && (editorState.surface.metadata as any)?.currency);
      createdPrice.style.fontWeight = "700";
      createdPrice.style.display = "inline-block";
      createdPrice.style.marginTop = "8px";
      createdPrice.setAttribute("data-product-role", "price");

      if (descriptionElement && descriptionElement.parentElement === contentParent) {
        descriptionElement.insertAdjacentElement("afterend", createdPrice);
      } else if (nameElement && nameElement.parentElement === contentParent) {
        nameElement.insertAdjacentElement("afterend", createdPrice);
      } else {
        contentParent.appendChild(createdPrice);
      }

      priceElement = createdPrice;
    }

    const trimmedDescription = product.description.trim();
    if (descriptionElement) {
      if (trimmedDescription) {
        descriptionElement.textContent = trimmedDescription;
        descriptionElement.setAttribute("data-product-role", "description");
      } else {
        descriptionElement.remove();
        descriptionElement = null;
      }
    } else if (trimmedDescription && contentParent) {
      const createdDescription = doc.createElement("p");
      createdDescription.textContent = trimmedDescription;
      createdDescription.style.fontSize = "0.85rem";
      createdDescription.style.opacity = "0.74";
      createdDescription.style.lineHeight = "1.6";
      createdDescription.style.marginTop = "8px";
      createdDescription.setAttribute("data-product-role", "description");

      if (priceElement && priceElement.parentElement === contentParent) {
        contentParent.insertBefore(createdDescription, priceElement);
      } else {
        contentParent.appendChild(createdDescription);
      }

      descriptionElement = createdDescription;
    }

    const trimmedBadgeText = (product.badgeText || "").trim();
    const shouldShowBadge = Boolean(product.badgeEnabled && trimmedBadgeText);
    if (shouldShowBadge) {
      if (badgeElement) {
        badgeElement.textContent = trimmedBadgeText;
        badgeElement.setAttribute("data-product-role", "badge");
      } else {
        const createdBadge = createProductBadgeElement(doc, trimmedBadgeText);
        const badgeParent = nameElement?.parentElement || contentParent;

        if (nameElement && badgeParent === nameElement.parentElement) {
          badgeParent.insertBefore(createdBadge, nameElement);
        } else {
          badgeParent.appendChild(createdBadge);
        }

        badgeElement = createdBadge;
      }

      card.setAttribute("data-product-badge-enabled", "true");
      card.setAttribute("data-product-badge-text", trimmedBadgeText);
    } else {
      if (badgeElement) {
        badgeElement.remove();
        badgeElement = null;
      }
      card.setAttribute("data-product-badge-enabled", "false");
      card.removeAttribute("data-product-badge-text");
    }

    removeDuplicateProductNameNodes(card, trimmedName || nameElement?.textContent || "", [
      nameElement,
      priceElement,
      descriptionElement,
      badgeElement,
    ]);

    card.setAttribute("data-product-cta", product.ctaAction?.trim() || "none");
    if (product.buttonText?.trim()) card.setAttribute("data-product-button-text", product.buttonText.trim());
    else card.removeAttribute("data-product-button-text");

    card.setAttribute("data-product-action-type", product.actionType?.trim() || "checkout");
    if (product.actionUrl?.trim()) card.setAttribute("data-product-action-url", product.actionUrl.trim());
    else card.removeAttribute("data-product-action-url");

    // Update image
    if (product.imageSrc) {
      const imgEl = card.querySelector("img") as HTMLImageElement | null;
      if (imgEl && imgEl.src !== product.imageSrc) {
        imgEl.src = product.imageSrc;
      }
      if (imgEl && trimmedName) {
        imgEl.alt = trimmedName;
      }
    }

    pushUpdate(doc, iframe);
    setEditingProduct(null);
    clearIframeEditorDecorations();
    toast.success("Product updated.");
  }, [clearIframeEditorDecorations, getIframe, pushUpdate, editorState]);

  const handleProductDelete = useCallback((product: ProductCardData) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const card = doc.querySelector(`[data-yangu-node-id="${product.nodeId}"]`) as HTMLElement | null;
    if (!card) {
      toast.error("Product card not found.");
      return;
    }

    card.remove();
    pushUpdate(doc, iframe);
    setPendingProductDelete(null);
    clearIframeEditorDecorations();
    toast.success("Product removed.");
  }, [clearIframeEditorDecorations, getIframe, pushUpdate]);


  // ─── Color picker state (opened from actions, applies to selected element) ───
  const [editorColorPickerOpen, setEditorColorPickerOpen] = useState(false);
  const [editorColorTarget, setEditorColorTarget] = useState<"text" | "button" | "section" | "page">("text");

  // ─── Background image picker state ───
  const [bgImagePickerOpen, setBgImagePickerOpen] = useState(false);
  const [bgImageTarget, setBgImageTarget] = useState<"section" | "image">("section");

  const applyBgImage = useCallback((url: string) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;
    if (!doc) return;

    if (bgImageTarget === "section") {
      // Always target the section-selected element (the parent section), not the child text/button
      let sec = doc.querySelector('.section-selected') as HTMLElement | null;
      if (!sec) sec = getSelectedElement(doc);
      // If we got a child element, walk up to the nearest section/header/footer/nav
      if (sec && !['SECTION','HEADER','FOOTER','NAV'].includes(sec.tagName)) {
        let parent = sec.parentElement;
        while (parent && parent !== doc.body) {
          if (['SECTION','HEADER','FOOTER','NAV'].includes(parent.tagName) || parent.classList.contains('section-selected')) {
            sec = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
      if (sec) {
        sec.style.backgroundImage = `url('${url}')`;
        sec.style.backgroundSize = "cover";
        sec.style.backgroundPosition = "center";
        sec.style.backgroundRepeat = "no-repeat";
        pushUpdate(doc, iframe);
        toast.success("Background image applied!");
      } else {
        toast.error("No section selected. Click a section first.");
      }
    } else {
      // Replace an <img> element's src
      const img = getSelectedElement(doc);
      if (img && img.tagName === "IMG") {
        (img as HTMLImageElement).src = url;
        pushUpdate(doc, iframe);
        toast.success("Image replaced!");
      }
    }
  }, [getIframe, pushUpdate, bgImageTarget, getSelectedElement]);

  const applyEditorColor = useCallback((color: string) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;
    if (!doc) return;

    if (editorColorTarget === "text") {
      const el = getSelectedElement(doc);
      if (el) { el.style.color = color; pushUpdate(doc, iframe); }
    } else if (editorColorTarget === "button") {
      const el = getSelectedElement(doc);
      if (el) {
        el.style.backgroundColor = color;
        el.style.color = isLightHex(color) ? "#1a1a1a" : "#ffffff";
        pushUpdate(doc, iframe);
      }
    } else if (editorColorTarget === "section") {
      const el = getSelectedElement(doc);
      if (el) { el.style.backgroundColor = color; pushUpdate(doc, iframe); }
    } else if (editorColorTarget === "page") {
      doc.body.style.backgroundColor = color;
      pushUpdate(doc, iframe);
    }
  }, [getIframe, pushUpdate, editorColorTarget, getSelectedElement]);

  // ─── Editor action handler (ALL actions wired) ───
  const handleEditorAction = useCallback((action: string, payload?: any) => {
    const iframe = getIframe();
    const doc = iframe?.contentDocument;

    // Use stable nodeId-based targeting
    const getSelected = (_cls: string) => doc ? getSelectedElement(doc) : null;

    switch (action) {
      // ── Section & element actions ──
      case "add_section":
        if (!doc) break;
        const newSection = doc.createElement("section");
        newSection.style.cssText = "padding:72px 24px;text-align:center;";
        newSection.innerHTML = `<div style="max-width:900px;margin:0 auto;"><h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;" contenteditable="true">New Section</h2><p style="color:#666;" contenteditable="true">Click to edit this section content.</p></div>`;
        newSection.classList.add("section-hover");
        const footer = doc.querySelector("footer");
        if (footer) footer.parentElement?.insertBefore(newSection, footer);
        else doc.body.appendChild(newSection);
        pushUpdate(doc, iframe);
        toast.success("Section added!");
        break;
      case "move_up":
      case "move_down":
      case "remove_section":
      case "delete_section":
      case "duplicate_section":
      case "delete_element":
      case "duplicate_element":
        iframe?.contentWindow?.postMessage({ type: "toolbar-action", action }, "*");
        break;

      case "edit_text":
        iframe?.contentWindow?.postMessage({ type: "toggle-edit-mode" }, "*");
        break;

      // ── Image actions ──
      case "replace_image":
      case "upload_image":
      case "stock_image":
      case "ai_generate_image":
        setBgImageTarget("image");
        setBgImagePickerOpen(true);
        break;

      // ── Color pickers — open dialog in parent, NOT postMessage ──
      case "open_text_color":
        setEditorColorTarget("text");
        setEditorColorPickerOpen(true);
        break;
      case "open_button_color":
      case "change_colors":
        if (canvasSelection?.kind === "button") {
          setEditorColorTarget("button");
        } else if (canvasSelection?.kind === "section") {
          setEditorColorTarget("section");
        } else {
          setEditorColorTarget("page");
        }
        setEditorColorPickerOpen(true);
        break;
      case "set_page_bg":
        setEditorColorTarget("page");
        setEditorColorPickerOpen(true);
        break;
      case "set_page_bg_color": {
        if (!doc) break;
        if (payload?.color) {
          doc.body.style.backgroundColor = payload.color;
          pushUpdate(doc, iframe);
        }
        break;
      }

      // ── Text style with toggle support ──
      case "set_text_style": {
        if (!doc) break;
        const textEl = getSelectedElement(doc);
        if (textEl && payload) {
          const iframeWin = iframe?.contentWindow;
          Object.entries(payload).forEach(([k, v]) => {
            const computed = iframeWin ? iframeWin.getComputedStyle(textEl).getPropertyValue(
              k.replace(/([A-Z])/g, '-$1').toLowerCase()
            ) : '';
            const current = (textEl.style as any)[k] || computed;
            // Toggle logic for italic
            if (k === "fontStyle") {
              (textEl.style as any)[k] = current === "italic" ? "normal" : "italic";
            }
            // Toggle logic for bold
            else if (k === "fontWeight") {
              const numWeight = parseInt(current, 10);
              const isBold = current === "bold" || numWeight >= 700;
              (textEl.style as any)[k] = isBold ? "400" : String(v);
            }
            // Toggle logic for underline
            else if (k === "textDecoration") {
              (textEl.style as any)[k] = current.includes("underline") ? "none" : String(v);
            }
            // Color from inline palette
            else if (k === "color") {
              textEl.style.color = String(v);
            }
            else {
              (textEl.style as any)[k] = v;
            }
          });
          pushUpdate(doc, iframe);
        }
        break;
      }

      // ── Button styles ──
      case "set_button_color": {
        if (!doc) break;
        const btn = getSelected("yangu-btn-selected");
        if (btn && payload?.color) {
          btn.style.backgroundColor = payload.color;
          btn.style.color = isLightHex(payload.color) ? "#1a1a1a" : "#ffffff";
          pushUpdate(doc, iframe);
        }
        break;
      }
      case "set_button_shape": {
        if (!doc) break;
        const btn = getSelected("yangu-btn-selected");
        if (btn && payload?.radius) { btn.style.borderRadius = payload.radius; pushUpdate(doc, iframe); }
        break;
      }
      case "set_button_size": {
        if (!doc) break;
        const btn = getSelected("yangu-btn-selected");
        if (btn && payload) {
          if (payload.padding) btn.style.padding = payload.padding;
          if (payload.fontSize) btn.style.fontSize = payload.fontSize;
          pushUpdate(doc, iframe);
        }
        break;
      }
      case "set_button_align": {
        if (!doc) break;
        const btn = getSelected("yangu-btn-selected");
        if (btn?.parentElement && payload?.align) {
          btn.parentElement.style.display = "flex";
          btn.parentElement.style.justifyContent = payload.align;
          pushUpdate(doc, iframe);
        }
        break;
      }

      // ── Section style (wired to selected section) ──
      case "set_section_style": {
        if (!doc) break;
        const sec = getSelected("section-selected");
        if (sec && payload) {
          Object.entries(payload).forEach(([k, v]) => {
            (sec.style as any)[k] = v;
          });
          pushUpdate(doc, iframe);
        }
        break;
      }
      case "set_section_bg_image": {
        setBgImageTarget("section");
        setBgImagePickerOpen(true);
        break;
      }

      // ── Image style (wired to selected image) ──
      case "set_image_style": {
        if (!doc) break;
        const img = getSelected("yangu-img-selected");
        if (img && payload) {
          Object.entries(payload).forEach(([k, v]) => {
            (img.style as any)[k] = v;
          });
          pushUpdate(doc, iframe);
        }
        break;
      }

      // ── Layout ──
      case "set_layout": {
        if (!doc) break;
        const menuGrid = doc.querySelector('[class*="menu-grid"], [class*="menu-items"], [style*="grid"]');
        if (menuGrid && payload?.mode === "list") {
          (menuGrid as HTMLElement).style.display = "flex";
          (menuGrid as HTMLElement).style.flexDirection = "column";
          (menuGrid as HTMLElement).style.gap = "16px";
          pushUpdate(doc, iframe);
        } else if (menuGrid && payload?.mode === "grid") {
          (menuGrid as HTMLElement).style.display = "grid";
          (menuGrid as HTMLElement).style.gridTemplateColumns = "repeat(2, 1fr)";
          (menuGrid as HTMLElement).style.gap = "24px";
          pushUpdate(doc, iframe);
        }
        break;
      }
      case "set_columns": {
        if (!doc) break;
        const grid = doc.querySelector('[style*="grid"]');
        if (grid && payload?.columns) {
          (grid as HTMLElement).style.gridTemplateColumns = `repeat(${payload.columns}, 1fr)`;
          pushUpdate(doc, iframe);
        }
        break;
      }

      // ── Menu item ──
      case "add_menu_item": {
        if (!doc) break;
        const menuContainer = doc.querySelector('[class*="menu-grid"], [class*="menu-items"], section:nth-of-type(2) [style*="grid"]');
        if (menuContainer) {
          const card = doc.createElement("div");
          card.className = "menu-item";
          card.style.cssText = "border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);";
          card.innerHTML = `
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" style="width:100%;height:180px;object-fit:cover;" />
            <div style="padding:16px;">
              <h3 contenteditable="true" style="font-size:1.1rem;font-weight:600;margin-bottom:4px;">New Item</h3>
              <p contenteditable="true" style="font-size:0.85rem;opacity:0.7;margin-bottom:8px;">Click to add description</p>
              <span contenteditable="true" style="font-weight:700;font-size:1rem;">$0.00</span>
            </div>`;
          menuContainer.appendChild(card);
          pushUpdate(doc, iframe);
          toast.success("Menu item added!");
        } else toast.info("Scroll to the menu section first");
        break;
      }

      // ── Category management ──
      case "add_category": {
        if (!doc) break;
        const catContainer = doc.querySelector('[class*="categor"], [class*="filter"], nav + div');
        if (catContainer) {
          const newCat = doc.createElement("button");
          newCat.textContent = "New Category";
          newCat.setAttribute("contenteditable", "true");
          newCat.style.cssText = "padding:8px 16px;border-radius:8px;font-size:0.85rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);cursor:pointer;color:inherit;";
          catContainer.appendChild(newCat);
          pushUpdate(doc, iframe);
          toast.success("Category added! Click to rename.");
        } else toast.info("No category container found in the template");
        break;
      }
      case "delete_category": {
        if (!doc) break;
        const sel = getSelected("yangu-btn-selected") || getSelected("yangu-el-selected");
        if (sel && sel.closest('[class*="categor"], [class*="filter"]')) {
          sel.remove();
          pushUpdate(doc, iframe);
          toast.success("Category removed");
        } else toast.info("Click a category button first, then delete");
        break;
      }

      // ── Business info (inline prompt edits) ──
      case "edit_business_name": {
        if (!doc) break;
        const h1 = doc.querySelector("h1, [class*='brand'], [class*='logo-text'], nav h1, header h1");
        if (h1) {
          const name = prompt("Restaurant name:", h1.textContent || "");
          if (name) { h1.textContent = name; pushUpdate(doc, iframe); }
        } else toast.info("No restaurant name element found");
        break;
      }
      case "edit_logo": {
        iframe?.contentWindow?.postMessage({ type: "open-image-picker" }, "*");
        break;
      }
      case "edit_phone": {
        if (!doc) break;
        const phoneEl = doc.querySelector('[href^="tel:"], [class*="phone"]');
        if (phoneEl) {
          const phone = prompt("Phone:", phoneEl.textContent || "");
          if (phone) {
            phoneEl.textContent = phone;
            if (phoneEl.tagName === "A") (phoneEl as HTMLAnchorElement).href = `tel:${phone}`;
            pushUpdate(doc, iframe);
          }
        } else toast.info("No phone element found in template");
        break;
      }
      case "edit_address": {
        if (!doc) break;
        const addrEl = doc.querySelector('[class*="address"], [class*="location"], footer p');
        if (addrEl) {
          const addr = prompt("Address:", addrEl.textContent || "");
          if (addr) { addrEl.textContent = addr; pushUpdate(doc, iframe); }
        } else toast.info("No address element found");
        break;
      }

      // ── Hours ──
      case "hours": {
        if (!doc) break;
        const hoursEl = doc.querySelector('[class*="hour"], [class*="schedule"], [class*="time"]');
        if (hoursEl) {
          const hours = prompt("Opening hours (e.g. Mon-Fri 9am-10pm):", hoursEl.textContent || "");
          if (hours) { hoursEl.textContent = hours; pushUpdate(doc, iframe); }
        } else {
          // Add hours to footer
          const footer = doc.querySelector("footer");
          if (footer) {
            const hours = prompt("Opening hours (e.g. Mon-Fri 9am-10pm):");
            if (hours) {
              const p = doc.createElement("p");
              p.textContent = hours;
              p.style.cssText = "font-size:0.85rem;opacity:0.7;margin-top:8px;";
              footer.appendChild(p);
              pushUpdate(doc, iframe);
            }
          }
        }
        break;
      }

      // ── Contact ──
      case "contact": {
        if (!doc) break;
        const contactSection = doc.querySelector('[class*="contact"], footer');
        if (contactSection) {
          const email = prompt("Email:", "");
          if (email) {
            const a = doc.createElement("a");
            a.href = `mailto:${email}`;
            a.textContent = email;
            a.style.cssText = "font-size:0.85rem;color:inherit;display:block;margin-top:4px;";
            contactSection.appendChild(a);
            pushUpdate(doc, iframe);
          }
        }
        break;
      }

      // ── Social links ──
      case "social": {
        if (!doc) break;
        const ig = prompt("Instagram URL:", "");
        const fb = prompt("Facebook URL:", "");
        const footer = doc.querySelector("footer");
        if (footer && (ig || fb)) {
          let socialDiv = doc.querySelector('[class*="social"]') as HTMLElement | null;
          if (!socialDiv) {
            socialDiv = doc.createElement("div");
            socialDiv.style.cssText = "display:flex;gap:12px;margin-top:12px;justify-content:center;";
            footer.appendChild(socialDiv);
          }
          if (ig) {
            const a = doc.createElement("a");
            a.href = ig; a.textContent = "Instagram"; a.target = "_blank";
            a.style.cssText = "color:inherit;font-size:0.85rem;opacity:0.7;";
            socialDiv.appendChild(a);
          }
          if (fb) {
            const a = doc.createElement("a");
            a.href = fb; a.textContent = "Facebook"; a.target = "_blank";
            a.style.cssText = "color:inherit;font-size:0.85rem;opacity:0.7;";
            socialDiv.appendChild(a);
          }
          pushUpdate(doc, iframe);
          toast.success("Social links added!");
        }
        break;
      }

      // CTA and ordering buttons are now managed via product popups, not Magic Editor
      case "add_cta_button":
      case "add_card_order_button":
      case "enable_section_ordering":
        toast.info("Product buttons are managed via the product edit popup.");
        break;

      case "set_product_button_style": {
        if (!doc) break;
        // Sync editor state so ButtonStylePanel stays in sync
        if (payload?.color) setSavedButtonColor(payload.color);
        if (payload?.borderRadius) setSavedButtonRadius(payload.borderRadius);
        // Persist style to builder_surfaces.metadata.button_style so it
        // survives editor reloads and propagates to the published page.
        if (surfaceId) {
          (async () => {
            try {
              const { data: surfData } = await supabase
                .from("builder_surfaces")
                .select("metadata")
                .eq("id", surfaceId)
                .single();
              const meta = (surfData?.metadata as any) || {};
              const prev = meta.button_style || {};
              await supabase.from("builder_surfaces").update({
                metadata: {
                  ...meta,
                  button_style: {
                    ...prev,
                    ...(payload?.color ? { color: payload.color } : {}),
                    ...(payload?.borderRadius ? { borderRadius: payload.borderRadius } : {}),
                    ...(payload?.padding ? { padding: payload.padding } : {}),
                    ...(payload?.fontSize ? { fontSize: payload.fontSize } : {}),
                    ...(typeof payload?.text === "string" ? { text: payload.text } : {}),
                    ...(typeof payload?.visible === "boolean" ? { visible: payload.visible } : {}),
                  },
                },
              }).eq("id", surfaceId);
            } catch (e) {
              console.error("[EmenuNewEditor] button_style persist failed:", e);
            }
          })();
        }
        iframe?.contentWindow?.postMessage({ type: "re-inject-product-controls" }, "*");
        // Small delay to let injection complete, then query
        setTimeout(() => {
          const iDoc = iframe?.contentDocument;
          if (!iDoc) return;
          const cards = Array.from(
            iDoc.querySelectorAll<HTMLElement>('[data-product-card="true"]')
          );

          if (cards.length === 0) {
            // Fallback: look for any card-like elements with images and prices
            const fallbackCards = Array.from(iDoc.querySelectorAll<HTMLElement>('div,article,li')).filter(el => {
              return el.querySelector('img') && el.querySelector('[data-product-role="price"]');
            });
            if (fallbackCards.length === 0) {
              toast.info("No product cards detected. Style preferences saved for future buttons.");
            }
            // Still store preferences as data attributes on body for future use
            if (payload?.color) iDoc.body.setAttribute("data-product-button-color", payload.color);
            if (payload?.borderRadius) iDoc.body.setAttribute("data-product-button-radius", payload.borderRadius);
            if (payload?.padding) iDoc.body.setAttribute("data-product-button-padding", payload.padding);
            if (payload?.fontSize) iDoc.body.setAttribute("data-product-button-font-size", payload.fontSize);
            pushUpdate(iDoc, iframe);
            return;
          }

          const selectedCard = iDoc.querySelector<HTMLElement>('.yangu-card-selected[data-product-card="true"]');
          const targetCards = payload?.global === false && selectedCard ? [selectedCard] : cards;

          targetCards.forEach((card) => {
            if (payload?.color) card.setAttribute("data-product-button-color", payload.color);
            if (payload?.borderRadius) card.setAttribute("data-product-button-radius", payload.borderRadius);
            if (payload?.padding) card.setAttribute("data-product-button-padding", payload.padding);
            if (payload?.fontSize) card.setAttribute("data-product-button-font-size", payload.fontSize);
          });

          pushUpdate(iDoc, iframe);
          toast.success("Button style updated!");
        }, 100);
        break;
      }

      case "order_settings": {
        // Redirect to the commerce config panel instead of browser prompts
        setLeftMode("commerce");
        break;
      }

      // ── Commerce config ──
      case "commerce_config": {
        setLeftMode("commerce");
        break;
      }
      // ── Page/settings ──
      case "page_settings":
      case "seo_meta":
        setSettingsOpen(true);
        break;

      // ── Module registry IDs → real actions ──
      case "menu_categories":
        handleEditorAction("add_category");
        break;
      case "menu_items":
        handleEditorAction("add_menu_item");
        break;
      case "food_image_ai":
        handleEditorAction("ai_generate_image");
        break;
      case "section_settings":
        if (doc) {
          const sec = getSelected("section-selected");
          if (sec) toast.info("Use the right panel to edit section styles");
          else toast.info("Click a section in preview first");
        }
        break;
      case "toggle_grid":
        handleEditorAction("set_layout", { mode: "grid" });
        break;

      // ── Link (from Magic Bar) ──
      case "set_link": {
        if (!doc) break;
        const linkEl = getSelectedElement(doc);
        if (linkEl && payload) {
          if (linkEl.tagName === "A") {
            (linkEl as HTMLAnchorElement).href = payload.value || "#";
            if (payload.openInNewTab) (linkEl as HTMLAnchorElement).target = "_blank";
            else (linkEl as HTMLAnchorElement).removeAttribute("target");
          } else {
            // Wrap in an anchor
            const a = doc.createElement("a");
            a.href = payload.value || "#";
            if (payload.openInNewTab) a.target = "_blank";
            linkEl.parentElement?.insertBefore(a, linkEl);
            a.appendChild(linkEl);
          }
          pushUpdate(doc, iframe);
          toast.success("Link applied!");
        }
        break;
      }

      // ── Ada prompt (from Magic Bar) ──
      case "ada_prompt": {
        toast.info(`Ada: "${payload?.prompt || "..."}" — processing coming soon`);
        break;
      }

      // ── Change layout (from Magic Bar section context) ──
      case "change_layout": {
        if (!doc) break;
        const sec = getSelectedElement(doc);
        if (!sec) {
          toast.warning("Layout change is not available for this section.");
          break;
        }
        // Check if section has a grid/flex container we can rearrange
        const grid = sec.querySelector("[style*='grid']") || sec.querySelector("[style*='flex']");
        if (!grid) {
          toast.warning("This section does not have a changeable layout.");
          break;
        }
        toast.info("Use the right panel to adjust this section's layout.");
        break;
      }

      default:
        toast.info(`${action} — coming soon`);
        break;
    }
  }, [getIframe, pushUpdate, getSelectedElement, canvasSelection]);

  // ─── Page switching handler ───
  const handlePageSwitch = useCallback((pageId: string) => {
    // Save current page's HTML first
    if (liveHtml && surfaceId && activePageId) {
      saveHtml(liveHtml);
    }
    setActivePageId(pageId);
    setCanvasSelection(null);
  }, [liveHtml, surfaceId, activePageId, saveHtml, setActivePageId]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-white/10 flex items-center px-4 gap-4" style={{ background: "#152A20" }}>
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex">
          <div className="w-72 border-r border-border p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-96 max-w-md mx-auto rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !editorState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Could not load editor</h1>
          <p className="text-sm text-muted-foreground mb-6">{error || "Surface not found"}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const surfaceType = (editorState.surface.surface_type || "quick_site") as BuilderSurfaceType;
  const surfaceTitle = editorState.surface.title || "Untitled";
  const sellerMode = getSellerMode(surfaceType);
  const builderCategory = BUILDER_CATEGORY_BY_SELLER_MODE[sellerMode.mode] || BUILDER_CATEGORY_BY_SURFACE_TYPE[surfaceType] || "esite";

  if (!liveHtml) {
    // If we have saved HTML that's still being initialized, show loading — not an error
    if (currentPageSavedHtml) {
      return (
        <div className="min-h-screen bg-background">
          <header className="h-14 border-b border-white/10 flex items-center px-4 gap-4" style={{ background: "#152A20" }}>
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-32" />
          </header>
          <div className="flex">
            <div className="w-72 border-r border-border p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
            <div className="flex-1 p-8">
              <Skeleton className="h-96 max-w-md mx-auto rounded-xl" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto" />
          <h1 className="text-xl font-bold">No template loaded</h1>
          <p className="text-sm text-muted-foreground">No template loaded — please rebuild from the dashboard.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {surfaceId && currentUserId && (
        <CompleteSetupBanner surfaceId={surfaceId} ownerId={currentUserId} />
      )}
      {/* ═══ TOP NAVBAR ═══ */}
      <header
        className="sticky top-0 z-40 h-14 border-b border-white/10 flex items-center px-3 lg:px-4 gap-2 lg:gap-3"
        style={{ background: "#152A20" }}
      >
        <button
          onClick={() => safeNavigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-6 w-px bg-white/20 hidden sm:block" />
        <h1 className="text-sm font-semibold text-white truncate">{surfaceTitle}</h1>
        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/10 text-white/70">
          {sellerMode.categoryBadge}
        </span>
        <div className="hidden lg:block">
          <BuilderPagesDropdown
            pages={editorState.pages}
            activePageId={activePageId}
            surfaceId={editorState.surface.id}
            onSwitch={handlePageSwitch}
            onRefresh={refreshEditor}
          />
        </div>
        <div className="flex-1" />

        {/* Save indicator */}
        <span className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-colors ${
          isSaving ? "text-amber-300 bg-amber-500/10" :
          hasUnsavedChanges ? "text-amber-300 bg-amber-500/10" :
          "text-green-300 bg-green-500/10"
        }`}>
          {isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved" : "Saved"}
        </span>

        {/* Undo / Redo — visible on all sizes */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-lg transition-colors ${canUndo ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed"}`}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={`p-1.5 rounded-lg transition-colors ${canRedo ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed"}`}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/20 hidden lg:block" />

        {/* Viewport toggle — visible on all sizes */}
        <div className="flex items-center border border-white/20 rounded-lg overflow-hidden">
          <button
            onClick={() => setPreviewViewport("desktop")}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs transition-colors ${
              previewViewport === "desktop" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPreviewViewport("mobile")}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs transition-colors ${
              previewViewport === "mobile" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Magic Editor toggle */}
        <button
          onClick={() => setMagicEditorOn(!magicEditorOn)}
          title={magicEditorOn ? "Magic Editor ON" : "Magic Editor OFF"}
          className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            magicEditorOn ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
        </button>

        {/* Ada AI toggle */}
        <Button
          size="sm"
          variant={leftMode === "ada" ? "default" : "outline"}
          className={`gap-2 hidden lg:flex border-white/20 ${
            leftMode === "ada"
              ? "bg-accent text-accent-foreground"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
          onClick={() => setLeftMode(leftMode === "ada" ? "tools" : "ada")}
        >
          <Sparkles className="h-4 w-4" /> <span className="hidden xl:inline">{leftMode === "ada" ? "Editor" : "Ada AI"}</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-1 hidden lg:flex border-white/20 text-white/80 hover:text-white hover:bg-white/10">
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => safeNavigate("/dashboard/my-business")} className="gap-1 hidden lg:flex border-white/20 text-white/80 hover:text-white hover:bg-white/10">
          <ClipboardList className="h-4 w-4" />
        </Button>
        {/* Live Preview — opens published page */}
        <button
          onClick={() => liveUrl && window.open(liveUrl, "_blank")}
          disabled={!liveUrl}
          title={liveUrl ? "View live page" : "Publish first to preview live"}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            liveUrl
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : "text-white/20 cursor-not-allowed"
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">{liveUrl ? "Live" : "Not published"}</span>
        </button>
        {/* Publish button — visible on all sizes */}
        <Button size="sm" onClick={() => setPublishOpen(true)} className="gap-1" style={{ background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)" }}>
          <Rocket className="h-4 w-4 text-white" /> <span className="text-white hidden sm:inline">Publish</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT PANEL ═══ */}
        <aside className="w-72 border-r border-border flex-col bg-sidebar overflow-y-auto hidden lg:flex">
          {leftMode === "commerce" ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Commerce & Payments</span>
                </div>
                <button onClick={() => setLeftMode("tools")} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CommerceConfigPanel
                surfaceId={surfaceId!}
                ownerId={currentUserId}
              />
            </div>
          ) : leftMode === "ada" ? (
            <Suspense fallback={<div className="p-4"><Skeleton className="h-8 w-32 mb-3" />{Array.from({length:5}).map((_,i)=>(<Skeleton key={i} className="h-12 w-full mb-2 rounded-lg" />))}</div>}>
              <AdaBuilderPanel
                messages={adaChat.messages}
                isLoading={adaChat.isLoading}
                onSend={adaChat.sendMessage}
                onClose={() => setLeftMode("tools")}
                category={builderCategory}
              />
            </Suspense>
          ) : (
            <EditorToolsPanel
              onToggleAdaChat={() => setLeftMode((prev) => prev === "ada" ? "tools" : "ada")}
              onAction={handleEditorAction}
              selectedSection={null}
              businessName={surfaceTitle}
              category={builderCategory}
              canvasSelection={canvasSelection}
            />
          )}
        </aside>

        {/* ═══ CENTER — Editable Preview ═══ */}
        <main className="flex-1 min-w-0 overflow-hidden relative">
          <EditablePreview
            html={liveHtml}
            onHtmlChange={handleHtmlChange}
            onSelectionChange={handleCanvasSelection}
            onProductEditRequest={openProductEditor}
            onProductDeleteRequest={openProductDeleteConfirm}
            showAddSectionControl={false}
            viewportMode={previewViewport}
            surfaceType={surfaceType}
          />

          {/* Magic Editor floating toolbar — only for text and section */}
          {magicEditorOn && canvasSelection && (canvasSelection.kind === "text" || canvasSelection.kind === "section") && canvasSelection.elRect && (() => {
            const iframe = getIframe();
            const iframeRect = iframe?.getBoundingClientRect();
            if (!iframeRect) return null;
            const mainEl = document.querySelector('main');
            const mainRect = mainEl?.getBoundingClientRect() || { top: 0, left: 0, width: 800 };
            const toolbarTop = iframeRect.top - mainRect.top + canvasSelection.elRect.top - 48;
            const toolbarLeft = iframeRect.left - mainRect.left + canvasSelection.elRect.left + canvasSelection.elRect.width / 2;

            let detectedColor: string | undefined;
            try {
              const doc = iframe?.contentDocument;
              if (doc) {
                const el = canvasSelection.nodeId
                  ? doc.querySelector(`[data-yangu-node-id="${canvasSelection.nodeId}"]`) as HTMLElement | null
                  : doc.querySelector('.yangu-el-selected, .section-selected') as HTMLElement | null;
                if (el && iframe?.contentWindow) {
                  const cs = iframe.contentWindow.getComputedStyle(el);
                  if (canvasSelection.kind === "text") {
                    detectedColor = cs.color;
                  } else if (canvasSelection.kind === "section") {
                    const sec = doc.querySelector('.section-selected') as HTMLElement | null;
                    if (sec) detectedColor = iframe.contentWindow.getComputedStyle(sec).backgroundColor;
                    else detectedColor = cs.backgroundColor;
                  } else {
                    detectedColor = cs.backgroundColor;
                  }
                }
              }
            } catch {}

            if (detectedColor) {
              const isTransparent = (c: string) =>
                !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(0,0,0,0)';
              if (isTransparent(detectedColor)) {
                try {
                  const iDoc = iframe?.contentDocument;
                  if (iDoc && iframe?.contentWindow) {
                    let walkEl: HTMLElement | null = canvasSelection.nodeId
                      ? iDoc.querySelector(`[data-yangu-node-id="${canvasSelection.nodeId}"]`) as HTMLElement | null
                      : iDoc.querySelector('.yangu-el-selected, .section-selected') as HTMLElement | null;
                    while (walkEl && walkEl !== iDoc.body) {
                      const bg = iframe.contentWindow!.getComputedStyle(walkEl).backgroundColor;
                      if (!isTransparent(bg)) { detectedColor = bg; break; }
                      walkEl = walkEl.parentElement;
                    }
                    if (isTransparent(detectedColor!)) {
                      const bodyBg = iframe.contentWindow!.getComputedStyle(iDoc.body).backgroundColor;
                      if (!isTransparent(bodyBg)) detectedColor = bodyBg;
                    }
                  }
                } catch {}
              }
            }

            return (
              <div
                className="absolute z-30"
                style={{
                  top: Math.max(4, toolbarTop),
                  left: Math.min(Math.max(120, toolbarLeft), (mainRect.width || 800) - 120),
                  transform: "translateX(-50%)",
                }}
              >
                <MagicEditorToolbar selection={canvasSelection} onAction={handleEditorAction} currentColor={detectedColor} adaMessages={adaChat.messages} adaIsLoading={adaChat.isLoading} onAdaSend={adaChat.sendMessage} />
              </div>
            );
          })()}
        </main>

        {/* ═══ RIGHT PANEL — context-aware (text/section only) ═══ */}
        <div className="w-[260px] shrink-0 hidden md:block overflow-hidden">
          {canvasSelection?.kind === "text" ? (
            <TextEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : canvasSelection?.kind === "section" ? (
            <SectionEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} sectionIndex={canvasSelection.sectionIndex} />
          ) : canvasSelection?.kind === "button" || canvasSelection?.kind === "card" ? (
            <ButtonStylePanel onAction={handleEditorAction} initialColor={savedButtonColor} initialRadius={savedButtonRadius} />
          ) : (
            <div className="flex flex-col h-full">
                <EmenuEditorPanel businessName={surfaceTitle} category={builderCategory} onAction={handleEditorAction} />
              <div className="border-t border-border">
                <ButtonStylePanel onAction={handleEditorAction} initialColor={savedButtonColor} initialRadius={savedButtonRadius} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Color Picker (for text/button/section/page colors) */}
      <EditorColorPickerDialog
        open={editorColorPickerOpen}
        onOpenChange={setEditorColorPickerOpen}
        onSelect={applyEditorColor}
      />

      {/* Background Image Picker */}
      <EditorImagePickerDialog
        open={bgImagePickerOpen}
        onOpenChange={setBgImagePickerOpen}
        onSelect={applyBgImage}
      />

      <ProductCardEditorModal
        open={!!editingProduct}
        product={editingProduct}
        surfaceType={surfaceType}
        onClose={() => {
          setEditingProduct(null);
          clearIframeEditorDecorations();
        }}
        onSave={handleProductSave}
      />

      <ProductDeleteConfirmModal
        open={!!pendingProductDelete}
        product={pendingProductDelete}
        onClose={() => {
          setPendingProductDelete(null);
          clearIframeEditorDecorations();
        }}
        onConfirm={handleProductDelete}
      />

      {/* Publish Modal — flush save before publish */}
      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
        defaultSlug={editorState.surface.slug}
        pages={editorState.pages}
        onBeforePublish={async () => {
          if (!liveHtml || !surfaceId) return false;
          // Force-save the latest editor HTML before publish
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          await saveHtml(liveHtml);
          return true;
        }}
      />

      {/* OLD Settings Drawer */}
      <BuilderSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        surfaceId={editorState.surface.id}
        surface={{
          title: editorState.surface.title || "",
          description: (editorState.surface as any).description || "",
          slug: editorState.surface.slug || "",
          metadata: (editorState.surface as any).metadata || {},
        }}
        onSaved={() => refreshEditor()}
      />

      {/* Unsaved changes warning */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Unsaved Changes</h3>
            <p className="text-sm text-muted-foreground">You have unsaved changes. If you leave now, autosave will try to save them, but you may lose recent edits.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowLeaveWarning(false)}>Stay</Button>
              <Button variant="destructive" size="sm" onClick={confirmLeave}>Leave Anyway</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
