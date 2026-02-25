import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface SurfaceSettings {
  title: string;
  description: string;
  slug: string;
  metadata: Record<string, unknown>;
}

export function useBuilderSurfaceSettings(surfaceId: string) {
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (settings: Partial<SurfaceSettings>) => {
      setIsSaving(true);
      try {
        const { data, error } = await (supabase.rpc as any)(
          "builder_update_surface",
          {
            p_surface_id: surfaceId,
            p_title: settings.title ?? null,
            p_description: settings.description ?? null,
            p_slug: settings.slug ?? null,
            p_metadata: (settings.metadata as Json) ?? null,
          }
        );
        if (error) throw error;
        if (data && !data.ok) {
          const errMsg =
            data.error === "slug_not_available"
              ? "That slug is already taken"
              : data.error || "Update failed";
          toast.error(errMsg);
          return null;
        }
        toast.success("Settings saved");
        return data?.surface ?? null;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [surfaceId]
  );

  return { save, isSaving };
}
