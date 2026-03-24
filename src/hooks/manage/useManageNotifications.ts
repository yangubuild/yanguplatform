import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailNotification {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function useManageNotifications(status: string | null = null) {
  return useQuery({
    queryKey: ["manage", "notifications", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_notifications_list", {
        p_status: status,
        p_limit: 100,
      });
      if (error) throw error;
      return (data as unknown as EmailNotification[]) ?? [];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
