import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

/**
 * Canonical unread DM count — counts messages where receiver_id = current user AND read_at IS NULL.
 * Updates via realtime subscription.
 */
export function useUnreadDmCount() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-dm-counter")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "direct_messages",
      }, (payload: any) => {
        if (payload.new?.receiver_id === user.id || payload.old?.receiver_id === user.id) {
          qc.invalidateQueries({ queryKey: ["unread-dm-count", user.id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["unread-dm-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user!.id)
        .is("read_at", null);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });
}

/**
 * Per-partner unread count for DM list badges.
 */
export function useUnreadDmPerPartner() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("unread-dm-per-partner")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "direct_messages",
      }, (payload: any) => {
        if (payload.new?.receiver_id === user.id || payload.old?.receiver_id === user.id) {
          qc.invalidateQueries({ queryKey: ["unread-dm-per-partner", user.id] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc, user]);

  return useQuery({
    queryKey: ["unread-dm-per-partner", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("receiver_id", user!.id)
        .is("read_at", null);
      if (error || !data) return new Map<string, number>();
      const counts = new Map<string, number>();
      for (const msg of data) {
        counts.set(msg.sender_id, (counts.get(msg.sender_id) || 0) + 1);
      }
      return counts;
    },
    refetchInterval: 30000,
  });
}

/**
 * Mark all DMs from a specific sender as read.
 */
export function useMarkDmsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return async (senderId: string) => {
    if (!user) return;
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("receiver_id", user.id)
      .eq("sender_id", senderId)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["unread-dm-count", user.id] });
    qc.invalidateQueries({ queryKey: ["unread-dm-per-partner", user.id] });
    qc.invalidateQueries({ queryKey: ["conversation-list", user.id] });
  };
}
