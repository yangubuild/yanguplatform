import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StartDomainVerificationRequest {
  orgId: string;
  domainId: string;
  method?: string;
}

export interface StartDomainVerificationResult {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Hook to call the start_domain_verification RPC
 * Initiates domain verification process
 */
export function useStartDomainVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      domainId,
      method = "dns_txt",
    }: StartDomainVerificationRequest): Promise<StartDomainVerificationResult> => {
      // Call existing RPC - using type assertion since types may not be regenerated
      const { data, error } = await (supabase.rpc as Function)(
        "start_domain_verification",
        {
          p_org_id: orgId,
          p_domain_id: domainId,
          p_method: method,
        }
      );

      if (error) {
        console.error("[useStartDomainVerification] RPC error:", error);
        throw new Error(error.message);
      }

      // RPC returns JSONB
      return data as StartDomainVerificationResult;
    },
    onSuccess: () => {
      // Invalidate domain queries to refresh status
      queryClient.invalidateQueries({ queryKey: ["org-domains"] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
  });
}
