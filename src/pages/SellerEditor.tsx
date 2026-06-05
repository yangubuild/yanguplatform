import { useParams, useNavigate } from "react-router-dom";
import { useBuilderEditor } from "@/hooks/useBuilderEditor";
import { BuilderSectionList } from "@/components/builder/BuilderSectionList";
import { BuilderAddSection } from "@/components/builder/BuilderAddSection";

import { BuilderPublishModal } from "@/components/builder/BuilderPublishModal";
import { getEngineForSurfaceType } from "@/lib/builder/engineRegistry";
import { getSellerMode } from "@/lib/builder/sellerModes";
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
  Layout,
  Monitor,
  Smartphone,
  UtensilsCrossed,
  Star,
  Clock,
  Package,
  Grid3X3,
  Tag,
  ListPlus,
  Table,
  FileQuestion,
  Briefcase,
  Users,
  MessageSquareQuote,
  X,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import type { BuilderSurfaceType } from "@/types/builder";
import { BuilderSettingsDrawer, getThemeFromMetadata } from "@/components/builder/BuilderSettingsDrawer";
import { BuilderSectionEditor } from "@/components/builder/BuilderSectionEditor";
import { BuilderPagesDropdown } from "@/components/builder/BuilderPagesDropdown";
import { BuilderSetupAnswersPanel } from "@/components/builder/panels/BuilderSetupAnswersPanel";
import { ImageCropDialog } from "@/components/builder/ImageCropDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdaBuilderChat } from "@/components/builder-new/ada/useAdaBuilderChat";
// PERF: Ada panel is heavy — load it only when the user opens it.
const AdaBuilderPanel = lazy(() =>
  import("@/components/builder-new/ada/AdaBuilderPanel").then((m) => ({ default: m.AdaBuilderPanel })),
);
import {
  MobileBuilderToolbar,
  MobileBuilderSheet,
  MobileBuilderDesktopNotice,
  type MobilePanel,
} from "@/components/builder/MobileBuilderMode";

type RightPanel = "none" | "page_edit" | "section" | "setup";
type LeftMode = "tools" | "ada";
type PreviewViewport = "desktop" | "mobile";

/* Quick action icon resolver */
const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed, Star, Clock, Package, Grid3X3, Tag,
  ListPlus, Table, FileQuestion, Briefcase, Users, MessageSquareQuote,
};

