import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield, Bell } from "lucide-react";

/**
 * Support tab shows system notifications and YANGU platform messages.
 * Invite confirmations from the sender side appear here.
 */
export function MessagesSupportTab() {
  const { user } = useAuth();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (systemNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">YANGU Support</p>
        <p className="text-xs max-w-xs text-center text-muted-foreground">
          System confirmations and platform notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        {systemNotifications.map((notif: any) => (
          <div
            key={notif.id}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(74,222,128,0.15)" }}>
              <Bell className="w-4 h-4" style={{ color: "#4ade80" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{notif.title}</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {notif.body}
              </p>
              <p className="text-[10px] mt-2 text-muted-foreground">
                {new Date(notif.created_at).toLocaleString()}
              </p>
            </div>
            {!notif.is_read && (
              <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "#4ade80" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
