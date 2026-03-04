import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "./useActiveOrg";
import { toast } from "sonner";

export interface DropshipConnection {
  id: string;
  org_id: string;
  provider_key: string;
  connection_status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useDropshipConnections() {
  const { data: activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["dropship-connections", orgId],
    queryFn: async (): Promise<DropshipConnection[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("dropship_connections")
        .select("*")
        .eq("org_id", orgId);
      if (error) throw error;
      return (data ?? []) as DropshipConnection[];
    },
    enabled: !!orgId,
  });

  const connectMutation = useMutation({
    mutationFn: async (providerKey: string) => {
      if (!orgId) throw new Error("No active organization");
      const { data, error } = await supabase
        .from("dropship_connections")
        .upsert(
          { org_id: orgId, provider_key: providerKey, connection_status: "active", metadata: {} },
          { onConflict: "org_id,provider_key" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, providerKey) => {
      queryClient.invalidateQueries({ queryKey: ["dropship-connections", orgId] });
      toast.success(`Connected to ${providerKey === "cj" ? "CJ Dropshipping" : providerKey === "moderndropship" ? "ModernDropship" : providerKey}`);
    },
    onError: (err: any) => {
      toast.error("Connection failed: " + (err.message || "unknown error"));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (providerKey: string) => {
      if (!orgId) throw new Error("No active organization");
      const { error } = await supabase
        .from("dropship_connections")
        .delete()
        .eq("org_id", orgId)
        .eq("provider_key", providerKey);
      if (error) throw error;
    },
    onSuccess: (_, providerKey) => {
      queryClient.invalidateQueries({ queryKey: ["dropship-connections", orgId] });
      toast.success(`Disconnected from ${providerKey === "cj" ? "CJ Dropshipping" : providerKey === "moderndropship" ? "ModernDropship" : providerKey}`);
    },
    onError: (err: any) => {
      toast.error("Disconnect failed: " + (err.message || "unknown error"));
    },
  });

  const isConnected = (providerKey: string): boolean => {
    if (providerKey === "estores") return true; // always connected
    return connectionsQuery.data?.some(
      (c) => c.provider_key === providerKey && c.connection_status === "active"
    ) ?? false;
  };

  const connectedProviders = (): string[] => {
    const connected = (connectionsQuery.data ?? [])
      .filter((c) => c.connection_status === "active")
      .map((c) => c.provider_key);
    if (!connected.includes("estores")) connected.push("estores");
    return connected;
  };

  return {
    connections: connectionsQuery.data ?? [],
    isLoading: connectionsQuery.isLoading,
    isConnected,
    connectedProviders,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
