import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialConnectedAccount, SocialProvider } from "@/types/socialMedia";
import { providerRegistry } from "@/services/socialMedia";

export function useConnectedAccounts(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.accounts(),
    enabled: !!user,
    queryFn: async (): Promise<SocialConnectedAccount[]> => {
      if (!user) return [];
      let q = supabase
        .from("social_connected_accounts")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "disconnected");

      if (workspaceId) {
        q = q.eq("workspace_id", workspaceId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        workspace_id: row.workspace_id || "",
        user_id: row.user_id,
        provider: row.provider as SocialProvider,
        provider_account_id: row.provider_user_id,
        provider_account_name: row.display_name,
        avatar_url: row.avatar_url,
        status: row.status as SocialConnectedAccount["status"],
        metadata: row.metadata as Record<string, unknown> | null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (params: {
      provider: SocialProvider;
      redirectUrl: string;
      workspaceId: string;
    }) => {
      const provider = providerRegistry.getDefault();
      if (!provider) throw new Error("No provider configured");
      const result = await provider.getConnectUrl(params);
      // Redirect user to OAuth URL
      if (result.url) {
        window.location.href = result.url;
      }
      return result;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const provider = providerRegistry.getDefault();
      if (provider) {
        try {
          await provider.disconnectAccount(accountId);
        } catch {
          // Fall back to local status update
        }
      }
      const { error } = await supabase
        .from("social_connected_accounts")
        .update({ status: "disconnected" })
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.accounts() });
    },
  });

  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const provider = providerRegistry.getDefault();
      if (!provider) return { ok: false, message: "No provider configured" };
      return provider.healthCheck();
    },
  });

  return {
    accounts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    checkHealth: healthCheckMutation.mutateAsync,
    healthStatus: healthCheckMutation.data,
    isCheckingHealth: healthCheckMutation.isPending,
  };
}
