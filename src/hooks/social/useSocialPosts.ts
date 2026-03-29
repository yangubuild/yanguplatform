import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { postLifecycleService } from "@/services/socialMedia";
import type { PostStatus, PostCounts, CreatePostInput, UpdatePostInput } from "@/types/socialMedia";

export function useSocialPosts(statusFilter?: PostStatus) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: socialKeys.postsList({ status: statusFilter }),
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("social_posts")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter) {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(postLifecycleService.mapToPost);
    },
  });

  const countsQuery = useQuery({
    queryKey: socialKeys.postCounts(),
    enabled: !!user,
    queryFn: async (): Promise<PostCounts> => {
      if (!user) return { drafts: 0, scheduled: 0, published: 0, failed: 0, archived: 0 };

      const statuses: PostStatus[] = ["draft", "scheduled", "published", "failed", "archived"];
      const counts: PostCounts = { drafts: 0, scheduled: 0, published: 0, failed: 0, archived: 0 };

      for (const status of statuses) {
        const { count } = await supabase
          .from("social_posts")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user.id)
          .eq("status", status);

        const key = status === "draft" ? "drafts" : status;
        (counts as Record<string, number>)[key] = count || 0;
      }

      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePostInput) => postLifecycleService.createDraft(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdatePostInput) => postLifecycleService.saveDraft(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => postLifecycleService.deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (params: { postId: string; scheduledFor: string }) =>
      postLifecycleService.schedulePost(params.postId, params.scheduledFor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (postId: string) => postLifecycleService.publishNow(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (postId: string) => postLifecycleService.archivePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (postId: string) => postLifecycleService.duplicatePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });

  return {
    posts: listQuery.data || [],
    counts: countsQuery.data || { drafts: 0, scheduled: 0, published: 0, failed: 0, archived: 0 },
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createPost: createMutation.mutateAsync,
    updatePost: updateMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
    schedulePost: scheduleMutation.mutateAsync,
    publishPost: publishMutation.mutateAsync,
    archivePost: archiveMutation.mutateAsync,
    duplicatePost: duplicateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isPublishing: publishMutation.isPending,
  };
}
