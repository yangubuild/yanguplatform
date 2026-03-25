import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface AgencyNotification {
  id: string;
  agency_id: string;
  recipient_user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export function useAgencyNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["agency-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_notifications" as any)
        .select("*")
        .eq("recipient_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as AgencyNotification[]) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("agency-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agency_notifications",
          filter: `recipient_user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["agency-notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

export function useUnreadAgencyCount() {
  const { data = [] } = useAgencyNotifications();
  return data.filter((n) => !n.is_read).length;
}

export function useMarkAgencyNotificationRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agency_notifications" as any)
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency-notifications", user?.id] });
    },
  });
}

export function useMarkAllAgencyNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("agency_notifications" as any)
        .update({ is_read: true })
        .eq("recipient_user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency-notifications", user?.id] });
    },
  });
}
