import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// ─── Types ───
export interface EditorSection {
  id: string;
  section_type: string;
  schema: Record<string, unknown>;
  position: number;
  is_visible: boolean;
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
  const sections = activePage?.sections?.slice().sort((a, b) => a.position - b.position) || [];

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
    async (sectionType: string, schema: Record<string, unknown>) => {
      if (!activePageId) return;
      setIsAdding(true);

      const nextPosition = sections.length > 0 ? Math.max(...sections.map((s) => s.position)) + 1 : 0;

      try {
        const { data, error } = await supabase.rpc("builder_upsert_section", {
          p_page_id: activePageId,
          p_section_type: sectionType,
          p_schema: schema as unknown as Json,
          p_position: nextPosition,
          p_is_visible: true,
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

        // Revalidate to confirm
        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        // Rollback
        await queryClient.invalidateQueries({ queryKey });
        const msg = err instanceof Error ? err.message : "Reorder failed";
        toast.error(msg);
      } finally {
        setIsReordering(false);
      }
    },
    [activePageId, queryClient, queryKey]
  );

  return {
    editorState,
    isLoading,
    error: error?.message || null,
    activePage,
    activePageId,
    setActivePageId,
    sections,
    addSection,
    addSectionWithSchema,
    isAdding,
    reorderSections,
    isReordering,
  };
}
