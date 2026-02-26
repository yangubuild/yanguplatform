import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const DEFAULT_SEED_SECTIONS = [
  { type: "hero", schema: { headline: "Welcome to my page", subheadline: "" } },
  { type: "bio", schema: { text: "" } },
  { type: "links", schema: { items: [] } },
] as const;

export interface BuilderSurfaceInitResult {
  surfaceId: string;
  targetUrl: string;
  navigated: boolean;
}

interface InitOptions {
  surfaceType: string;
  slug: string;
  title: string;
  seedSections?: { type: string; schema: Record<string, unknown>; core_slot?: string }[];
  metadata?: Record<string, unknown>;
}

interface RpcResult {
  ok?: boolean;
  error?: string;
}

export function useBuilderSurfaceInit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);

  const initAndNavigate = useCallback(
    async (opts: InitOptions): Promise<BuilderSurfaceInitResult | null> => {
      if (!user?.id) {
        toast.error("You must be logged in");
        return null;
      }

      const navigateToEditor = (surfaceId: string): BuilderSurfaceInitResult => {
        const targetUrl = `/builder/${surfaceId}`;
        console.log("AI_NAVIGATE_TO_EDITOR", { surfaceId, targetUrl });

        try {
          navigate(targetUrl, { replace: true });

          window.setTimeout(() => {
            if (window.location.pathname !== targetUrl) {
              console.error("AI_NAVIGATE_FAILED", {
                surfaceId,
                targetUrl,
                currentPath: window.location.pathname,
                error: "Route did not change after navigate()",
              });
              window.location.href = targetUrl;
            }
          }, 500);

          return { surfaceId, targetUrl, navigated: true };
        } catch (error) {
          console.error("AI_NAVIGATE_FAILED", { surfaceId, targetUrl, error });
          return { surfaceId, targetUrl, navigated: false };
        }
      };

      const ensureHomePage = async (surfaceId: string): Promise<string> => {
        const { data: existingPage, error: pageLookupError } = await supabase
          .from("builder_pages")
          .select("id")
          .eq("surface_id", surfaceId)
          .eq("slug", "home")
          .limit(1)
          .maybeSingle();

        if (pageLookupError) throw new Error(pageLookupError.message);
        if (existingPage?.id) return existingPage.id;

        const { data: page, error: pageCreateError } = await supabase
          .from("builder_pages")
          .insert({
            surface_id: surfaceId,
            slug: "home",
            title: "Home",
          })
          .select("id")
          .single();

        if (pageCreateError) throw new Error(pageCreateError.message);
        return page.id;
      };

      const saveDraft = async (surfaceId: string) => {
        const aiMeta = opts.metadata || {};
        console.log("AI_SAVE_DRAFT_START", {
          surfaceId,
          surfaceType: opts.surfaceType,
          _ai_source: aiMeta.ai_source ?? null,
          _ai_answers: aiMeta.ai_answers ?? null,
          _ai_profile: aiMeta.ai_profile ?? null,
        });

        const { data: currentSurface, error: surfaceReadError } = await supabase
          .from("builder_surfaces")
          .select("metadata")
          .eq("id", surfaceId)
          .single();

        if (surfaceReadError) throw new Error(surfaceReadError.message);

        const existingMetadata = (currentSurface?.metadata || {}) as Record<string, unknown>;
        const nextMetadata = {
          ...existingMetadata,
          ...(opts.metadata || {}),
        };

        const { error: surfaceUpdateError } = await supabase
          .from("builder_surfaces")
          .update({
            title: opts.title,
            metadata: nextMetadata as unknown as Json,
          })
          .eq("id", surfaceId);

        if (surfaceUpdateError) throw new Error(surfaceUpdateError.message);

        const pageId = await ensureHomePage(surfaceId);

        const { error: deleteError } = await supabase
          .from("builder_sections")
          .delete()
          .eq("page_id", pageId);

        if (deleteError) throw new Error(deleteError.message);

        const sections = opts.seedSections?.length ? opts.seedSections : DEFAULT_SEED_SECTIONS;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const coreSlot = ('core_slot' in section) ? (section as any).core_slot : null;
          const { data: upsertData, error: upsertError } = await supabase.rpc("builder_upsert_section", {
            p_page_id: pageId,
            p_section_type: section.type,
            p_schema: section.schema as unknown as Json,
            p_position: i,
            p_is_visible: true,
            p_core_slot: coreSlot || null,
          });

          if (upsertError) throw new Error(upsertError.message);

          const result = (upsertData || {}) as RpcResult;
          if (result.ok === false) throw new Error(result.error || "Failed to save section");
        }

        console.log("AI_SAVE_DRAFT_DONE", {
          surfaceId,
          pageId,
          sectionCount: sections.length,
          sectionTypes: sections.map((section) => section.type),
        });
      };

      setIsInitializing(true);
      try {
        const { data: existing, error: findErr } = await supabase
          .from("builder_surfaces")
          .select("id")
          .eq("user_id", user.id)
          .eq("surface_type", opts.surfaceType as any)
          .eq("slug", opts.slug)
          .limit(1)
          .maybeSingle();

        if (findErr) throw new Error(findErr.message);

        let surfaceId = existing?.id;

        if (!surfaceId) {
          const { data: surface, error: createErr } = await supabase
            .from("builder_surfaces")
            .insert({
              user_id: user.id,
              surface_type: opts.surfaceType as any,
              slug: opts.slug,
              title: opts.title,
              metadata: opts.metadata || {},
            } as any)
            .select("id")
            .single();

          if (createErr) throw new Error(createErr.message);
          surfaceId = surface.id;
        }

        if (!surfaceId) throw new Error("Surface creation failed: missing surfaceId");

        await saveDraft(surfaceId);

        toast.success("Surface ready — opening editor");
        return navigateToEditor(surfaceId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to initialize surface";
        console.error("AI_NAVIGATE_FAILED", {
          surfaceId: null,
          targetUrl: null,
          error: msg,
        });
        toast.error(msg);
        return null;
      } finally {
        setIsInitializing(false);
      }
    },
    [user, navigate]
  );

  return { initAndNavigate, isInitializing };
}
