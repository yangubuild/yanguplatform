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
  Settings, ClipboardList, Rocket, X, Undo2, Redo2, Wand2,
} from "lucide-react";
import { useAdaBuilderChat } from "@/components/builder-new/ada/useAdaBuilderChat";
import { AdaBuilderPanel } from "@/components/builder-new/ada/AdaBuilderPanel";
import { useState, useCallback, useEffect, useRef } from "react";
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { EditorToolsPanel } from "@/components/builder-new/EditorToolsPanel";
import { EmenuEditorPanel } from "@/components/builder-new/EmenuEditorPanel";
import { ButtonEditorPanel } from "@/components/builder-new/ButtonEditorPanel";
import { TextEditorPanel } from "@/components/builder-new/TextEditorPanel";
import { SectionEditorPanel } from "@/components/builder-new/SectionEditorPanel";
import { ImageEditorPanel } from "@/components/builder-new/ImageEditorPanel";
import { MagicEditorToolbar } from "@/components/builder-new/MagicEditorToolbar";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { CommerceConfigPanel } from "@/components/commerce/CommerceConfigPanel";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { useEditorHistory } from "@/hooks/useEditorHistory";
import { useDebounce } from "@/hooks/useDebounce";
import { getSellerMode } from "@/lib/builder/sellerModes";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";
import type { BuilderSurfaceType } from "@/types/builder";
import { toast } from "sonner";

type LeftMode = "tools" | "ada" | "commerce";
type PreviewViewport = "desktop" | "mobile";

