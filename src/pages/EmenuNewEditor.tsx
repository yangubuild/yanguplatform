/**
 * EmenuNewEditor — Wraps the new builder editor (BuilderNewPage) for existing
 * emenu surfaces, reusing the OLD top navbar and OLD publish modal.
 * This is the real Emenu editor as of the Option B→new-editor switch.
 */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { persistBlobUrls } from "@/lib/builder/persistBlobUrls";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Monitor, Smartphone, Sparkles, Settings, ClipboardList, Rocket, Wrench, X } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { EditablePreview } from "@/components/builder-new/EditablePreview";
import { EditorToolsPanel } from "@/components/builder-new/EditorToolsPanel";
import { EmenuEditorPanel } from "@/components/builder-new/EmenuEditorPanel";
import { ButtonEditorPanel } from "@/components/builder-new/ButtonEditorPanel";
import { TextEditorPanel } from "@/components/builder-new/TextEditorPanel";
import { SectionEditorPanel } from "@/components/builder-new/SectionEditorPanel";
import { ImageEditorPanel } from "@/components/builder-new/ImageEditorPanel";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { getSellerMode } from "@/lib/builder/sellerModes";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";
import type { BuilderSurfaceType } from "@/types/builder";
import { toast } from "sonner";

type LeftMode = "tools" | "ada";
type PreviewViewport = "desktop" | "mobile";

export default function EmenuNewEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftMode, setLeftMode] = useState<LeftMode>("tools");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const {
    editorState,
    isLoading,
    error,
    sections,
    activePage,
    activePageId,
    setActivePageId,
    pageSettings,
    savePageSettings,
    isSavingPageSettings,
    updateSectionSchema,
    refreshEditor,
  } = useBuilderEditor(surfaceId);

  // Load the generated HTML from surface metadata
  const surfaceHtml = (editorState?.surface?.metadata as any)?.builder_new_html || null;

  // Build live HTML from sections if no builder_new_html
  const [liveHtml, setLiveHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!surfaceHtml) return;
    // If the saved HTML still has blob: URLs, try to persist them
    if (surfaceHtml.includes("blob:")) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const fixed = await persistBlobUrls(surfaceHtml, session.user.id);
            setLiveHtml(fixed);
            // Save the fixed HTML back to the surface metadata
            if (fixed !== surfaceHtml && surfaceId) {
              const currentMeta = (editorState?.surface?.metadata as any) || {};
              await supabase.from("builder_surfaces").update({
                metadata: { ...currentMeta, builder_new_html: fixed },
              }).eq("id", surfaceId);
            }
          } else {
            setLiveHtml(surfaceHtml);
          }
        } catch {
          setLiveHtml(surfaceHtml);
        }
      })();
    } else {
      setLiveHtml(surfaceHtml);
    }
  }, [surfaceHtml]);

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
    setCanvasSelection(sel);
  }, []);

  const handleHtmlChange = useCallback((html: string) => {
    setLiveHtml(html);
    setHasUnsavedChanges(true);
  }, []);

  // Editor action handler
  const getIframe = useCallback(() => document.querySelector<HTMLIFrameElement>('iframe[title="Editable Website Preview"]'), []);

  const pushUpdate = useCallback((doc: Document, iframe: HTMLIFrameElement | null) => {
    if (doc && iframe) {
      const html = doc.documentElement.outerHTML;
      setLiveHtml(html);
      setHasUnsavedChanges(true);
    }
  }, []);

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
      case "set_button_color": {
        if (!doc) break;
        const btnSel = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btnSel && payload?.color) {
          btnSel.style.backgroundColor = payload.color;
          const isLight = payload.color === "#ffffff" || payload.color === "#d4a853";
          btnSel.style.color = isLight ? "#1a1a1a" : "#ffffff";
          pushUpdate(doc, iframe);
        } else toast.info("Click a button in the preview first");
        break;
      }
      case "set_button_shape": {
        if (!doc) break;
        const btn = doc.querySelector('.yangu-btn-selected') as HTMLElement | null;
        if (btn && payload?.radius) { btn.style.borderRadius = payload.radius; pushUpdate(doc, iframe); }
        else toast.info("Click a button in the preview first");
        break;
      }
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
      case "page_settings":
      case "seo_meta":
        setSettingsOpen(true);
        break;
      default:
        toast.info(`${action} — coming soon`);
        break;
    }
  }, [getIframe, pushUpdate]);

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

  // If no generated HTML exists, show a fallback message
  if (!liveHtml) {
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
      {/* ═══ OLD TOP NAVBAR — dark green, reused exactly ═══ */}
      <header
        className="sticky top-0 z-40 h-14 border-b border-white/10 flex items-center px-3 lg:px-4 gap-2 lg:gap-4"
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
        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70">
          {sellerMode.categoryBadge}
        </span>
        <div className="hidden lg:block">
          <BuilderPagesDropdown
            pages={editorState.pages}
            activePageId={activePageId}
            surfaceId={editorState.surface.id}
            onSwitch={setActivePageId}
            onRefresh={refreshEditor}
          />
        </div>
        <div className="flex-1" />

        {/* Viewport toggle */}
        <div className="hidden lg:flex items-center border border-white/20 rounded-md overflow-hidden">
          <button
            onClick={() => setPreviewViewport("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewViewport === "desktop" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            onClick={() => setPreviewViewport("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewViewport === "mobile" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>

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
          <Sparkles className="h-4 w-4" /> {leftMode === "ada" ? "Back to Editor" : "Edit with Ada AI"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2 hidden lg:flex border-white/20 text-white/80 hover:text-white hover:bg-white/10">
          <Settings className="h-4 w-4" /> Settings
        </Button>
        <Button size="sm" variant="outline" onClick={() => safeNavigate("/dashboard/my-business")} className="gap-2 hidden lg:flex border-white/20 text-white/80 hover:text-white hover:bg-white/10">
          <ClipboardList className="h-4 w-4" /> View Orders
        </Button>
        <Button size="sm" onClick={() => setPublishOpen(true)} className="gap-2 hidden lg:flex" style={{ background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)" }}>
          <Rocket className="h-4 w-4 text-white" /> <span className="text-white">Publish</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT PANEL ═══ */}
        <aside className="w-72 border-r border-border flex-col bg-sidebar overflow-y-auto hidden lg:flex">
          {leftMode === "ada" ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">Ada AI</span>
                </div>
                <button onClick={() => setLeftMode("tools")} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <Sparkles className="h-8 w-8 text-accent mx-auto" />
                  <p className="text-sm font-medium">Ada AI Editor</p>
                  <p className="text-xs text-muted-foreground">
                    Describe changes to your menu and Ada will apply them.
                  </p>
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground italic">Full Ada AI editing — coming soon</p>
                  </div>
                </div>
              </div>
            </div>
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
        <main className="flex-1 min-w-0 overflow-hidden">
          <EditablePreview
            html={liveHtml}
            onHtmlChange={handleHtmlChange}
            onSelectionChange={handleCanvasSelection}
            viewportMode={previewViewport}
          />
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

      {/* OLD Publish Modal — reused exactly */}
      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
        defaultSlug={editorState.surface.slug}
        pages={editorState.pages}
      />

      {/* OLD Settings Drawer — reused exactly */}
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
            <h3 className="text-lg font-semibold">Unpublished Changes</h3>
            <p className="text-sm text-muted-foreground">You have unpublished changes. If you leave now you may lose them.</p>
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
