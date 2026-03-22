import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useEffect, useRef } from "react";

export interface ChatGroup {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  last_message?: string | null;
  last_message_at?: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
  username?: string;
  avatar?: string | null;
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

/* ─── Invalidation helper ─── */
function invalidateGroupQueries(qc: ReturnType<typeof useQueryClient>, userId?: string) {
  qc.invalidateQueries({ queryKey: ["my-groups"] });
  if (userId) qc.invalidateQueries({ queryKey: ["my-groups", userId] });
}

/* ─── My groups (with latest message preview) ─── */
export function useMyGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-groups", user?.id],
    enabled: !!user,
    staleTime: 5000,
    refetchOnMount: false,
    queryFn: async (): Promise<ChatGroup[]> => {
      const { data: memberships } = await supabase
        .from("chat_group_members")
        .select("group_id")
        .eq("user_id", user!.id);
      if (!memberships || memberships.length === 0) return [];
      const groupIds = memberships.map((m: any) => m.group_id);
      const { data: groups } = await (supabase
        .from("chat_groups")
        .select("*") as any)
        .in("id", groupIds)
        .order("updated_at", { ascending: false });

      // Fetch member counts + latest message per group in parallel
      const enriched: ChatGroup[] = [];
      for (const g of (groups ?? [])) {
        const [countRes, lastMsgRes] = await Promise.all([
          supabase
            .from("chat_group_members")
            .select("id", { count: "exact", head: true })
            .eq("group_id", g.id),
          (supabase
            .from("chat_group_messages")
            .select("content, created_at") as any)
            .eq("group_id", g.id)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);
        const lastMsg = lastMsgRes.data?.[0];
        enriched.push({
          ...g,
          member_count: countRes.count ?? 0,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? g.created_at,
        });
      }
      return enriched;
    },
    refetchInterval: 15000,
  });
}

/* ─── Group messages with realtime ─── */
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
    staleTime: 5000,
    refetchOnMount: false,
    queryFn: async (): Promise<GroupMessage[]> => {
      const { data, error } = await (supabase
        .from("chat_group_messages")
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

/* ─── Send group message (with inflight guard) ─── */
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
          .from("chat_group_messages")
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
      // Also update group list to show latest message preview
      qc.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
}

/* ─── Create group ─── */
export function useCreateGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, memberIds }: {
      name: string;
      description?: string;
      memberIds: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const groupId = crypto.randomUUID();
      const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id && id !== user.id)));

      const { error: groupError } = await supabase
        .from("chat_groups")
        .insert({ id: groupId, name, description: description || null, created_by: user.id } as any);
      if (groupError) {
        throw new Error(`Failed to create group record: ${groupError.message}`);
      }

      const rollbackGroup = async () => {
        await supabase.from("chat_group_members").delete().eq("group_id", groupId);
        await supabase.from("chat_groups").delete().eq("id", groupId).eq("created_by", user.id);
      };

      const { error: ownerError } = await supabase
        .from("chat_group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "owner",
        } as any);

      if (ownerError) {
        await rollbackGroup();
        throw new Error(`Failed to assign group owner: ${ownerError.message}`);
      }

      const memberRows = uniqueMemberIds.map((uid) => ({
        group_id: groupId,
        user_id: uid,
        role: "member",
      }));

      if (memberRows.length > 0) {
        const { error: membersError } = await supabase
          .from("chat_group_members")
          .insert(memberRows as any);
        if (membersError) {
          await rollbackGroup();
          throw new Error(`Failed to add selected members: ${membersError.message}`);
        }
      }

      return groupId;
    },
    onSuccess: () => {
      invalidateGroupQueries(qc, user?.id);
    },
  });
}

/* ─── Group members ─── */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
    staleTime: 10000,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await supabase
        .from("chat_group_members")
        .select("*")
        .eq("group_id", groupId!);
      if (error) throw error;
      const members = (data ?? []) as any[];
      if (members.length === 0) return [];

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

      return members.map(m => {
        const prof = profileMap[m.user_id];
        return {
          ...m,
          display_name: prof?.display_name || prof?.username || "Unknown",
          username: prof?.username,
          avatar: prof ? resolveAvatarUrl(prof) : null,
        };
      });
    },
  });
}

/* ─── Leave group ─── */
export function useLeaveGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("chat_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroupQueries(qc, user?.id);
    },
  });
}

/* ─── Add member (admin/owner only — enforced by RLS) ─── */
export function useAddGroupMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      // Prevent duplicate — check first
      const { data: existing } = await supabase
        .from("chat_group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) return; // already a member

      const { error } = await supabase
        .from("chat_group_members")
        .insert({ group_id: groupId, user_id: userId, role: "member" } as any);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
}

/* ─── Remove member (admin/owner only — enforced by RLS) ─── */
export function useRemoveGroupMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from("chat_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
}

/* ─── Update group info (admin/owner) ─── */
export function useUpdateGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, name, description }: {
      groupId: string;
      name?: string;
      description?: string;
    }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      const { error } = await supabase
        .from("chat_groups")
        .update(updates)
        .eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroupQueries(qc, user?.id);
    },
  });
}
