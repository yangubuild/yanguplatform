import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { enforceCoreSectionOrder, CORE_SECTIONS, resolveCoreSectionType, CONTENT_SECTION_TYPES } from "@/config/builderCoreSections";
import type { PageEditSettings } from "@/config/builderCoreSections";
import { DEFAULT_PAGE_SETTINGS } from "@/config/builderCoreSections";
import { applyTemplateForMainContent } from "@/hooks/useMainContentTemplate";

// ─── Types ───
export interface EditorSection {
  id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  is_visible: boolean;
  isCore?: boolean;
  isMissing?: boolean;
  core_slot?: string | null;
}

export interface EditorPage {
  id: string;
  slug: string;
  title: string;
  sections: EditorSection[];
}

export interface EditorState {
  ok: true;
  surface: {
    id: string;
    surface_type: string;
    title: string;
    description: string | null;
    slug: string;
    metadata: Record<string, unknown>;
    theme: Record<string, unknown>;
  };
  pages: EditorPage[];
}

// Re-export palette helpers from central config
import { getSectionPalette, getDefaultSchema } from "@/config/builderSectionPalettes";
export { getSectionPalette, getDefaultSchema };

// Keep LIVE_BIO_SECTION_TYPES as a convenience alias for backward compat
export const LIVE_BIO_SECTION_TYPES = getSectionPalette("live_bio");

