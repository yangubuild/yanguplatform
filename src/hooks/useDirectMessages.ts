import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

/** Get all messages in a conversation with a specific user */
export function useConversation(otherUserId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation", user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    queryFn: async (): Promise<DirectMessage[]> => {
      const { data, error } = await supabase
        .from("direct_messages" as any)
        .select("*")
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as DirectMessage[];
    },
    refetchInterval: 5000, // poll every 5s
  });
}

/** Get recent conversation threads (unique users) */
export function useConversationList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get latest message per conversation partner
      const { data, error } = await supabase
        .from("direct_messages" as any)
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const msgs = (data ?? []) as DirectMessage[];
      // Deduplicate by conversation partner
      const seen = new Map<string, DirectMessage>();
      for (const m of msgs) {
        const partnerId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        if (!seen.has(partnerId)) seen.set(partnerId, m);
      }
      return Array.from(seen.entries()).map(([partnerId, lastMsg]) => ({
        partnerId,
        lastMessage: lastMsg,
      }));
    },
    refetchInterval: 10000,
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("direct_messages" as any)
        .insert({ sender_id: user.id, receiver_id: receiverId, content } as any);
      if (error) throw error;
    },
    onSuccess: (_, { receiverId }) => {
      qc.invalidateQueries({ queryKey: ["conversation", user?.id, receiverId] });
      qc.invalidateQueries({ queryKey: ["conversation-list"] });
    },
  });
}
