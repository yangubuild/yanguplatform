import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function forceDeleteSurface(surfaceId: string): Promise<boolean> {
  try {
    // 1) Delete any admin overrides for this surface
    const { error: overrideError } = await supabase
      .from("admin_overrides")
      .delete()
      .eq("surface_id", surfaceId);

    if (overrideError) {
      console.warn("Failed to delete admin_overrides:", overrideError);
      // Continue anyway - these may not exist
    }

    // 2) Delete any publish rows
    const { error: publishError } = await supabase
      .from("surface_publishes")
      .delete()
      .eq("surface_id", surfaceId);

    if (publishError) {
      console.warn("Failed to delete surface_publishes:", publishError);
      // Continue anyway - these may not exist
    }

    // 3) Delete the surface itself
    const { error: surfaceError } = await supabase
      .from("surfaces")
      .delete()
      .eq("id", surfaceId);

    if (surfaceError) throw surfaceError;

    toast.success("Surface deleted");
    return true;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Cannot delete surface";
    console.error("Force delete failed:", e);
    toast.error(message);
    return false;
  }
}
