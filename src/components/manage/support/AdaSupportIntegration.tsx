import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, User, ArrowUpRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AdaConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messageCount?: number;
}

export function AdaSupportIntegration({ ticketUserId }: { ticketUserId?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["ada-chats-support", ticketUserId],
    enabled: !!ticketUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ada_chats")
        .select("*")
        .eq("user_id", ticketUserId!)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as AdaConversation[];
    },
    staleTime: 15_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ada-messages-support", expanded],
    enabled: !!expanded,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ada_messages")
        .select("*")
        .eq("chat_id", expanded!)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!ticketUserId) {
    return (
      <AdminGlassCard>
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">ADA AI History</h3>
        </div>
        <p className="text-xs text-muted-foreground">Select a ticket to view the user's ADA conversation history</p>
      </AdminGlassCard>
    );
  }

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">ADA Conversation History</h3>
          <Badge variant="outline" className="text-[10px]">{chats.length} chats</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : chats.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No ADA conversations found for this user</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {chats.map(chat => (
            <div key={chat.id}>
              <button
                onClick={() => setExpanded(expanded === chat.id ? null : chat.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  expanded === chat.id
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground line-clamp-1">
                    {chat.title || "Untitled conversation"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(chat.updated_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </button>

              {expanded === chat.id && messages.length > 0 && (
                <div className="mt-1 ml-3 border-l-2 border-accent/20 pl-3 space-y-2 py-2">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className="flex gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "assistant" ? "bg-accent/10" : "bg-muted"
                      }`}>
                        {msg.role === "assistant"
                          ? <Bot className="h-2.5 w-2.5 text-accent" />
                          : <User className="h-2.5 w-2.5 text-muted-foreground" />
                        }
                      </div>
                      <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminGlassCard>
  );
}
