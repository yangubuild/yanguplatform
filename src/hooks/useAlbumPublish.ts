import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 8);
}

export function useAlbumPublish() {
  const [isToggling, setIsToggling] = useState(false);

  const toggleAlbum = async (
    projectId: string,
    currentlyPublished: boolean,
    title: string
  ): Promise<{ published: boolean; slug: string | null } | null> => {
    setIsToggling(true);
    try {
      const newPublished = !currentlyPublished;
      const slug = newPublished ? generateSlug(title) : null;

      const updatePayload: Record<string, unknown> = {
        album_published: newPublished,
      };
      // Only set slug when publishing; preserve existing slug on unpublish
      if (newPublished) {
        updatePayload.album_slug = slug;
      }

      const { error } = await supabase
        .from("studio_projects")
        .update(updatePayload)
        .eq("id", projectId);

      if (error) {
        toast.error("Failed to update album status");
        console.error(error);
        return null;
      }

      toast.success(newPublished ? "Album published!" : "Album unpublished");
      return { published: newPublished, slug };
    } catch (err) {
      toast.error("Failed to toggle album");
      console.error(err);
      return null;
    } finally {
      setIsToggling(false);
    }
  };

  return { toggleAlbum, isToggling };
}
