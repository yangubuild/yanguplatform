import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { campaignEngine, type CampaignInput, type Campaign } from "@/services/socialMedia/campaignEngine";

export function useCampaigns(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...socialKeys.all, "campaigns", workspaceId],
    enabled: !!user && !!workspaceId,
    queryFn: () => campaignEngine.listCampaigns(workspaceId!),
  });

  const createMutation = useMutation({
    mutationFn: (input: CampaignInput) => campaignEngine.createCampaign(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...socialKeys.all, "campaigns"] }),
  });

  const generateMutation = useMutation({
    mutationFn: ({ campaignId, onProgress }: { campaignId: string; onProgress?: (c: number, t: number) => void }) =>
      campaignEngine.generateCampaign(campaignId, onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...socialKeys.all, "campaigns"] }),
  });

  const togglePauseMutation = useMutation({
    mutationFn: ({ campaignId, paused }: { campaignId: string; paused: boolean }) =>
      campaignEngine.togglePause(campaignId, paused),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...socialKeys.all, "campaigns"] }),
  });

  return {
    campaigns: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    togglePause: togglePauseMutation.mutateAsync,
  };
}

export function useCampaignDetail(campaignId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...socialKeys.all, "campaign", campaignId],
    enabled: !!user && !!campaignId,
    queryFn: () => campaignEngine.getCampaign(campaignId!),
  });
}
