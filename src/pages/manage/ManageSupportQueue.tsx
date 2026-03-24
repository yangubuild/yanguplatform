import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, Clock, User, CheckCircle2, XCircle, Headset } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type TicketStatus = "pending" | "agent_required" | "in_progress" | "resolved" | "closed";

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  agent_required: { label: "Agent Required", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Headset },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: MessageSquare },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  pending: ["agent_required", "in_progress", "closed"],
  agent_required: ["in_progress", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export default function ManageSupportQueue() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets", filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const { data: ticketMessages = [] } = useQuery({
    queryKey: ["admin-ticket-messages", selectedTicket],
    enabled: !!selectedTicket,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicket!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: selectedTicket ? 6000 : false,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Ticket updated");
    },
    onError: () => toast.error("Failed to update ticket"),
  });

  const [replyText, setReplyText] = useState("");
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !replyText.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket,
        sender_type: "agent",
        sender_id: user?.id,
        content: replyText,
      });
      if (error) throw error;
      // Auto-transition: first agent reply moves ticket to in_progress
      const ticket = tickets.find(t => t.id === selectedTicket);
      if (ticket?.status === "agent_required" || ticket?.status === "pending") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("id", selectedTicket);
      }
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", selectedTicket] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Reply sent");
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);
  const currentStatus = (selectedTicketData?.status || "pending") as TicketStatus;
  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Support Queue</h1>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">
            Review and respond to user support tickets
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="agent_required">Agent Required</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            tickets.map((ticket: any) => {
              const status = ticket.status as TicketStatus;
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const hoursAge = ticket.hours_since_created ?? ((Date.now() - new Date(ticket.created_at).getTime()) / 3600000);
              const slaBreach = ticket.sla_breached ?? (["pending", "agent_required"].includes(status) && hoursAge > 24);
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`w-full text-left rounded-xl p-4 border transition-colors ${
                    selectedTicket === ticket.id
                      ? "border-accent bg-accent/5"
                      : slaBreach
                      ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{ticket.subject}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {slaBreach && (
                        <Badge variant="destructive" className="text-[9px]">SLA BREACHED</Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.username ? `@${ticket.username}` : ticket.email ?? ticket.user_id?.slice(0, 8) + "..."}
                    </span>
                    <span>{format(new Date(ticket.created_at), "MMM d, HH:mm")}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {hoursAge < 1 ? "<1h" : `${Math.floor(hoursAge)}h`}
                    </span>
                    <Badge variant="outline" className="text-[9px]">{ticket.category}</Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Ticket detail / conversation */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          {!selectedTicket ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select a ticket to view details</p>
            </div>
          ) : (
            <div className="flex flex-col h-[600px]">
              {/* Ticket header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedTicketData?.subject}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedTicketData && format(new Date(selectedTicketData.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <Select
                  value={currentStatus}
                  onValueChange={(v) => updateStatus.mutate({ id: selectedTicket, status: v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Always show current status */}
                    <SelectItem value={currentStatus} disabled>
                      {STATUS_CONFIG[currentStatus]?.label} (current)
                    </SelectItem>
                    {allowedNextStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticketMessages.map((msg: any) => {
                  // System messages
                  if (msg.sender_type === "ai" && msg.content.startsWith("⚡")) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id}
                      className={`flex gap-2 ${msg.sender_type === "agent" ? "justify-end" : "justify-start"}`}>
                      {msg.sender_type !== "agent" && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          msg.sender_type === "ai" ? "bg-accent/10" : "bg-muted"
                        }`}>
                          {msg.sender_type === "ai" ? (
                            <MessageSquare className="h-3 w-3 text-accent" />
                          ) : (
                            <User className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender_type === "agent"
                          ? "bg-accent text-accent-foreground"
                          : msg.sender_type === "ai"
                          ? "bg-accent/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <span className="text-[10px] font-semibold block mb-1 opacity-70">
                          {msg.sender_type === "ai" ? "AI Assistant" : msg.sender_type === "agent" ? "Support Agent" : "User"}
                        </span>
                        {msg.content}
                      </div>
                      {msg.sender_type === "agent" && (
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Headset className="h-3 w-3 text-accent" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply input — disabled for closed tickets */}
              <div className="p-3 border-t border-border flex gap-2">
                {currentStatus === "closed" ? (
                  <p className="text-xs text-muted-foreground py-2 w-full text-center">This ticket is closed.</p>
                ) : (
                  <>
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply.mutate()}
                      placeholder="Type a reply as agent..."
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors"
                    />
                    <Button size="sm" disabled={!replyText.trim() || sendReply.isPending}
                      onClick={() => sendReply.mutate()}>
                      Send
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