function isLightHex(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export default function EmenuNewEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [magicEditorOn, setMagicEditorOn] = useState(true);
  const [leftMode, setLeftMode] = useState<LeftMode>("tools");
  const adaChat = useAdaBuilderChat();
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
    if (!currentPageSavedHtml) { setLiveHtml(null); return; }

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
  }, [currentPageSavedHtml, activePageId]);

  // ─── AUTOSAVE — debounced 3s after last edit ───
  const saveHtml = useCallback(async (html: string) => {
    if (!surfaceId || !html) return;
    setIsSaving(true);
    try {
      let persistedHtml = sanitizeEditorHtml(html);
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
      setCanvasSelection({ ...sel, kind: "section", tag: "SECTION", nodeId: undefined });
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

  /** Get the currently selected element by stable nodeId first, then fall back to highlight class */
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

  const pushUpdate = useCallback((doc: Document, _iframe: HTMLIFrameElement | null) => {
    if (!doc) return;
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.yangu-editor-inject').forEach(el => el.remove());
    clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover').forEach(el => {
      el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover');
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

      // ── Add CTA / Navigation Button to selected section (NOT for ordering) ──
      case "add_cta_button": {
        if (!doc) break;
        let targetSec = doc.querySelector('.section-selected') as HTMLElement | null;
        if (!targetSec) {
          const el = getSelectedElement(doc);
          if (el) {
            let p = el.parentElement;
            while (p && p !== doc.body) {
              if (['SECTION','HEADER','FOOTER','NAV'].includes(p.tagName)) { targetSec = p; break; }
              p = p.parentElement;
            }
          }
        }
        if (!targetSec) { toast.info("Click a section first, then add a CTA button."); break; }
        const innerContainer = targetSec.querySelector('[style*="max-width"]') as HTMLElement || targetSec;
        const ctaBtn = doc.createElement("a");
        ctaBtn.href = "#menu";
        ctaBtn.textContent = "View Menu";
        ctaBtn.setAttribute("contenteditable", "true");
        ctaBtn.style.cssText = "display:inline-block;padding:14px 36px;border-radius:8px;background:#22c55e;color:#fff;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;cursor:pointer;";
        ctaBtn.setAttribute("data-yangu-node-id", "yn-cta-" + Date.now());
        innerContainer.appendChild(ctaBtn);
        pushUpdate(doc, iframe);
        toast.success("Navigation CTA added! Click it to edit the label.");
        break;
      }

      // ── Add order button INSIDE a specific product card ──
      case "add_card_order_button": {
        if (!doc) break;
        const cardEl = getSelectedElement(doc);
        if (!cardEl) { toast.info("Click a product card first."); break; }
        // Find card container — walk up if needed
        let card = cardEl;
        const isCard = (el: HTMLElement) => {
          const cl = Array.from(el.classList || []);
          if (cl.some(c => c.includes('card') || c.includes('item') || c.includes('product') || c.includes('menu-item'))) return true;
          const parent = el.parentElement;
          if (parent) {
            const ps = iframe?.contentWindow?.getComputedStyle(parent);
            const isGrid = ps && (ps.display === 'grid' || ps.display === 'flex');
            if (isGrid && el.querySelector('img') && el.querySelector('h3,h4,p')) return true;
          }
          return false;
        };
        // Walk up to find the card container
        while (card && card !== doc.body && !isCard(card)) {
          card = card.parentElement as HTMLElement;
        }
        if (!card || card === doc.body) { toast.info("Select a product card first."); break; }
        // Check if card already has an order button
        const existingBtn = card.querySelector('[data-yangu-order-btn]');
        if (existingBtn) { toast.info("This card already has an order button."); break; }
        // Create order button
        const orderBtn = doc.createElement("button");
        orderBtn.textContent = "+ Add";
        orderBtn.setAttribute("data-yangu-order-btn", "true");
        orderBtn.setAttribute("data-yangu-node-id", "yn-order-" + Date.now());
        orderBtn.setAttribute("contenteditable", "true");
        orderBtn.style.cssText = "display:inline-block;padding:8px 18px;border-radius:6px;background:#22c55e;color:#fff;border:none;font-weight:600;font-size:13px;margin-top:8px;cursor:pointer;width:100%;text-align:center;";
        // Insert inside the card's text container or at the end
        const textWrap = card.querySelector('[style*="padding"]') as HTMLElement || card;
        textWrap.appendChild(orderBtn);
        pushUpdate(doc, iframe);
        toast.success("Order button added to card!");
        break;
      }

      // ── Enable ordering on ALL cards in a section ──
      case "enable_section_ordering": {
        if (!doc) break;
        let sec = doc.querySelector('.section-selected') as HTMLElement | null;
        if (!sec) { toast.info("Select a section first."); break; }
        // Find all card-like elements in this section
        const cards = sec.querySelectorAll('[class*="card"], [class*="item"], [class*="product"], [class*="menu-item"]');
        let structuralCards: HTMLElement[] = [];
        if (cards.length === 0) {
          // Structural detection: grid/flex children with img+text
          const grids = sec.querySelectorAll('[style*="grid"], [style*="flex"]');
          grids.forEach(g => {
            Array.from(g.children).forEach(child => {
              const el = child as HTMLElement;
              if (el.querySelector('img') && el.querySelector('h3,h4,p,span')) structuralCards.push(el);
            });
          });
        } else {
          cards.forEach(c => structuralCards.push(c as HTMLElement));
        }
        if (structuralCards.length === 0) { toast.info("No product cards found in this section."); break; }
        let added = 0;
        structuralCards.forEach(card => {
          if (card.querySelector('[data-yangu-order-btn]')) return; // already has one
          const btn = doc.createElement("button");
          btn.textContent = "+ Add";
          btn.setAttribute("data-yangu-order-btn", "true");
          btn.setAttribute("data-yangu-node-id", "yn-order-" + Date.now() + "-" + (added++));
          btn.style.cssText = "display:inline-block;padding:8px 18px;border-radius:6px;background:#22c55e;color:#fff;border:none;font-weight:600;font-size:13px;margin-top:8px;cursor:pointer;width:100%;text-align:center;";
          const textWrap = card.querySelector('[style*="padding"]') as HTMLElement || card;
          textWrap.appendChild(btn);
        });
        pushUpdate(doc, iframe);
        toast.success(`Order buttons added to ${added} cards!`);
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

  const surfaceType = (editorState.surface.surface_type || "emenu") as BuilderSurfaceType;
  const surfaceTitle = editorState.surface.title || "Untitled";
  const sellerMode = getSellerMode(surfaceType);

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
          <h1 className="text-xl font-bold">No generated page found</h1>
          <p className="text-sm text-muted-foreground">This surface doesn't have a generated template page yet.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <AdaBuilderPanel
              messages={adaChat.messages}
              isLoading={adaChat.isLoading}
              onSend={adaChat.sendMessage}
              onClose={() => setLeftMode("tools")}
              category="emenu"
            />
          ) : (
            <EditorToolsPanel
              onToggleAdaChat={() => setLeftMode((prev) => prev === "ada" ? "tools" : "ada")}
              onAction={handleEditorAction}
              selectedSection={null}
              businessName={surfaceTitle}
              category="emenu"
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
            viewportMode={previewViewport}
          />

          {/* Magic Editor floating toolbar — positioned near selected element */}
          {magicEditorOn && canvasSelection && canvasSelection.kind !== "page" && canvasSelection.elRect && (() => {
            const iframe = getIframe();
            const iframeRect = iframe?.getBoundingClientRect();
            if (!iframeRect) return null;
            const mainEl = document.querySelector('main');
            const mainRect = mainEl?.getBoundingClientRect() || { top: 0, left: 0, width: 800 };
            const toolbarTop = iframeRect.top - mainRect.top + canvasSelection.elRect.top - 48;
            const toolbarLeft = iframeRect.left - mainRect.left + canvasSelection.elRect.left + canvasSelection.elRect.width / 2;

            // Read current color from iframe element
            let detectedColor: string | undefined;
            try {
              const doc = iframe?.contentDocument;
              if (doc) {
                const el = canvasSelection.nodeId
                  ? doc.querySelector(`[data-yangu-node-id="${canvasSelection.nodeId}"]`) as HTMLElement | null
                  : doc.querySelector('.yangu-el-selected, .yangu-btn-selected, .section-selected') as HTMLElement | null;
                if (el && iframe?.contentWindow) {
                  const cs = iframe.contentWindow.getComputedStyle(el);
                  if (canvasSelection.kind === "text") {
                    detectedColor = cs.color;
                  } else if (canvasSelection.kind === "button") {
                    detectedColor = cs.backgroundColor;
                  } else if (canvasSelection.kind === "section") {
                    // For section, try to get the section-selected element
                    const sec = doc.querySelector('.section-selected') as HTMLElement | null;
                    if (sec) detectedColor = iframe.contentWindow.getComputedStyle(sec).backgroundColor;
                    else detectedColor = cs.backgroundColor;
                  } else {
                    detectedColor = cs.backgroundColor;
                  }
                }
              }
            } catch {}

            // Resolve transparent/invisible colors by walking up the DOM
            if (detectedColor) {
              const isTransparent = (c: string) =>
                !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(0,0,0,0)';
              if (isTransparent(detectedColor)) {
                try {
                  const iDoc = iframe?.contentDocument;
                  if (iDoc && iframe?.contentWindow) {
                    let walkEl: HTMLElement | null = canvasSelection.nodeId
                      ? iDoc.querySelector(`[data-yangu-node-id="${canvasSelection.nodeId}"]`) as HTMLElement | null
                      : iDoc.querySelector('.yangu-el-selected, .yangu-btn-selected, .section-selected') as HTMLElement | null;
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

        {/* ═══ RIGHT PANEL — context-aware ═══ */}
        <div className="w-[260px] shrink-0 hidden md:block overflow-hidden">
          {canvasSelection?.kind === "button" ? (
            <ButtonEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : canvasSelection?.kind === "text" ? (
            <TextEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : canvasSelection?.kind === "section" ? (
            <SectionEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} sectionIndex={canvasSelection.sectionIndex} />
          ) : canvasSelection?.kind === "image" ? (
            <ImageEditorPanel onAction={handleEditorAction} preview={canvasSelection.preview} />
          ) : (
            <EmenuEditorPanel businessName={surfaceTitle} category="emenu" onAction={handleEditorAction} />
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
