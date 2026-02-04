import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RpcResponse {
  success: boolean;
  error?: string;
  message?: string;
  requires_unpublish?: boolean;
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
        toast.success("Surface renamed");
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
      const { data, error } = await supabase.rpc("delete_surface", {
        p_surface_id: surfaceId,
      });
      if (error) throw error;
      return data as unknown as RpcResponse;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Surface deleted");
        invalidate();
      } else {
        if (data?.requires_unpublish) {
          toast.error("Cannot delete a live surface. Unpublish it first.");
        } else {
          toast.error(data?.error || "Failed to delete surface");
        }
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
  };
}
