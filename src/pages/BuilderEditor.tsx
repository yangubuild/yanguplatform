import { useParams, useNavigate } from "react-router-dom";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { BuilderSectionList } from "@/components/builder/BuilderSectionList";
import { BuilderAddSection } from "@/components/builder/BuilderAddSection";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import type { BuilderSurfaceType } from "@/types/builder";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderSectionEditor } from "@/components/builder/BuilderSectionEditor";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { BuilderSetupAnswersPanel } from "@/components/builder/panels/BuilderSetupAnswersPanel";
import { toast } from "sonner";

export default function BuilderEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [setupPanelOpen, setSetupPanelOpen] = useState(false);
  const [showAiBanner, setShowAiBanner] = useState(false);

  const {
    editorState,
    isLoading,
    error,
    sections,
    activePage,
    activePageId,
    setActivePageId,
    addSection,
    addSectionWithSchema,
    isAdding,
    reorderSections,
    updateSectionSchema,
    toggleSectionVisibility,
    deleteSection,
    isSavingSection,
    refreshEditor,
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

  const handleUpdateAnswers = (updated: Record<string, unknown>) => {
    toast.success("Answers updated — content will reflect changes on next save.");
    // Future: could trigger partial re-generation here
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
          onClick={() => navigate("/dashboard")}
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

        {/* Edit with Ada AI button */}
        <Button size="sm" variant="outline" className="gap-2" onClick={() => toast.info("AI chat editor coming soon!")}>
          <Sparkles className="h-4 w-4" /> Edit with Ada AI
        </Button>

        {/* Setup / Answers button (only if AI-generated) */}
        {hasAiSetup && (
          <Button size="sm" variant="outline" className="gap-2" onClick={() => {
            setSetupPanelOpen(!setupPanelOpen);
            if (setupPanelOpen) setSelectedSectionId(null);
          }}>
            <FileText className="h-4 w-4" /> Setup
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" /> Settings
        </Button>
        {surfaceType === "emenu" && (
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/seller/emenu/orders")} className="gap-2">
            <ClipboardList className="h-4 w-4" /> View Orders
          </Button>
        )}
        <Button size="sm" onClick={() => setPublishOpen(true)} className="gap-2">
          <Rocket className="h-4 w-4" /> Publish
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Sections */}
        <aside className="w-72 border-r border-border flex flex-col bg-sidebar overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Sections</h2>
            </div>
            <p className="text-xs text-muted-foreground">Drag to reorder</p>
          </div>
          <div className="flex-1 p-3">
            <BuilderSectionList
              sections={sections}
              onReorder={reorderSections}
              selectedId={selectedSectionId}
              onSelect={(id) => { setSelectedSectionId(id); setSetupPanelOpen(false); }}
              onDelete={async (id) => {
                const ok = await deleteSection(id);
                if (ok && selectedSectionId === id) setSelectedSectionId(null);
                return ok;
              }}
            />
          </div>
          <div className="p-3 border-t border-border">
            <BuilderAddSection onAdd={addSection} onAddWithSchema={addSectionWithSchema} isAdding={isAdding} surfaceType={surfaceType} />
          </div>
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <BuilderPreview
            sections={sections}
            surfaceTitle={surfaceTitle}
            selectedSectionId={selectedSectionId}
            onSelectSection={(id) => { setSelectedSectionId(id); setSetupPanelOpen(false); }}
            theme={builderTheme}
          />
        </main>

        {/* Right panel: Section editor OR Setup answers */}
        {setupPanelOpen && hasAiSetup ? (
          <BuilderSetupAnswersPanel
            answers={aiAnswers}
            source={aiSource}
            onClose={() => setSetupPanelOpen(false)}
            onUpdate={handleUpdateAnswers}
          />
        ) : selectedSectionId && sections.find((s) => s.id === selectedSectionId) ? (
          <BuilderSectionEditor
            section={sections.find((s) => s.id === selectedSectionId)!}
            onClose={() => setSelectedSectionId(null)}
            onSave={updateSectionSchema}
            onToggleVisibility={toggleSectionVisibility}
            isSaving={isSavingSection}
            surfaceType={surfaceType}
            surfaceId={editorState.surface.id}
          />
        ) : null}
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
    </div>
  );
}
