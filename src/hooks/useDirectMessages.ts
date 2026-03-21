import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

/** Get all messages in a conversation with a specific user — with realtime */
export function useConversation(otherUserId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription for DMs
  useEffect(() => {
    if (!user || !otherUserId) return;
    const channel = supabase
      .channel(`dm-${user.id}-${otherUserId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "direct_messages",
      }, (payload: any) => {
        const row = payload.new;
        if (
          (row.sender_id === user.id && row.receiver_id === otherUserId) ||
          (row.sender_id === otherUserId && row.receiver_id === user.id)
        ) {
          qc.invalidateQueries({ queryKey: ["conversation", user.id, otherUserId] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, otherUserId, qc]);

  return useQuery({
    queryKey: ["conversation", user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    queryFn: async (): Promise<DirectMessage[]> => {
      const { data, error } = await (supabase
        .from("direct_messages" as any)
        .select("*") as any)
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as DirectMessage[];
    },
    refetchInterval: 15000, // reduced since realtime handles most updates
  });
}

/** Get recent conversation threads (unique users) */
export function useConversationList() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("direct_messages" as any)
        .select("*") as any)
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const msgs = (data ?? []) as DirectMessage[];
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
  const inflightRef = useRef(false);

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error("Not logged in");
      if (inflightRef.current) return; // prevent double send
      inflightRef.current = true;
      try {
        const { error } = await supabase
          .from("direct_messages" as any)
          .insert({ sender_id: user.id, receiver_id: receiverId, content } as any);
        if (error) throw error;
      } finally {
        inflightRef.current = false;
      }
    },
    onSuccess: (_, { receiverId }) => {
      qc.invalidateQueries({ queryKey: ["conversation", user?.id, receiverId] });
      qc.invalidateQueries({ queryKey: ["conversation-list"] });
    },
  });
}
