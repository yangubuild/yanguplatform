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
} from "lucide-react";
import { useState } from "react";
import type { BuilderSurfaceType } from "@/types/builder";

export default function BuilderEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const [publishOpen, setPublishOpen] = useState(false);

  const {
    editorState,
    isLoading,
    error,
    sections,
    addSection,
    isAdding,
    reorderSections,
  } = useBuilderEditor(surfaceId);

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
          <p className="text-sm text-muted-foreground mb-6">
            {error || "Surface not found"}
          </p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const surfaceType = (editorState.surface.surface_type || "live_bio") as BuilderSurfaceType;
  const surfaceTitle = editorState.surface.title || "Untitled";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>
        <div className="h-6 w-px bg-border" />
        <h1 className="text-sm font-semibold truncate flex-1">{surfaceTitle}</h1>
        <Button size="sm" onClick={() => setPublishOpen(true)} className="gap-2">
          <Rocket className="h-4 w-4" />
          Publish
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
            />
          </div>
          <div className="p-3 border-t border-border">
            <BuilderAddSection onAdd={addSection} isAdding={isAdding} />
          </div>
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <BuilderPreview sections={sections} surfaceTitle={surfaceTitle} />
        </main>
      </div>

      {/* Publish Modal */}
      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
      />
    </div>
  );
}
