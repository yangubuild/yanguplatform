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
    }) => {
      if (!user?.id) {
        toast.error("You must be logged in");
        return;
      }

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
          navigate(`/builder/${existing.id}`);
          return;
        }

        // 2) Create surface
        const { data: surface, error: createErr } = await supabase
          .from("builder_surfaces")
          .insert({
            user_id: user.id,
            surface_type: opts.surfaceType as any,
            slug: opts.slug,
            title: opts.title,
          })
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
        navigate(`/builder/${surface.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to initialize surface";
        toast.error(msg);
      } finally {
        setIsInitializing(false);
      }
    },
    [user, navigate]
  );

  return { initAndNavigate, isInitializing };
}
