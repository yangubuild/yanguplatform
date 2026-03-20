import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversationList } from "@/hooks/useDirectMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Loader2, MessageSquare } from "lucide-react";
import chatIcon8 from "@/assets/chat_icon_8.png";

export function MessagesChatsTab() {
  const { data: conversations = [], isLoading } = useConversationList();
  const partnerIds = conversations.map((c) => c.partnerId);

  const { data: profiles = [] } = useQuery({
    queryKey: ["dm-partner-profiles-chats-tab", partnerIds.join(",")],
    enabled: partnerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name")
        .in("id", partnerIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full">
        <div className="rounded-2xl p-8 text-center max-w-xs" style={{ background: "rgba(255,255,255,0.03)" }}>
          <img src={chatIcon8} alt="No messages" className="w-20 h-20 mx-auto mb-3 object-contain" style={{ opacity: 0.9 }} />
          <p className="text-sm font-medium text-white">No conversations yet</p>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Start a conversation by messaging someone from their profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-1">
        {conversations.map((conv) => {
          const profile = profileMap.get(conv.partnerId);
          const name = profile?.display_name || profile?.username || "User";
          const initials = name.slice(0, 2).toUpperCase();
          const resolved = profile ? resolveAvatarUrl(profile) : null;
          const preview = conv.lastMessage.content;
          const date = new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, {
            month: "numeric",
            day: "numeric",
          });

          return (
            <div
              key={conv.partnerId}
              className="rounded-xl p-3 flex items-start gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                style={{ background: "rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.9)" }}
              >
                {resolved ? (
                  <img src={resolved} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{name}</p>
                <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {preview}
                </p>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                {date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
