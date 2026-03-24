import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  hours_since_created: number;
  messages: SupportMessage[];
}

export function useManageSupportTickets() {
  return useQuery({
    queryKey: ["manage", "support-tickets-full"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_support_tickets_full");
      if (error) throw error;
      return (data as unknown as SupportTicket[]) ?? [];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });
}

export function useSupportReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const { error } = await supabase.rpc("manage_support_reply", {
        p_ticket_id: ticketId,
        p_content: content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "support-tickets-full"] });
      toast.success("Reply sent");
    },
    onError: (e) => toast.error("Failed to send reply: " + e.message),
  });
}

export function useSupportUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase.rpc("manage_support_update_status", {
        p_ticket_id: ticketId,
        p_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "support-tickets-full"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}
