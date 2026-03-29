import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { libraryService, type LibrarySourceType, type LibraryItem } from "@/services/socialMedia/libraryService";
import { toast } from "sonner";

const FREE_UPLOAD_LIMIT = 10;

export function useSocialLibrary(filters?: { search?: string; source_type?: LibrarySourceType }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.libraryList(filters as Record<string, unknown>),
    enabled: !!user,
    queryFn: () => libraryService.listItems(user!.id, filters),
  });

  const countsQuery = useQuery({
    queryKey: [...socialKeys.library(), "counts"],
    enabled: !!user,
    queryFn: () => libraryService.countBySource(user!.id),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      // Check upload limit
      const counts = await libraryService.countBySource(user.id);
      if (counts.upload >= FREE_UPLOAD_LIMIT) {
        throw new Error("UPLOAD_LIMIT_REACHED");
      }
      return libraryService.uploadFile(user.id, file, "upload");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.library() });
      toast.success("Image uploaded to library");
    },
    onError: (err: Error) => {
      if (err.message === "UPLOAD_LIMIT_REACHED") {
        toast.error(`Upload limit reached (${FREE_UPLOAD_LIMIT} images). Upgrade your plan for more.`);
      } else {
        toast.error("Upload failed");
      }
    },
  });

  const saveUrlMutation = useMutation({
    mutationFn: async (params: { url: string; title: string; sourceType: LibrarySourceType; metadata?: Record<string, unknown> }) => {
      if (!user) throw new Error("Not authenticated");
      return libraryService.saveUrl(user.id, params.url, params.title, params.sourceType, params.metadata);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: socialKeys.library() });
      toast.success(vars.sourceType === "stock" ? "Stock image saved to library" : "Image saved to library");
    },
    onError: () => {
      toast.error("Failed to save to library");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => libraryService.deleteItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.library() });
      toast.success("Removed from library");
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    counts: countsQuery.data || { upload: 0, stock: 0, ai_generated: 0, total: 0 },
    uploadLimit: FREE_UPLOAD_LIMIT,
    uploadFile: uploadMutation.mutateAsync,
    saveUrl: saveUrlMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isSaving: saveUrlMutation.isPending,
  };
}
