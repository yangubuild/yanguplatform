import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useEffect, useRef } from "react";

export interface ChatGroup {
  id: string;
  name: string;
  created_by: string;
  avatar_url: string | null;
  created_at: string;
  member_count?: number;
}

export interface GroupMessage {
  id: string;
  group_id: string;
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

export function useMyGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-groups", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ChatGroup[]> => {
      const { data: memberships } = await supabase
        .from("chat_group_members" as any)
        .select("group_id")
        .eq("user_id", user!.id);
      if (!memberships || memberships.length === 0) return [];
      const groupIds = memberships.map((m: any) => m.group_id);
      const { data: groups } = await (supabase
        .from("chat_groups" as any)
        .select("*") as any)
        .in("id", groupIds)
        .order("updated_at", { ascending: false });
      return (groups ?? []) as ChatGroup[];
    },
  });
}

export function useGroupMessages(groupId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_group_messages",
        filter: `group_id=eq.${groupId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["group-messages", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, qc]);

  return useQuery({
    queryKey: ["group-messages", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMessage[]> => {
      const { data, error } = await (supabase
        .from("chat_group_messages" as any)
        .select("*") as any)
        .eq("group_id", groupId)
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
    refetchInterval: 8000,
  });
}

export function useSendGroupMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inflightRef = useRef(false);

  return useMutation({
    mutationFn: async ({ groupId, content, mediaUrl, mediaType, metadata }: {
      groupId: string;
      content: string;
      mediaUrl?: string;
      mediaType?: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        const { error } = await supabase
          .from("chat_group_messages" as any)
          .insert({
            group_id: groupId,
            user_id: user.id,
            content,
            media_url: mediaUrl || null,
            media_type: mediaType || "text",
            metadata: metadata || {},
          } as any);
        if (error) throw error;
      } finally {
        inflightRef.current = false;
      }
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
  });
}

export function useCreateGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: group, error } = await supabase
        .from("chat_groups" as any)
        .insert({ name, created_by: user.id } as any)
        .select("id")
        .single();
      if (error) throw error;
      const groupId = (group as any).id;

      const allMembers = [user.id, ...memberIds.filter(id => id !== user.id)];
      const memberRows = allMembers.map(uid => ({
        group_id: groupId,
        user_id: uid,
        role: uid === user.id ? "admin" : "member",
      }));
      await supabase.from("chat_group_members" as any).insert(memberRows as any);
      return groupId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
}
