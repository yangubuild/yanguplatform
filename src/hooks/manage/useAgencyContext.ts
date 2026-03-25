import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Resolves the current user's agency membership.
 * Returns agency_id, role, and agency info.
 */
export function useAgencyContext() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agency-context", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("agency_members")
        .select("id, agency_id, role, status, agencies(id, name, slug, status, region, metadata)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
