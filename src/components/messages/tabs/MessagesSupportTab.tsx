import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield, Bell, Bot, FileText, ChevronRight } from "lucide-react";
import { SupportChatThread } from "../support/SupportChatThread";
import { SupportContactModal } from "../support/SupportContactModal";

/**
 * Support tab shows:
 * 1. A pinned "YANGU Support" AI chat thread entry
 * 2. A "Submit a Request" action
 * 3. System notifications below
 */
export function MessagesSupportTab() {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: systemNotifications = [], isLoading } = useQuery({
    queryKey: ["support-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .in("type", ["team_invite_sent", "team_invite_accepted", "system", "general"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  // If user opened the chat thread, show it full-screen
  if (showChat) {
    return <SupportChatThread onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pinned support thread + contact */}
      <div className="p-3 space-y-2">
        {/* AI Support Thread */}
        <button
          onClick={() => setShowChat(true)}
          className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-muted/50"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground">YANGU Support</p>
            <p className="text-xs text-muted-foreground">AI Assistant • Ask anything, 24/7</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Submit a Request */}
        <button
          onClick={() => setShowContactForm(true)}
          className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-muted/50"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground">Submit a Request</p>
            <p className="text-xs text-muted-foreground">Create a support ticket for our team</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Divider */}
      {systemNotifications.length > 0 && (
        <div className="px-4 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
        </div>
      )}

      {/* System notifications */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : systemNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Shield className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            System confirmations and platform notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="p-3 space-y-2 overflow-y-auto">
          {systemNotifications.map((notif: any) => (
            <div
              key={notif.id}
              className="rounded-xl p-4 flex items-start gap-3 bg-card border border-border">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-accent/10">
                <Bell className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                <p className="text-xs mt-1 text-muted-foreground">{notif.body}</p>
                <p className="text-[10px] mt-2 text-muted-foreground">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
              {!notif.is_read && (
                <span className="w-2 h-2 rounded-full shrink-0 mt-2 bg-accent" />
              )}
            </div>
          ))}
        </div>
      )}

      <SupportContactModal open={showContactForm} onOpenChange={setShowContactForm} />
    </div>
  );
}
