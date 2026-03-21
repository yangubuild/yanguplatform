import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useEffect, useRef } from "react";

export interface GlobalChatReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface GlobalChatMessage {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  metadata: any;
  created_at: string;
  reply_to: string | null;
  author_name?: string;
  author_avatar?: string;
  author_username?: string;
  reactions: GlobalChatReaction[];
  replyMessage?: { author_name: string; content: string } | null;
}

export function useGlobalChatMessages() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("global-chat-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["global-chat-messages"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "global_chat_reactions" }, () => {
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

      const msgIds = msgs.map(m => m.id);
      const { data: reactionsData } = await supabase
        .from("global_chat_reactions" as any)
        .select("*")
        .in("message_id", msgIds);

      const reactionsByMsg: Record<string, GlobalChatReaction[]> = {};
      for (const r of (reactionsData ?? []) as any[]) {
        if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = [];
        const existing = reactionsByMsg[r.message_id].find(x => x.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.userIds.push(r.user_id);
        } else {
          reactionsByMsg[r.message_id].push({ emoji: r.emoji, count: 1, userIds: [r.user_id] });
        }
      }

      const msgMap = Object.fromEntries(msgs.map(m => [m.id, m]));

      return msgs.map(m => {
        const prof = profileMap[m.user_id];
        const resolvedAvatar = prof ? resolveAvatarUrl(prof) : null;
        let replyMessage = null;
        if (m.reply_to && msgMap[m.reply_to]) {
          const rp = msgMap[m.reply_to];
          const rpProf = profileMap[rp.user_id];
          replyMessage = {
            author_name: rpProf?.display_name || rpProf?.username || "Unknown",
            content: rp.content?.slice(0, 80) || "📷",
          };
        }
        return {
          ...m,
          author_name: prof?.display_name || prof?.username || "Unknown",
          author_avatar: resolvedAvatar || undefined,
          author_username: prof?.username || undefined,
          reactions: reactionsByMsg[m.id] || [],
          replyMessage,
        };
      });
    },
    refetchInterval: 10000,
  });
}

export function useSendGlobalMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inflightRef = useRef(false);

  return useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType, metadata, replyTo }: {
      content: string;
      mediaUrl?: string;
      mediaType?: string;
      metadata?: any;
      replyTo?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        const { error } = await supabase
          .from("global_chat_messages" as any)
          .insert({
            user_id: user.id,
            content,
            media_url: mediaUrl || null,
            media_type: mediaType || "text",
            metadata: metadata || {},
            reply_to: replyTo || null,
          } as any);
        if (error) throw error;
      } finally {
        inflightRef.current = false;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global-chat-messages"] });
    },
  });
}

export function useToggleGlobalReaction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("global_chat_reactions" as any)
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("global_chat_reactions" as any).delete().eq("id", (existing as any).id);
      } else {
        await supabase.from("global_chat_reactions" as any).insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global-chat-messages"] });
    },
  });
}
