import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useChatLists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat-lists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_lists")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateChatList() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, memberUserIds }: { name: string; description?: string; memberUserIds: string[] }) => {
      const { data: list, error } = await supabase
        .from("chat_lists")
        .insert({ user_id: user!.id, name, description: description || null })
        .select("id")
        .single();
      if (error) throw error;

      if (memberUserIds.length > 0) {
        const rows = memberUserIds.map((uid) => ({ list_id: list.id, member_user_id: uid }));
        const { error: mErr } = await supabase.from("chat_list_members").insert(rows);
        if (mErr) throw mErr;
      }

      return list.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-lists"] }),
  });
}
