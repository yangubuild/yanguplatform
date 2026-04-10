/**
 * Hook: useSurfaceCommerceConfig
 * Manages commerce configuration for a surface (editor-side).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CommerceConfig = {
  id?: string;
  surface_id: string;
  owner_id: string;
  ordering_enabled: boolean;
  order_types: string[];
  currency: string;
  payment_methods: string[];
  mobile_money_phone: string | null;
  mobile_money_provider: string | null;
  mobile_money_country: string | null;
  stripe_enabled: boolean;
  paypal_enabled: boolean;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  whatsapp_enabled: boolean;
  whatsapp_default_message: string | null;
  min_order_value_cents: number | null;
  delivery_fee_cents: number | null;
};

const DEFAULT_CONFIG: Omit<CommerceConfig, "surface_id" | "owner_id"> = {
  ordering_enabled: false,
  order_types: ["delivery"],
  currency: "UGX",
  payment_methods: ["cash"],
  mobile_money_phone: null,
  mobile_money_provider: null,
  mobile_money_country: null,
  stripe_enabled: false,
  paypal_enabled: false,
  support_email: null,
  support_phone: null,
  support_whatsapp: null,
  whatsapp_enabled: false,
  whatsapp_default_message: "Hello! I have a question about my order.",
  min_order_value_cents: 0,
  delivery_fee_cents: 0,
};

export function useSurfaceCommerceConfig(surfaceId: string | undefined) {
  const qc = useQueryClient();
  const queryKey = ["surface_commerce_config", surfaceId];

  const { data: config, isLoading } = useQuery({
    queryKey,
    enabled: !!surfaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surface_commerce_config")
        .select("*")
        .eq("surface_id", surfaceId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<CommerceConfig> & { surface_id: string; owner_id: string }) => {
      const { data, error } = await supabase
        .from("surface_commerce_config")
        .upsert(updates, { onConflict: "surface_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Commerce settings saved");
    },
    onError: (err: any) => {
      toast.error("Failed to save commerce settings: " + (err.message || "Unknown error"));
    },
  });

  return {
    config: config ?? null,
    isLoading,
    defaults: DEFAULT_CONFIG,
    upsert: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}

/** Public read-only hook for visitor-facing pages */
export function usePublicCommerceConfig(surfaceId: string | undefined) {
  return useQuery({
    queryKey: ["public_commerce_config", surfaceId],
    enabled: !!surfaceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surface_commerce_config")
        .select("*")
        .eq("surface_id", surfaceId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
