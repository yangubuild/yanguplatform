import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { libraryService } from "@/services/socialMedia";
import type { LibraryItemType, ImportLibraryInput } from "@/types/socialMedia";

export function useSocialLibrary(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.libraryList(),
    enabled: !!user,
    queryFn: () => libraryService.listItems(user!.id),
  });

  const importMutation = useMutation({
    mutationFn: (input: ImportLibraryInput) =>
      libraryService.importItem(user!.id, workspaceId || "", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.library() });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (params: { file: File; itemType: LibraryItemType }) =>
      libraryService.uploadFile(user!.id, workspaceId || "", params.file, params.itemType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.library() });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    importItem: importMutation.mutateAsync,
    uploadFile: uploadMutation.mutateAsync,
    isImporting: importMutation.isPending,
    isUploading: uploadMutation.isPending,
  };
}
