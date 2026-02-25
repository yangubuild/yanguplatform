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

/**
 * Find-or-create a builder surface, seed it with a home page + sections, then navigate to the editor.
 */
export interface BuilderSurfaceInitResult {
  surfaceId: string;
  targetUrl: string;
  navigated: boolean;
}

export function useBuilderSurfaceInit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);

  const initAndNavigate = useCallback(
    async (opts: {
      surfaceType: string;
      slug: string;
      title: string;
      seedSections?: { type: string; schema: Record<string, unknown> }[];
      metadata?: Record<string, unknown>;
    }): Promise<BuilderSurfaceInitResult | null> => {
      if (!user?.id) {
        toast.error("You must be logged in");
        return null;
      }

      const navigateToEditor = (surfaceId: string): BuilderSurfaceInitResult => {
        const targetUrl = `/builder/${surfaceId}`;
        try {
          navigate(targetUrl);
          return { surfaceId, targetUrl, navigated: true };
        } catch (error) {
          console.error("[useBuilderSurfaceInit] Navigation failed", { surfaceId, targetUrl, error });
          return { surfaceId, targetUrl, navigated: false };
        }
      };

      setIsInitializing(true);
      try {
        // 1) Find existing surface
        const { data: existing, error: findErr } = await supabase
          .from("builder_surfaces")
          .select("id")
          .eq("user_id", user.id)
          .eq("surface_type", opts.surfaceType as any)
          .eq("slug", opts.slug)
          .limit(1)
          .maybeSingle();

        if (findErr) throw new Error(findErr.message);

        if (existing) {
          return navigateToEditor(existing.id);
        }

        // 2) Create surface
        const insertPayload: Record<string, unknown> = {
          user_id: user.id,
          surface_type: opts.surfaceType as any,
          slug: opts.slug,
          title: opts.title,
        };
        if (opts.metadata) {
          insertPayload.metadata = opts.metadata;
        }
        const { data: surface, error: createErr } = await supabase
          .from("builder_surfaces")
          .insert(insertPayload as any)
          .select("id")
          .single();

        if (createErr) throw new Error(createErr.message);

        // 3) Create home page
        const { data: page, error: pageErr } = await supabase
          .from("builder_pages")
          .insert({
            surface_id: surface.id,
            slug: "home",
            title: "Home",
          })
          .select("id")
          .single();

        if (pageErr) throw new Error(pageErr.message);

        // 4) Seed sections
        const sections = opts.seedSections || DEFAULT_SEED_SECTIONS;
        for (let i = 0; i < sections.length; i++) {
          const s = sections[i];
          await supabase.rpc("builder_upsert_section", {
            p_page_id: page.id,
            p_section_type: s.type,
            p_schema: s.schema as unknown as Json,
            p_position: i,
            p_is_visible: true,
          });
        }

        toast.success("Surface created — opening editor");
        return navigateToEditor(surface.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to initialize surface";
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
