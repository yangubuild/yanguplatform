import { useParams, useNavigate } from "react-router-dom";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { BuilderSectionList } from "@/components/builder/BuilderSectionList";
import { BuilderAddSection } from "@/components/builder/BuilderAddSection";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { BuilderPageEditPanel } from "@/components/builder/BuilderPageEditPanel";
import { Card } from "@/components/primitives";
import { SECTION_TYPE_LABELS } from "@/config/builderSectionLabels";
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
import { ImageCropDialog } from "@/components/builder/ImageCropDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MobileBuilderToolbar,
  MobileBuilderSheet,
  MobileBuilderDesktopNotice,
  type MobilePanel,
} from "@/components/builder/MobileBuilderMode";

type RightPanel = "none" | "page_edit" | "section" | "setup";
type PreviewViewport = "desktop" | "mobile";

export default function BuilderEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("none");
  const [cropState, setCropState] = useState<{
    open: boolean;
    imageSrc: string;
    sectionId: string;
    fieldPath: string;
  } | null>(null);
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
    // Scroll the preview to show the selected section
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-section-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
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

      {/* Desktop notice for mobile users */}
      <MobileBuilderDesktopNotice />

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-3 lg:px-4 gap-2 lg:gap-4">
        <button
          onClick={() => safeNavigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <h1 className="text-sm font-semibold truncate">{surfaceTitle}</h1>
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

        {/* Viewport toggle — desktop only */}
        <div className="hidden lg:flex items-center border border-border rounded-md overflow-hidden">
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

        {/* Desktop-only header buttons */}
        <Button size="sm" variant="outline" className="gap-2 hidden lg:flex" onClick={() => toast.info("AI chat editor coming soon!")}>
          <Sparkles className="h-4 w-4" /> Edit with Ada AI
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-2 hidden lg:flex">
          <Settings className="h-4 w-4" /> Settings
        </Button>
        <Button size="sm" variant="outline" onClick={() => safeNavigate("/dashboard/my-business")} className="gap-2 hidden lg:flex">
          <ClipboardList className="h-4 w-4" /> View Orders
        </Button>
        <Button size="sm" onClick={() => setPublishOpen(true)} className="gap-2 hidden lg:flex">
          <Rocket className="h-4 w-4" /> Publish
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ paddingBottom: isMobile ? 56 : 0 }}>
        {/* Left panel: Sections — hidden on mobile */}
        <aside className="w-72 border-r border-border flex-col bg-sidebar overflow-y-auto hidden lg:flex">
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
        <main className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-10">
          <div className={`mx-auto transition-all ${isMobile ? "max-w-full" : previewViewport === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
          <BuilderPreview
            sections={sections}
            surfaceTitle={surfaceTitle}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            theme={builderTheme}
            pageSettings={livePageSettings || pageSettings}
            liveSchemaOverride={liveSchemaOverride}
            previewViewport={previewViewport}
            surfaceType={surfaceType}
            pages={editorState.pages}
            onSwitchPage={setActivePageId}
            onUpdateSectionField={async (sectionId, fieldPath, value) => {
              const section = sections.find((s) => s.id === sectionId);
              if (!section) return;

              // Support nested dot-paths like "testimonials.items"
              const parts = fieldPath.split(".");
              let newSchema: Record<string, unknown>;
              if (parts.length === 1) {
                newSchema = { ...section.schema, [fieldPath]: value };
              } else {
                newSchema = JSON.parse(JSON.stringify(section.schema));
                let cursor: any = newSchema;
                for (let i = 0; i < parts.length - 1; i++) {
                  const key = parts[i];
                  if (cursor[key] === undefined || cursor[key] === null) {
                    cursor[key] = {};
                  } else {
                    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...cursor[key] };
                  }
                  cursor = cursor[key];
                }
                cursor[parts[parts.length - 1]] = value;
              }

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
            onImageReplace={async (sectionId, fieldPath, url, source) => {
              const section = sections.find((s) => s.id === sectionId);
              if (!section) return;

              const setNestedValue = (target: Record<string, any>, path: string[], value: string) => {
                let cursor: any = target;
                for (let i = 0; i < path.length; i += 1) {
                  const key = path[i];
                  const isIndex = /^\d+$/.test(key);
                  const nextKey = path[i + 1];
                  const nextIsIndex = /^\d+$/.test(nextKey || "");
                  const isLast = i === path.length - 1;
                  if (isLast) {
                    if (isIndex) {
                      const index = Number(key);
                      if (!Array.isArray(cursor)) return;
                      while (cursor.length <= index) cursor.push(null);
                      cursor[index] = value;
                    } else {
                      cursor[key] = value;
                    }
                    return;
                  }
                  if (isIndex) {
                    const index = Number(key);
                    if (!Array.isArray(cursor)) return;
                    while (cursor.length <= index) cursor.push(nextIsIndex ? [] : {});
                    if (cursor[index] == null || typeof cursor[index] !== "object") {
                      cursor[index] = nextIsIndex ? [] : {};
                    }
                    cursor = cursor[index];
                    continue;
                  }
                  if (cursor[key] == null || typeof cursor[key] !== "object") {
                    cursor[key] = nextIsIndex ? [] : {};
                  } else if (nextIsIndex && !Array.isArray(cursor[key])) {
                    cursor[key] = [];
                  }
                  cursor = cursor[key];
                }
              };

              const applyUrlToSchema = (baseSchema: Record<string, any>, resolvedUrl: string) => {
                const newSchema = { ...baseSchema };
                if (fieldPath === "media.url") {
                  const media = (newSchema.media as Record<string, unknown>) || {};
                  newSchema.media = { ...media, url: resolvedUrl, type: "image" };
                } else if (fieldPath.includes(".")) {
                  const normalizedPath = fieldPath
                    .split(".")
                    .map((part, index, parts) => (
                      parts[0] === "products" && index === 2 && part === "image" ? "image_url" : part
                    ));
                  setNestedValue(newSchema, normalizedPath, resolvedUrl);
                } else {
                  newSchema[fieldPath] = resolvedUrl;
                }
                return newSchema;
              };

              // ── Optimistic preview: show image immediately ──
              const optimisticSchema = applyUrlToSchema({ ...section.schema } as Record<string, any>, url);
              setLiveSchemaOverride({ sectionId, schema: optimisticSchema });

              let resolvedUrl = url;

              if (source === "upload" && url.startsWith("data:")) {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.user?.id || !surfaceId) {
                    toast.error("Please sign in to upload images");
                    setLiveSchemaOverride(null);
                    return;
                  }

                  const uploadBlob = await fetch(url).then((response) => response.blob());
                  const extension = uploadBlob.type.split("/")[1] || "png";
                  const safeFieldPath = fieldPath.replace(/[^a-zA-Z0-9.-]/g, "_");
                  const uploadPath = `${session.user.id}/${surfaceId}/${sectionId}-${safeFieldPath}-${Date.now()}.${extension}`;

                  const { error: uploadError } = await supabase.storage
                    .from("builder-media")
                    .upload(uploadPath, uploadBlob, {
                      contentType: uploadBlob.type || "image/png",
                      upsert: false,
                    });

                  if (uploadError) throw uploadError;

                  const { data: publicData } = supabase.storage
                    .from("builder-media")
                    .getPublicUrl(uploadPath);

                  resolvedUrl = publicData.publicUrl;
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Image upload failed");
                  setLiveSchemaOverride(null);
                  return;
                }
              }

              // Persist the uploaded image
              const finalSchema = applyUrlToSchema({ ...section.schema } as Record<string, any>, resolvedUrl);
              await updateSectionSchema(sectionId, finalSchema);
              setLiveSchemaOverride(null);
              markDirty();

              // Offer crop dialog after successful upload
              setCropState({
                open: true,
                imageSrc: resolvedUrl,
                sectionId,
                fieldPath,
              });
            }}
          />
          </div>
        </main>

        {/* Right panel — desktop only */}
        {!isMobile && rightPanel === "page_edit" && (
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
        {!isMobile && rightPanel === "setup" && hasAiSetup && (
          <BuilderSetupAnswersPanel
            answers={aiAnswers}
            source={aiSource}
            onClose={() => setRightPanel("none")}
            onUpdate={handleUpdateAnswers}
          />
        )}
        {!isMobile && rightPanel === "section" && selectedSectionId && (() => {
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

      {/* Mobile bottom toolbar + sheets */}
      {isMobile && (
        <>
          <MobileBuilderToolbar
            activePanel={mobilePanel}
            onOpenPanel={(panel) => {
              if (panel === "publish") {
                setPublishOpen(true);
              } else if (panel === "settings") {
                setSettingsOpen(true);
              } else {
                setMobilePanel(panel === mobilePanel ? "none" : panel);
              }
            }}
          />

          {/* Sections sheet */}
          <MobileBuilderSheet
            open={mobilePanel === "sections"}
            onClose={() => setMobilePanel("none")}
            title="Sections"
          >
            <div className="p-3">
              <BuilderSectionList
                sections={sections}
                onReorder={reorderSections}
                selectedId={selectedSectionId}
                surfaceType={surfaceType}
                onSelect={(id) => {
                  handleSelectSection(id);
                  setMobilePanel("editor");
                }}
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
                  }
                  return ok;
                }}
              />
            </div>
            <div className="p-3 border-t border-border">
              <BuilderAddSection onAdd={addSection} onAddWithSchema={addSectionWithSchema} isAdding={isAdding || isSwitching} surfaceType={surfaceType} />
            </div>
          </MobileBuilderSheet>

          {/* Editor sheet */}
          <MobileBuilderSheet
            open={mobilePanel === "editor"}
            onClose={() => setMobilePanel("none")}
            title={selectedSectionId ? (() => { const t = sections.find((s) => s.id === selectedSectionId)?.section_type; return t ? (SECTION_TYPE_LABELS[t] || t) : "Edit Section"; })() : "Page Edit"}
          >
            {selectedSectionId ? (() => {
              const sec = sections.find((s) => s.id === selectedSectionId);
              if (!sec || sec.isMissing) return <div className="p-4 text-sm text-muted-foreground">Select a section to edit</div>;
              return (
                <div className="[&>aside]:w-full [&>aside]:border-0">
                  <BuilderSectionEditor
                    key={sec.id}
                    section={sec}
                    onClose={() => { setSelectedSectionId(null); setMobilePanel("none"); setLiveSchemaOverride(null); }}
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
                </div>
              );
            })() : (
              <div className="[&>aside]:w-full [&>aside]:border-0">
                <BuilderPageEditPanel
                  settings={pageSettings}
                  onSave={async (s) => {
                    await savePageSettings(s);
                    setLivePageSettings(null);
                  }}
                  onClose={() => setMobilePanel("none")}
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
              </div>
            )}
          </MobileBuilderSheet>
        </>
      )}

      {/* Publish Modal */}
      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
        defaultSlug={editorState.surface.slug}
        pages={editorState.pages}
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

      {/* Image Crop Dialog — offered after every canvas upload */}
      {cropState && (
        <ImageCropDialog
          open={cropState.open}
          onOpenChange={(open) => {
            if (!open) setCropState(null);
          }}
          imageSrc={cropState.imageSrc}
          onCropComplete={async (croppedUrl: string) => {
            const { sectionId, fieldPath } = cropState;
            const section = sections.find((s) => s.id === sectionId);
            if (!section) { setCropState(null); return; }

            let resolvedUrl = croppedUrl;

            // Upload cropped data URL to storage
            if (croppedUrl.startsWith("data:")) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id || !surfaceId) {
                  setCropState(null);
                  return;
                }
                const blob = await fetch(croppedUrl).then((r) => r.blob());
                const ext = blob.type.split("/")[1] || "jpeg";
                const safeFp = fieldPath.replace(/[^a-zA-Z0-9.-]/g, "_");
                const path = `${session.user.id}/${surfaceId}/${sectionId}-${safeFp}-crop-${Date.now()}.${ext}`;
                const { error: ue } = await supabase.storage.from("builder-media").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
                if (ue) throw ue;
                const { data: pub } = supabase.storage.from("builder-media").getPublicUrl(path);
                resolvedUrl = pub.publicUrl;
              } catch {
                toast.error("Cropped image upload failed");
                setCropState(null);
                return;
              }
            }

            // Apply cropped URL to schema
            const newSchema = { ...section.schema } as Record<string, any>;
            const setNested = (target: any, parts: string[], val: string) => {
              let cur = target;
              for (let i = 0; i < parts.length; i++) {
                const k = parts[i]; const isIdx = /^\d+$/.test(k); const isLast = i === parts.length - 1;
                const nk = parts[i+1]; const nIsIdx = /^\d+$/.test(nk||"");
                if (isLast) { if (isIdx) { cur[Number(k)] = val; } else { cur[k] = val; } return; }
                if (isIdx) { cur = cur[Number(k)]; continue; }
                if (!cur[k] || typeof cur[k] !== "object") cur[k] = nIsIdx ? [] : {};
                cur = cur[k];
              }
            };
            if (fieldPath === "media.url") {
              const media = (newSchema.media as Record<string, unknown>) || {};
              newSchema.media = { ...media, url: resolvedUrl, type: "image" };
            } else if (fieldPath.includes(".")) {
              const normalizedPath = fieldPath.split(".").map((p, i, a) => a[0]==="products"&&i===2&&p==="image"?"image_url":p);
              setNested(newSchema, normalizedPath, resolvedUrl);
            } else {
              newSchema[fieldPath] = resolvedUrl;
            }

            await updateSectionSchema(sectionId, newSchema);
            markDirty();
            setCropState(null);
          }}
        />
      )}
    </div>
  );
}
