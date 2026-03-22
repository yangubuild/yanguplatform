import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect } from "react";

/**
 * Returns a Map<groupId, unreadCount> for all groups the user is in.
 */
export function useUnreadGroupPerGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Listen for new group messages to invalidate
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-group-counter")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_group_messages",
      }, () => {
        qc.invalidateQueries({ queryKey: ["unread-group-per-group", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["unread-group-per-group", user?.id],
    enabled: !!user,
    staleTime: 5000,
    refetchOnMount: false,
    refetchInterval: 30000,
    queryFn: async () => {
      // Get user's group memberships
      const { data: memberships } = await supabase
        .from("chat_group_members")
        .select("group_id")
        .eq("user_id", user!.id);
      if (!memberships || memberships.length === 0) return new Map<string, number>();

      const groupIds = memberships.map(m => m.group_id);

      // Get read cursors
      const { data: cursors } = await supabase
        .from("chat_group_read_cursors" as any)
        .select("group_id, last_read_at")
        .eq("user_id", user!.id)
        .in("group_id", groupIds);

      const cursorMap = new Map<string, string>();
      for (const c of (cursors ?? []) as any[]) {
        cursorMap.set(c.group_id, c.last_read_at);
      }

      // Count unread messages per group
      const counts = new Map<string, number>();
      await Promise.all(groupIds.map(async (gid) => {
        const lastRead = cursorMap.get(gid);
        let query = supabase
          .from("chat_group_messages")
          .select("id", { count: "exact", head: true })
          .eq("group_id", gid)
          .neq("user_id", user!.id);
        if (lastRead) {
          query = query.gt("created_at", lastRead);
        }
        const { count } = await query;
        if (count && count> 0) counts.set(gid, count);
      }));

      return counts;
    },
  });
}

/**
 * Mark a group as read by upserting the read cursor.
 */
export function useMarkGroupRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useCallback(async (groupId: string) => {
    if (!user) return;
    const now = new Date().toISOString();

    // Try upsert via insert with onConflict
    const { error } = await supabase
      .from("chat_group_read_cursors" as any)
      .upsert(
        { group_id: groupId, user_id: user.id, last_read_at: now } as any,
        { onConflict: "group_id,user_id" }
      );
    if (error) {
      console.error("Failed to mark group read:", error);
    }
    qc.invalidateQueries({ queryKey: ["unread-group-per-group", user.id] });
  }, [user?.id, qc]);
}