// ─── Hook ───
export function useBuilderEditor(surfaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["builder-editor-state", surfaceId];

  // Fetch editor state
  const {
    data: editorState,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<EditorState> => {
      if (!surfaceId) throw new Error("No surface ID");

      const { data, error } = await supabase.rpc("builder_get_editor_state", {
        p_surface_id: surfaceId,
      });

      if (error) throw new Error(error.message);

      const result = data as unknown as EditorState;
      if (!result?.ok) {
        throw new Error((data as any)?.error || "Failed to load editor state");
      }
      // Sort pages by metadata.position (from reorder RPC), then by title
      if (result.pages) {
        result.pages.sort((a, b) => {
          const posA = (a as any).metadata?.position ?? 999;
          const posB = (b as any).metadata?.position ?? 999;
          if (posA !== posB) return posA - posB;
          return (a.title || "").localeCompare(b.title || "");
        });
      }
      return result;
    },
    enabled: !!surfaceId,
    staleTime: 30_000,
  });

  // Active page — default to first page (usually "home")
  const [activePageId, setActivePageId] = useState<string | null>(null);

  useEffect(() => {
    if (editorState?.pages?.length && !activePageId) {
      const homePage = editorState.pages.find((p) => p.slug === "home") || editorState.pages[0];
      setActivePageId(homePage.id);
    }
  }, [editorState, activePageId]);

  const activePage = editorState?.pages?.find((p) => p.id === activePageId) || null;
  const surfaceType = editorState?.surface?.surface_type || "quick_site";

  // Enforce core section order with deduplication
  const rawSections = activePage?.sections?.slice().sort((a, b) => a.position - b.position) || [];
  const sections: EditorSection[] = enforceCoreSectionOrder(rawSections, surfaceType);

  // ─── Auto-create missing core sections ───
  // IMPORTANT: Only auto-create when rawSections is non-empty (data has loaded)
  // and the missing section's core_slot doesn't already exist in raw DB data.
  // This prevents overwriting AI-populated sections with empty defaults.
  const autoCreatingRef = useRef(false);
  useEffect(() => {
    if (!activePageId || autoCreatingRef.current) return;
    // Don't auto-create if data hasn't loaded yet (rawSections empty)
    if (rawSections.length === 0) return;
    
    const missing = sections.filter((s) => s.isMissing);
    if (missing.length === 0) return;

    // Double-check: only create sections whose core_slot truly doesn't exist in raw DB data
    const existingCoreSlots = new Set(
      rawSections.filter((s) => s.core_slot).map((s) => s.core_slot!)
    );
    const existingSectionTypes = new Set(rawSections.map((s) => s.section_type));
    const trulyMissing = missing.filter((stub) => {
      // If a section with this core_slot already exists, don't create a duplicate
      if (stub.core_slot && existingCoreSlots.has(stub.core_slot)) return false;
      // If a section with this type already exists, don't create a duplicate
      if (existingSectionTypes.has(stub.section_type)) return false;
      return true;
    });

    if (trulyMissing.length === 0) return;

    autoCreatingRef.current = true;
    (async () => {
      try {
        for (const stub of trulyMissing) {
          const schema = getDefaultSchema(stub.section_type);
          const coreSlotValue = stub.id.startsWith("_missing_") ? (stub.core_slot || null) : null;
          await supabase.rpc("builder_upsert_section", {
            p_page_id: activePageId,
            p_section_type: stub.section_type,
            p_schema: schema as unknown as Json,
            p_position: stub.position,
            p_is_visible: true,
            p_core_slot: coreSlotValue,
          });
        }
        console.log("BUILDER_CORE_SECTIONS_AUTO_CREATED", trulyMissing.map((s) => s.section_type));
        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        console.error("Failed to auto-create core sections", err);
      } finally {
        autoCreatingRef.current = false;
      }
    })();
  }, [activePageId, sections, rawSections, queryClient, queryKey]);

  // Page settings from surface metadata
  const pageSettings: PageEditSettings = useMemo(
    () => ({
      ...DEFAULT_PAGE_SETTINGS,
      ...((editorState?.surface?.metadata as any)?.page_settings || {}),
    }),
    [editorState?.surface?.metadata]
  );

  // ─── Save page settings ───
  const [isSavingPageSettings, setIsSavingPageSettings] = useState(false);
  const savePageSettings = useCallback(
    async (settings: PageEditSettings) => {
      if (!surfaceId) return;
      setIsSavingPageSettings(true);
      try {
        const currentMeta = (editorState?.surface?.metadata || {}) as Record<string, unknown>;
        const newMeta = { ...currentMeta, page_settings: settings };
        const { error } = await supabase
          .from("builder_surfaces")
          .update({ metadata: newMeta as unknown as Json })
          .eq("id", surfaceId);
        if (error) throw new Error(error.message);
        await queryClient.invalidateQueries({ queryKey });
        toast.success("Page settings saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save page settings");
      } finally {
        setIsSavingPageSettings(false);
      }
    },
    [surfaceId, editorState, queryClient, queryKey]
  );

  // ─── Add section ───
  const [isAdding, setIsAdding] = useState(false);

  const addSection = useCallback(
    async (sectionType: string) => {
      if (!activePageId) return;
      setIsAdding(true);

      const nextPosition = sections.length > 0 ? Math.max(...sections.map((s) => s.position)) + 1 : 0;
      const schema = getDefaultSchema(sectionType);

      try {
        const { data, error } = await supabase.rpc("builder_upsert_section", {
          p_page_id: activePageId,
          p_section_type: sectionType,
          p_schema: schema as unknown as Json,
          p_position: nextPosition,
          p_is_visible: true,
          p_core_slot: null,
        });

        if (error) throw new Error(error.message);

        const result = data as unknown as { ok: boolean; error?: string };
        if (!result.ok) throw new Error(result.error || "Failed to add section");

        await queryClient.invalidateQueries({ queryKey });
        toast.success(`${sectionType} section added`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add section";
        toast.error(msg);
      } finally {
        setIsAdding(false);
      }
    },
    [activePageId, sections, queryClient, queryKey]
  );

  // ─── Add section with custom schema (AI-generated) ───
  const addSectionWithSchema = useCallback(
    async (
      sectionType: string,
      schema: Record<string, unknown>,
      options?: { coreSlot?: string | null; position?: number }
    ) => {
      if (!activePageId) return;
      setIsAdding(true);

      const nextPosition = options?.position ?? (sections.length > 0 ? Math.max(...sections.map((s) => s.position)) + 1 : 0);

      try {
        const { data, error } = await supabase.rpc("builder_upsert_section", {
          p_page_id: activePageId,
          p_section_type: sectionType,
          p_schema: schema as unknown as Json,
          p_position: nextPosition,
          p_is_visible: true,
          p_core_slot: options?.coreSlot ?? null,
        });

        if (error) throw new Error(error.message);

        const result = data as unknown as { ok: boolean; error?: string };
        if (!result.ok) throw new Error(result.error || "Failed to add section");

        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add section";
        toast.error(msg);
      } finally {
        setIsAdding(false);
      }
    },
    [activePageId, sections, queryClient, queryKey]
  );

  // ─── Reorder sections (optimistic) ───
  const [isReordering, setIsReordering] = useState(false);

  const reorderSections = useCallback(
    async (orderedIds: string[]) => {
      if (!activePageId) return;

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: EditorState | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (page.id !== activePageId) return page;
            const reordered = orderedIds
              .map((id, idx) => {
                const section = page.sections.find((s) => s.id === id);
                return section ? { ...section, position: idx } : null;
              })
              .filter(Boolean) as EditorSection[];
            return { ...page, sections: reordered };
          }),
        };
      });

      setIsReordering(true);
      try {
        const { data, error } = await supabase.rpc("builder_reorder_sections", {
          p_page_id: activePageId,
          p_ordered_ids: orderedIds,
        });

        if (error) throw new Error(error.message);

        const result = data as unknown as { ok: boolean; error?: string };
        if (!result.ok) throw new Error(result.error || "Reorder failed");

        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        await queryClient.invalidateQueries({ queryKey });
        const msg = err instanceof Error ? err.message : "Reorder failed";
        toast.error(msg);
      } finally {
        setIsReordering(false);
      }
    },
    [activePageId, queryClient, queryKey]
  );

  // ─── Update section schema ───
  const [isSavingSection, setIsSavingSection] = useState(false);

  const updateSectionSchema = useCallback(
    async (sectionId: string, schema: Record<string, unknown>) => {
      if (!activePageId) return;
      setIsSavingSection(true);

      const section = sections.find((s) => s.id === sectionId);
      if (!section) { setIsSavingSection(false); return; }

      try {
        const { data, error } = await supabase.rpc("builder_upsert_section", {
          p_page_id: activePageId,
          p_section_id: sectionId,
          p_section_type: section.section_type,
          p_schema: schema as unknown as Json,
          p_position: section.position,
          p_is_visible: section.is_visible,
          p_core_slot: section.core_slot || null,
        });

        if (error) throw new Error(error.message);
        const result = data as unknown as { ok: boolean; error?: string };
        if (!result.ok) throw new Error(result.error || "Failed to save");

        await queryClient.invalidateQueries({ queryKey });
        toast.success("Section saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save section");
      } finally {
        setIsSavingSection(false);
      }
    },
    [activePageId, sections, queryClient, queryKey]
  );

  // ─── Toggle section visibility ───
  const toggleSectionVisibility = useCallback(
    async (sectionId: string, visible: boolean) => {
      if (!activePageId) return;

      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      // Optimistic
      queryClient.setQueryData(queryKey, (old: EditorState | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (page.id !== activePageId) return page;
            return {
              ...page,
              sections: page.sections.map((s) =>
                s.id === sectionId ? { ...s, is_visible: visible } : s
              ),
            };
          }),
        };
      });

      try {
        const { data, error } = await supabase.rpc("builder_upsert_section", {
          p_page_id: activePageId,
          p_section_id: sectionId,
          p_section_type: section.section_type,
          p_schema: section.schema as unknown as Json,
          p_position: section.position,
          p_is_visible: visible,
          p_core_slot: section.core_slot || null,
        });

        if (error) throw new Error(error.message);
        const result = data as unknown as { ok: boolean; error?: string };
        if (!result.ok) throw new Error(result.error || "Toggle failed");

        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        await queryClient.invalidateQueries({ queryKey });
        toast.error(err instanceof Error ? err.message : "Failed to toggle visibility");
      }
    },
    [activePageId, sections, queryClient, queryKey]
  );

  // ─── Delete section ───
  const deleteSection = useCallback(
    async (sectionId: string) => {
      try {
        const { data, error } = await supabase.rpc("builder_delete_section", {
          p_section_id: sectionId,
        });

        if (error) throw new Error(error.message);
        const result = data as unknown as { success: boolean; error?: string };
        if (!result.success) throw new Error(result.error || "Failed to delete section");

        await queryClient.invalidateQueries({ queryKey });
        toast.success("Section deleted");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete section");
        return false;
      }
    },
    [queryClient, queryKey]
  );

  const refreshEditor = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // ─── Switch main content (atomic RPC) ───
  const [isSwitching, setIsSwitching] = useState(false);

  const switchMainContent = useCallback(
    async (newType: string): Promise<string | null> => {
      if (!activePageId) return null;
      setIsSwitching(true);

      // Compute registry-driven schema with correct variant defaults
      const templateResult = applyTemplateForMainContent(surfaceType, undefined, newType);
      const schema = templateResult.schema;

      try {
        const { data, error } = await supabase.rpc("builder_switch_main_content", {
          p_page_id: activePageId,
          p_new_section_type: newType,
          p_default_schema: schema as unknown as Json,
        });

        if (error) throw new Error(error.message);
        const result = data as unknown as { ok: boolean; error?: string; section_id?: string };
        if (!result.ok) throw new Error(result.error || "Failed to switch content");

        await queryClient.invalidateQueries({ queryKey });
        toast.success(`Switched to ${newType.replace(/_/g, " ")}`);
        return result.section_id || null;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to switch content");
        return null;
      } finally {
        setIsSwitching(false);
      }
    },
    [activePageId, surfaceType, queryClient, queryKey]
  );

  // Detect current main content type — prefer core_slot from DB
  const currentMainContentType = sections.find(
    (s) => s.core_slot === "main_content" || (s.isCore && (CONTENT_SECTION_TYPES.has(s.section_type) || s.section_type === resolveCoreSectionType("main_content", surfaceType)))
  )?.section_type || null;

  return {
    editorState,
    isLoading,
    error: error?.message || null,
    activePage,
    activePageId,
    setActivePageId,
    sections,
    pageSettings,
    savePageSettings,
    isSavingPageSettings,
    addSection,
    addSectionWithSchema,
    isAdding,
    reorderSections,
    isReordering,
    updateSectionSchema,
    toggleSectionVisibility,
    deleteSection,
    isSavingSection,
    refreshEditor,
    switchMainContent,
    isSwitching,
    currentMainContentType,
  };
}
