import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserCredits {
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: "spend" | "add" | "refund" | "bonus";
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export function useCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserCredits | null;
    },
    enabled: !!user?.id,
  });
}

export function useCreditTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id,
  });
}

export function useSpendCredits() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      description,
      referenceId,
      referenceType,
    }: {
      amount: number;
      description?: string;
      referenceId?: string;
      referenceType?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("spend_credits", {
        _user_id: user.id,
        _amount: amount,
        _description: description || null,
        _reference_id: referenceId || null,
        _reference_type: referenceType || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; balance?: number };
      if (!result.success) {
        throw new Error(result.error || "Failed to spend credits");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-credits", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions", user?.id] });
    },
  });
}
