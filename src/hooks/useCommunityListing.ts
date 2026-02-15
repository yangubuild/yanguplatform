import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CommunityListingStatus = "active" | "paused" | "removed" | null;

export function useCommunityListing(surfaceId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["community_listing", surfaceId] });
    queryClient.invalidateQueries({ queryKey: ["surfaces"] });
  };

  const listing = useQuery({
    queryKey: ["community_listing", surfaceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("community_listings")
        .select("id, status")
        .eq("surface_id", surfaceId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string } | null;
    },
    enabled: !!surfaceId,
  });

  const listOnCommunity = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("list_on_community", {
        p_surface_id: surfaceId,
      });
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Listed on Community");
        invalidate();
      } else {
        const errMsg = data?.error || "";
        const isKyc = errMsg.includes("KYC") || errMsg.toLowerCase().includes("verify your identity");
        if (isKyc) {
          toast.error("Verify your identity to list on Community.", {
            action: { label: "Start KYC", onClick: () => window.location.assign("/kyc") },
          });
        } else {
          toast.error(errMsg || "Failed to list on Community");
        }
      }
    },
    onError: (err: Error) => {
      const isKyc = err.message.includes("KYC") || err.message.toLowerCase().includes("verify your identity");
      if (isKyc) {
        toast.error("Verify your identity to list on Community.", {
          action: { label: "Start KYC", onClick: () => window.location.assign("/kyc") },
        });
      } else {
        toast.error(err.message);
      }
    },
  });

  const unlistFromCommunity = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("unlist_from_community", {
        p_surface_id: surfaceId,
      });
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Removed from Community feed");
        invalidate();
      } else {
        toast.error(data?.error || "Failed to unlist from Community");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const status: CommunityListingStatus = listing.data?.status as CommunityListingStatus ?? null;
  const isListed = status === "active";

  return { listing, status, isListed, listOnCommunity, unlistFromCommunity, invalidate };
}
