import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useEffect } from "react";

export interface GlobalChatMessage {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  metadata: any;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_username?: string;
}

export function useGlobalChatMessages() {
  const qc = useQueryClient();

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel("global-chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["global-chat-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["global-chat-messages"],
    queryFn: async (): Promise<GlobalChatMessage[]> => {
      const { data, error } = await supabase
        .from("global_chat_messages" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      const msgs = (data ?? []) as any[];
      if (msgs.length === 0) return [];

      const userIds = [...new Set(msgs.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

      return msgs.map(m => {
        const prof = profileMap[m.user_id];
        const resolvedAvatar = prof ? resolveAvatarUrl(prof) : null;
        return {
          ...m,
          author_name: prof?.display_name || prof?.username || "Unknown",
          author_avatar: resolvedAvatar || undefined,
          author_username: prof?.username || undefined,
        };
      });
    },
    refetchInterval: 10000,
  });
}

export function useSendGlobalMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType, metadata }: {
      content: string;
      mediaUrl?: string;
      mediaType?: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("global_chat_messages" as any)
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || "text",
          metadata: metadata || {},
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global-chat-messages"] });
    },
  });
}
