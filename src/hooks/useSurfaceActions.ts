import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { forceDeleteSurface } from "@/lib/forceDeleteSurface";

interface RpcResponse {
  success: boolean;
  error?: string;
  message?: string;
  requires_unpublish?: boolean;
  draft_slug?: string;
  slug_available?: boolean;
}

export function useSurfaceActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["surfaces"] });
    queryClient.invalidateQueries({ queryKey: ["surface_publishes"] });
  };

  const renameSurface = useMutation({
    mutationFn: async ({ surfaceId, newTitle }: { surfaceId: string; newTitle: string }) => {
      const { data, error } = await supabase.rpc("rename_surface", {
        p_surface_id: surfaceId,
        p_new_title: newTitle,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        if (data.slug_available === false) {
          toast.warning("Surface renamed, but the URL slug is already taken. Update it before publishing.");
        } else {
          toast.success("Surface renamed");
        }
        invalidate();
      } else {
        toast.error(data?.error || "Failed to rename surface");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unpublishSurface = useMutation({
    mutationFn: async ({ surfaceId, domainId }: { surfaceId: string; domainId: string }) => {
      const { data, error } = await supabase.rpc("unpublish_surface", {
        p_surface_id: surfaceId,
        p_domain_id: domainId,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Surface unpublished");
        invalidate();
      } else {
        toast.error(data?.error || "Failed to unpublish surface");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const archiveSurface = useMutation({
    mutationFn: async (surfaceId: string) => {
      const { data, error } = await supabase.rpc("archive_surface", {
        p_surface_id: surfaceId,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Surface archived");
        invalidate();
      } else {
        toast.error(data?.error || "Failed to archive surface");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unarchiveSurface = useMutation({
    mutationFn: async (surfaceId: string) => {
      const { data, error } = await supabase.rpc("unarchive_surface", {
        p_surface_id: surfaceId,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Surface restored");
        invalidate();
      } else {
        toast.error(data?.error || "Failed to restore surface");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteSurface = useMutation({
    mutationFn: async (surfaceId: string) => {
      const success = await forceDeleteSurface(surfaceId);
      if (!success) {
        throw new Error("Failed to delete surface");
      }
      return { success: true };
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      // Error toast already shown by forceDeleteSurface
    },
  });

  const republishSurface = useMutation({
    mutationFn: async ({ surfaceId, domainId, slug }: { surfaceId: string; domainId: string; slug: string }) => {
      const { data, error } = await supabase.rpc("request_publish_surface", {
        p_surface_id: surfaceId,
        p_domain_id: domainId,
        p_slug: slug,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Surface republished");
        invalidate();
      } else {
        toast.error(data?.error || "Failed to republish surface");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    renameSurface,
    unpublishSurface,
    archiveSurface,
    unarchiveSurface,
    deleteSurface,
    republishSurface,
  };
}
