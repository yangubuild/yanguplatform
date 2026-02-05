import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConnectDomainRequest {
  org_id: string;
  domain: string;
  kind: string;
}

export interface ConnectDomainResult {
  success: boolean;
  domain_id?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Hook to call the connect_domain_request RPC
 * Connects a custom domain to an organization
 */
export function useConnectDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ConnectDomainRequest): Promise<ConnectDomainResult> => {
      // Call existing RPC - using type assertion since types may not be regenerated
      const { data, error } = await (supabase.rpc as Function)(
        "connect_domain_request",
        {
          org_id: request.org_id,
          domain: request.domain,
          kind: request.kind,
        }
      );

      if (error) {
        console.error("[useConnectDomain] RPC error:", error);
        throw new Error(error.message);
      }

      // RPC returns JSONB
      return data as ConnectDomainResult;
    },
    onSuccess: () => {
      // Invalidate domain queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["org-domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}
