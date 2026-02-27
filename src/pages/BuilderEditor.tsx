import { useParams, useNavigate } from "react-router-dom";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { BuilderSectionList } from "@/components/builder/BuilderSectionList";
import { BuilderAddSection } from "@/components/builder/BuilderAddSection";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { BuilderPageEditPanel } from "@/components/builder/BuilderPageEditPanel";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Rocket,
  LayoutGrid,
  AlertTriangle,
  Settings,
  ClipboardList,
  Sparkles,
  FileText,
  Layout,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { BuilderSurfaceType } from "@/types/builder";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderSectionEditor } from "@/components/builder/BuilderSectionEditor";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { BuilderSetupAnswersPanel } from "@/components/builder/panels/BuilderSetupAnswersPanel";
import { toast } from "sonner";

type RightPanel = "none" | "page_edit" | "section" | "setup";
type PreviewViewport = "desktop" | "mobile";

export default function BuilderEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("page_edit");
  const [showAiBanner, setShowAiBanner] = useState(false);
  const [liveSchemaOverride, setLiveSchemaOverride] = useState<{ sectionId: string; schema: Record<string, unknown> } | null>(null);
  const [livePageSettings, setLivePageSettings] = useState<import("@/config/builderCoreSections").PageEditSettings | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  // Track unsaved changes
  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);
  const markClean = useCallback(() => setHasUnsavedChanges(false), []);

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
    addSection,
    addSectionWithSchema,
    isAdding,
    reorderSections,
    updateSectionSchema,
    toggleSectionVisibility,
    deleteSection,
    isSavingSection,
    refreshEditor,
    switchMainContent,
    isSwitching,
    currentMainContentType,
  } = useBuilderEditor(surfaceId);

  // Show AI banner on first load if surface was AI-generated
  useEffect(() => {
    if (editorState?.surface?.metadata) {
      const meta = editorState.surface.metadata as Record<string, unknown>;
      if (meta.ai_setup) {
        setShowAiBanner(true);
        const t = setTimeout(() => setShowAiBanner(false), 8000);
        return () => clearTimeout(t);
      }
    }
  }, [editorState?.surface?.id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const safeNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      pendingNavRef.current = path;
      setShowLeaveWarning(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  const confirmLeave = useCallback(() => {
    setShowLeaveWarning(false);
    setHasUnsavedChanges(false);
    if (pendingNavRef.current) {
      navigate(pendingNavRef.current);
      pendingNavRef.current = null;
    }
  }, [navigate]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex">
          <div className="w-72 border-r border-border p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-96 max-w-md mx-auto rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error
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

  const surfaceType = (editorState.surface.surface_type || "live_bio") as BuilderSurfaceType;
  const surfaceTitle = editorState.surface.title || "Untitled";
  const builderTheme = getThemeFromMetadata(editorState.surface.metadata);
  const surfaceMeta = (editorState.surface.metadata || {}) as Record<string, unknown>;
  const hasAiSetup = !!surfaceMeta.ai_setup;
  const aiAnswers = (surfaceMeta.ai_answers || {}) as Record<string, unknown>;
  const aiSource = surfaceMeta.ai_source as string | undefined;
  const industry = (surfaceMeta.industry as string) || null;

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    setRightPanel("section");
  };

  const handleUpdateAnswers = (updated: Record<string, unknown>) => {
    toast.success("Answers updated — content will reflect changes on next save.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* AI setup banner */}
      {showAiBanner && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">AI Setup Completed</span>
            <span className="text-muted-foreground">— review & edit anything.</span>
          </div>
          <button onClick={() => setShowAiBanner(false)} className="text-muted-foreground hover:text-foreground text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-4">
        <button
          onClick={() => safeNavigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <div className="h-6 w-px bg-border" />
        <h1 className="text-sm font-semibold truncate">{surfaceTitle}</h1>
        <BuilderPagesDropdown
          pages={editorState.pages}
          activePageId={activePageId}
          surfaceId={editorState.surface.id}
          onSwitch={setActivePageId}
          onRefresh={refreshEditor}
        />
        <div className="flex-1" />

        {/* Viewport toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setPreviewViewport("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewViewport === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            onClick={() => setPreviewViewport("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewViewport === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>

        {/* Edit with Ada AI button */}
        <Button size="sm" variant="outline" className="gap-2" onClick={() => toast.info("AI chat editor coming soon!")}>
          <Sparkles className="h-4 w-4" /> Edit with Ada AI
        </Button>

        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" /> Settings
        </Button>
        <Button size="sm" variant="outline" onClick={() => safeNavigate("/dashboard/my-business")} className="gap-2">
          <ClipboardList className="h-4 w-4" /> View Orders
        </Button>
        <Button size="sm" onClick={() => { setPublishOpen(true); markClean(); }} className="gap-2">
          <Rocket className="h-4 w-4" /> Publish
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Sections */}
        <aside className="w-72 border-r border-border flex flex-col bg-sidebar overflow-y-auto">
          {/* Page Edit trigger */}
          <button
            onClick={() => {
              setSelectedSectionId(null);
              setRightPanel("page_edit");
            }}
            className={`m-3 mb-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
              rightPanel === "page_edit"
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30 bg-card"
            }`}
          >
            <Layout className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Page Edit</span>
          </button>

          <div className="p-4 pb-1 border-b border-border mt-3">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Sections</h2>
            </div>
            <p className="text-xs text-muted-foreground">Core sections are fixed • Custom sections below</p>
          </div>
          <div className="flex-1 p-3">
            <BuilderSectionList
              sections={sections}
              onReorder={reorderSections}
              selectedId={selectedSectionId}
              surfaceType={surfaceType}
              onSelect={handleSelectSection}
              onSwitchMainContent={switchMainContent}
              currentMainContentType={currentMainContentType}
              industry={industry}
              onVariantChange={async (sectionId, displayMode) => {
                const section = sections.find((s) => s.id === sectionId);
                if (!section) return;
                const newSchema = { ...section.schema, display_mode: displayMode };
                await updateSectionSchema(sectionId, newSchema);
              }}
              onDelete={async (id) => {
                const ok = await deleteSection(id);
                if (ok && selectedSectionId === id) {
                  setSelectedSectionId(null);
                  setRightPanel("page_edit");
                }
                return ok;
              }}
            />
          </div>
          <div className="p-3 border-t border-border">
            <BuilderAddSection onAdd={addSection} onAddWithSchema={addSectionWithSchema} isAdding={isAdding || isSwitching} surfaceType={surfaceType} />
          </div>
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className={`mx-auto transition-all ${previewViewport === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
          <BuilderPreview
            sections={sections}
            surfaceTitle={surfaceTitle}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            theme={builderTheme}
            pageSettings={livePageSettings || pageSettings}
            liveSchemaOverride={liveSchemaOverride}
            previewViewport={previewViewport}
            onUpdateSectionField={async (sectionId, fieldPath, value) => {
              const section = sections.find((s) => s.id === sectionId);
              if (!section) return;
              const newSchema = { ...section.schema, [fieldPath]: value };
              await updateSectionSchema(sectionId, newSchema);
              markDirty();
            }}
            onHideSection={async (sectionId) => {
              await toggleSectionVisibility(sectionId, true);
            }}
            onDeleteSection={async (sectionId) => {
              const ok = await deleteSection(sectionId);
              if (ok && selectedSectionId === sectionId) {
                setSelectedSectionId(null);
                setRightPanel("page_edit");
              }
            }}
            onImageReplace={async (sectionId, fieldPath, url) => {
              const section = sections.find((s) => s.id === sectionId);
              if (!section) return;
              const newSchema = { ...section.schema };
              if (fieldPath === "media.url") {
                const media = (newSchema.media as Record<string, unknown>) || {};
                newSchema.media = { ...media, url, type: "image" };
              } else if (fieldPath.startsWith("items.")) {
                const idx = parseInt(fieldPath.split(".")[1], 10);
                const items = [...((newSchema.items as any[]) || [])];
                if (idx < items.length) {
                  const item = typeof items[idx] === "string" ? { src: url } : { ...items[idx], src: url };
                  items[idx] = item;
                } else {
                  items.push({ src: url });
                }
                newSchema.items = items;
              } else if (fieldPath.startsWith("products.") && fieldPath.endsWith(".image")) {
                const idx = parseInt(fieldPath.split(".")[1], 10);
                const key = newSchema.products ? "products" : "items";
                const items = [...((newSchema[key] as any[]) || [])];
                if (idx < items.length) {
                  items[idx] = { ...items[idx], image_url: url };
                }
                newSchema[key] = items;
              } else {
                (newSchema as any)[fieldPath] = url;
              }
              await updateSectionSchema(sectionId, newSchema);
              markDirty();
            }}
          />
          </div>
        </main>

        {/* Right panel */}
        {rightPanel === "page_edit" && (
          <BuilderPageEditPanel
            settings={pageSettings}
            onSave={async (s) => {
              await savePageSettings(s);
              setLivePageSettings(null);
            }}
            onClose={() => setRightPanel("none")}
            isSaving={isSavingPageSettings}
            onLocalChange={setLivePageSettings}
            surfaceType={surfaceType}
            sections={sections}
            onApplyTemplate={async (sectionId, schema) => {
              await updateSectionSchema(sectionId, schema);
            }}
            onToggleVisible={async (sectionId) => {
              await toggleSectionVisibility(sectionId, true);
            }}
            onCreateSection={async (sectionType, schema, coreSlot) => {
              await addSectionWithSchema(sectionType, schema, { coreSlot });
            }}
          />
        )}
        {rightPanel === "setup" && hasAiSetup && (
          <BuilderSetupAnswersPanel
            answers={aiAnswers}
            source={aiSource}
            onClose={() => setRightPanel("none")}
            onUpdate={handleUpdateAnswers}
          />
        )}
        {rightPanel === "section" && selectedSectionId && (() => {
          const sec = sections.find((s) => s.id === selectedSectionId);
          if (!sec || sec.isMissing) return null;
          return (
            <BuilderSectionEditor
              key={sec.id}
              section={sec}
              onClose={() => { setSelectedSectionId(null); setRightPanel("page_edit"); setLiveSchemaOverride(null); }}
              onSave={async (id, schema) => {
                await updateSectionSchema(id, schema);
                setLiveSchemaOverride(null);
              }}
              onToggleVisibility={toggleSectionVisibility}
              onLocalSchemaChange={(id, schema) => setLiveSchemaOverride({ sectionId: id, schema })}
              isSaving={isSavingSection}
              surfaceType={surfaceType}
              surfaceId={editorState.surface.id}
            />
          );
        })()}
      </div>

      {/* Publish Modal */}
      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
        defaultSlug={editorState.surface.slug}
      />

      {/* Settings Drawer */}
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

      {/* Leave Warning Dialog */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold">Unpublished Changes</h3>
            <p className="text-sm text-muted-foreground">
              You have unpublished changes. If you leave now you may lose them. Publish or stay to continue editing.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowLeaveWarning(false)}>
                Stay
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmLeave}>
                Leave Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
