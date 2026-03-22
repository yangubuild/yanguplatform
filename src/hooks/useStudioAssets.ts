/**
 * Studio Assets hooks — fetch, download (with credit deduction), and save-to-studio.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type AssetType = "image" | "video" | "script" | "audio";

export interface StudioAsset {
  id: string;
  user_id: string;
  project_id: string;
  asset_type: string;
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  generation_prompt: string | null;
  download_credits: number;
  is_uploaded: boolean;
  platform: string | null;
  language: string | null;
  variation_index: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useStudioAssets(filters?: { assetType?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["studio-assets", user?.id, filters?.assetType],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("studio_assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.assetType) {
        query = query.eq("asset_type", filters.assetType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StudioAsset[];
    },
    enabled: !!user?.id,
  });
}

export function useDownloadAsset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("deduct_download_credit", {
        p_asset_id: assetId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; file_url?: string; cost?: number; balance?: number };
      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      if (result.file_url) {
        // Trigger browser download
        const a = document.createElement("a");
        a.href = result.file_url;
        a.download = "";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      const cost = result.cost ?? 0;
      toast.success(cost> 0 ? `Downloaded (${cost} credit${cost> 1 ? "s" : ""} used)` : "Downloaded");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Download failed");
    },
  });
}

export function useSaveToStudio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      fileUrl,
      storagePath,
      assetType,
      title,
      prompt,
      projectId,
      provider,
      metadata,
    }: {
      fileUrl: string;
      storagePath?: string;
      assetType: string;
      title?: string;
      prompt?: string;
      projectId?: string;
      provider?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      let targetProjectId = projectId;

      // If no project given, create an ad-hoc one
      if (!targetProjectId) {
        const { data: project, error: projErr } = await supabase
          .from("studio_projects")
          .insert({
            user_id: user.id,
            title: "Quick Saves",
            status: "active",
          })
          .select("id")
          .maybeSingle();

        if (projErr) {
          // Try to find existing "Quick Saves" project
          const { data: existing } = await supabase
            .from("studio_projects")
            .select("id")
            .eq("user_id", user.id)
            .eq("title", "Quick Saves")
            .maybeSingle();

          if (existing) {
            targetProjectId = existing.id;
          } else {
            throw new Error("Could not create project");
          }
        } else {
          targetProjectId = project?.id;
        }
      }

      if (!targetProjectId) throw new Error("No project available");

      const { data, error } = await supabase
        .from("studio_assets")
        .insert({
          user_id: user.id,
          project_id: targetProjectId,
          asset_type: assetType,
          title: title || null,
          file_url: fileUrl,
          thumbnail_url: fileUrl,
          generation_prompt: prompt || null,
          is_uploaded: false,
          metadata: {
            ...metadata,
            source_provider: provider || "ada",
            source_storage_path: storagePath || null,
          },
        })
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-assets"] });
      toast.success("Saved to Studio");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save to Studio");
    },
  });
}