export default function SellerEditor() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("page_edit");
  const [leftMode, setLeftMode] = useState<LeftMode>("tools");
  const adaChat = useAdaBuilderChat();
  const [showAiBanner, setShowAiBanner] = useState(false);
  const [liveSchemaOverride, setLiveSchemaOverride] = useState<{ sectionId: string; schema: Record<string, unknown> } | null>(null);
  const [livePageSettings, setLivePageSettings] = useState<import("@/config/builderCoreSections").PageEditSettings | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [bioViewportInitialised, setBioViewportInitialised] = useState(false);
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4" style={{ background: "#152A20" }}>
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

  const surfaceType = (editorState.surface.surface_type || "quick_site") as BuilderSurfaceType;
  const surfaceTitle = editorState.surface.title || "Untitled";
  const builderTheme = getThemeFromMetadata(editorState.surface.metadata);
  const surfaceMeta = (editorState.surface.metadata || {}) as Record<string, unknown>;
  const builderHtml = (surfaceMeta.builder_new_html as string | undefined) ?? null;
  const hasAiSetup = !!surfaceMeta.ai_setup;
  const aiAnswers = (surfaceMeta.ai_answers || {}) as Record<string, unknown>;
  const aiSource = surfaceMeta.ai_source as string | undefined;
  const industry = (surfaceMeta.industry as string) || null;

  // Engine + Mode awareness
  const engine = getEngineForSurfaceType(surfaceType);
  const allowedSectionTypes = engine?.aiGenerationRules?.allowedSectionTypes;
  const sellerMode = getSellerMode(surfaceType);

  // Phase 14+16 — Community sub-type aware quick actions. When the
  // surface stores metadata.community_subtype, narrow the quick-action
  // palette to that sub-type. When undefined, show one representative
  // action per sub-type so the user can pick.
  const communitySubtype = (surfaceMeta.community_subtype as
    | "events"
    | "courses"
    | "freelance"
    | undefined);
  const sellerQuickActions =
    sellerMode.mode === "community"
      ? (() => {
          const groups = {
            events: [
              { label: "Add Event", icon: "Calendar", action: "add_event" },
              { label: "Add Speaker", icon: "Mic", action: "add_speaker" },
              { label: "Add Schedule", icon: "Clock", action: "add_schedule" },
            ],
            courses: [
              { label: "Add Course", icon: "GraduationCap", action: "add_course" },
              { label: "Add Curriculum", icon: "BookOpen", action: "add_curriculum" },
              { label: "Add Instructor", icon: "UserCircle", action: "add_instructor" },
            ],
            freelance: [
              { label: "Add Portfolio Item", icon: "Image", action: "add_portfolio" },
              { label: "Add Service", icon: "Briefcase", action: "add_service_tier" },
              { label: "Add Availability", icon: "CalendarCheck", action: "add_availability" },
            ],
          } as const;
          return communitySubtype
            ? [...groups[communitySubtype]]
            : [...groups.events, ...groups.courses, ...groups.freelance];
        })()
      : sellerMode.quickActions;

  // Phase 13 — Influencer canvas is mobile-first. Snap the preview to a
  // phone viewport on first load for live_bio surfaces; users can still
  // toggle to desktop preview manually afterwards.
  if (!bioViewportInitialised && sellerMode.defaultPreviewViewport === "mobile") {
    setBioViewportInitialised(true);
    setPreviewViewport("mobile");
  }

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    setRightPanel("section");
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-section-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleUpdateAnswers = (updated: Record<string, unknown>) => {
    toast.success("Answers updated — content will reflect changes on next save.");
  };

  // Map quick-action keys → section types (must match builder section registry).
  // Phase 8: removes "coming soon" dead controls and wires real add-section calls.
  const QUICK_ACTION_TO_SECTION: Record<string, string> = {
    add_menu_category: "menu",
    add_featured_item: "featured",
    set_hours: "hours",
    add_product: "products",
    add_collection: "collections",
    add_promo: "promo",
    add_listing: "products",
    add_bulk_pricing: "bulk_pricing",
    add_quote_form: "quote",
    add_service: "services",
    add_team: "team",
    add_testimonial: "testimonials",
    // Influencer (live_bio) actions — link-in-bio building blocks.
    add_link_card: "links",
    add_affiliate: "affiliate",
    add_conversion: "offer",
    // Community (community_group) actions — Phase 14+16.
    // Events sub-type
    add_event: "event_listing",
    add_speaker: "speakers",
    add_schedule: "schedule",
    // Courses sub-type
    add_course: "course_listing",
    add_curriculum: "curriculum",
    add_instructor: "instructor",
    // Freelance sub-type
    add_portfolio: "portfolio",
    add_service_tier: "services_offered",
    add_availability: "availability",
  };

  const handleQuickAction = async (action: string) => {
    const sectionType = QUICK_ACTION_TO_SECTION[action];
    if (!sectionType) {
      toast.error("Unknown action");
      return;
    }
    try {
      await addSection(sectionType);
      toast.success(`Added ${SECTION_TYPE_LABELS[sectionType] || sectionType} section`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add section");
    }
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
          <button onClick={() => setShowAiBanner(false)} className="text-muted-foreground hover:text-foreground text-xs">Dismiss</button>
        </div>
      )}

      <MobileBuilderDesktopNotice />

      {/* ═══ GLOBAL TOP NAV — dark green, locked ═══ */}
      <header
        className="sticky top-0 z-40 h-14 border-b border-white/10 flex items-center px-3 lg:px-4 gap-2 lg:gap-4"
        style={{ background: "#152A20" }}
      >
        <button
          onClick={() => safeNavigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-6 w-px bg-white/20 hidden sm:block" />
        <h1 className="text-sm font-semibold text-white truncate">{surfaceTitle}</h1>
        {/* Category badge */}
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
            }`}>
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            onClick={() => setPreviewViewport("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
              previewViewport === "mobile" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}>
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>

        {/* Ada AI toggle — switches left panel */}
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

      <div className="flex flex-1 overflow-hidden" style={{ paddingBottom: isMobile ? 56 : 0 }}>
        {/* ═══ LEFT PANEL — category-aware, switches between tools and Ada ═══ */}
        <aside className="w-72 border-r border-border flex-col bg-sidebar overflow-y-auto hidden lg:flex">
          {leftMode === "ada" ? (
            <Suspense fallback={<div className="p-4"><Skeleton className="h-8 w-32 mb-3" />{Array.from({length:5}).map((_,i)=>(<Skeleton key={i} className="h-12 w-full mb-2 rounded-lg" />))}</div>}>
              <AdaBuilderPanel
                messages={adaChat.messages}
                isLoading={adaChat.isLoading}
                onSend={adaChat.sendMessage}
                onClose={() => setLeftMode("tools")}
                category={sellerMode.categoryBadge.toLowerCase()}
              />
            </Suspense>
          ) : (
            /* ── Category-specific Editor Tools ── */
            <>
              {/* Sidebar header with mode title */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">{sellerMode.sidebarTitle}</h2>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-3 border-b border-border space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quick Actions</p>
                {sellerQuickActions.map((qa) => {
                  const Icon = ICON_MAP[qa.icon] || Package;
                  return (
                    <button
                      key={qa.action}
                      onClick={() => handleQuickAction(qa.action)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-accent/10 hover:text-accent transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {qa.label}
                    </button>
                  );
                })}
              </div>

              {/* Page Edit trigger */}
              <button
                onClick={() => { setSelectedSectionId(null); setRightPanel("page_edit"); }}
                className={`m-3 mb-0 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                  rightPanel === "page_edit"
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30 bg-card"
                }`}>
                <Layout className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Page Edit</span>
              </button>

              {/* Section list */}
              <div className="p-4 pb-1 border-b border-border mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{sellerMode.sectionListTitle}</h2>
                </div>
                <p className="text-xs text-muted-foreground">{sellerMode.sectionListHint}</p>
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
                <BuilderAddSection onAdd={addSection} onAddWithSchema={addSectionWithSchema} isAdding={isAdding || isSwitching} surfaceType={surfaceType} allowedSectionTypes={allowedSectionTypes} />
              </div>
            </>
          )}
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-10">
          <div className={`mx-auto transition-all h-[calc(100vh-3.5rem)] ${isMobile ? "max-w-full" : previewViewport === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
          {builderHtml ? (
            <iframe
              key={builderHtml}
              srcDoc={builderHtml}
              title="surface-editor"
              width="100%"
              height="100%"
              style={{ border: "none", display: "block", height: "100%", minHeight: "calc(100vh - 3.5rem)" }}
            />
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#ffffff",
              fontSize: "16px",
              textAlign: "center",
              padding: "24px"
            }}>
              Template not loaded. Go back and select a design to continue.
            </div>
          )}
          </div>
        </main>

        {/* Right panel — desktop only */}
        {!isMobile && rightPanel === "page_edit" && (
          <BuilderPageEditPanel
            settings={pageSettings}
            onSave={async (s) => { await savePageSettings(s); setLivePageSettings(null); }}
            onClose={() => setRightPanel("none")}
            isSaving={isSavingPageSettings}
            onLocalChange={setLivePageSettings}
            surfaceType={surfaceType}
            sections={sections}
            onApplyTemplate={async (sectionId, schema) => { await updateSectionSchema(sectionId, schema); }}
            onToggleVisible={async (sectionId) => { await toggleSectionVisibility(sectionId, true); }}
            onCreateSection={async (sectionType, schema, coreSlot) => { await addSectionWithSchema(sectionType, schema, { coreSlot }); }}
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
              onSave={async (id, schema) => { await updateSectionSchema(id, schema); setLiveSchemaOverride(null); }}
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
              if (panel === "publish") setPublishOpen(true);
              else if (panel === "settings") setSettingsOpen(true);
              else setMobilePanel(panel === mobilePanel ? "none" : panel);
            }}
          />
          <MobileBuilderSheet open={mobilePanel === "sections"} onClose={() => setMobilePanel("none")} title={sellerMode.sectionListTitle}>
            <div className="p-3">
              <BuilderSectionList
                sections={sections}
                onReorder={reorderSections}
                selectedId={selectedSectionId}
                surfaceType={surfaceType}
                onSelect={(id) => { handleSelectSection(id); setMobilePanel("editor"); }}
                onSwitchMainContent={switchMainContent}
                currentMainContentType={currentMainContentType}
                industry={industry}
                onVariantChange={async (sectionId, displayMode) => {
                  const section = sections.find((s) => s.id === sectionId);
                  if (!section) return;
                  await updateSectionSchema(sectionId, { ...section.schema, display_mode: displayMode });
                }}
                onDelete={async (id) => {
                  const ok = await deleteSection(id);
                  if (ok && selectedSectionId === id) setSelectedSectionId(null);
                  return ok;
                }}
              />
            </div>
            <div className="p-3 border-t border-border">
              <BuilderAddSection onAdd={addSection} onAddWithSchema={addSectionWithSchema} isAdding={isAdding || isSwitching} surfaceType={surfaceType} allowedSectionTypes={allowedSectionTypes} />
            </div>
          </MobileBuilderSheet>
          <MobileBuilderSheet
            open={mobilePanel === "editor"}
            onClose={() => setMobilePanel("none")}
            title={selectedSectionId ? (() => { const t = sections.find((s) => s.id === selectedSectionId)?.section_type; return t ? (SECTION_TYPE_LABELS[t] || t) : "Edit Section"; })() : "Page Edit"}>
            {selectedSectionId ? (() => {
              const sec = sections.find((s) => s.id === selectedSectionId);
              if (!sec || sec.isMissing) return <div className="p-4 text-sm text-muted-foreground">Select a section to edit</div>;
              return (
                <div className="[&>aside]:w-full [&>aside]:border-0">
                  <BuilderSectionEditor
                    key={sec.id}
                    section={sec}
                    onClose={() => { setSelectedSectionId(null); setMobilePanel("none"); setLiveSchemaOverride(null); }}
                    onSave={async (id, schema) => { await updateSectionSchema(id, schema); setLiveSchemaOverride(null); }}
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
                  onSave={async (s) => { await savePageSettings(s); setLivePageSettings(null); }}
                  onClose={() => setMobilePanel("none")}
                  isSaving={isSavingPageSettings}
                  onLocalChange={setLivePageSettings}
                  surfaceType={surfaceType}
                  sections={sections}
                  onApplyTemplate={async (sectionId, schema) => { await updateSectionSchema(sectionId, schema); }}
                  onToggleVisible={async (sectionId) => { await toggleSectionVisibility(sectionId, true); }}
                  onCreateSection={async (sectionType, schema, coreSlot) => { await addSectionWithSchema(sectionType, schema, { coreSlot }); }}
                />
              </div>
            )}
          </MobileBuilderSheet>
        </>
      )}

      <BuilderPublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        surfaceId={editorState.surface.id}
        surfaceType={surfaceType}
        surfaceTitle={surfaceTitle}
        defaultSlug={editorState.surface.slug}
        pages={editorState.pages}
      />

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

      {cropState && (
        <ImageCropDialog
          open={cropState.open}
          onOpenChange={(open) => { if (!open) setCropState(null); }}
          imageSrc={cropState.imageSrc}
          onCropComplete={async (croppedUrl: string) => {
            const { sectionId, fieldPath } = cropState;
            const section = sections.find((s) => s.id === sectionId);
            if (!section) { setCropState(null); return; }

            let resolvedUrl = croppedUrl;
            if (croppedUrl.startsWith("data:")) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id || !surfaceId) { setCropState(null); return; }
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
