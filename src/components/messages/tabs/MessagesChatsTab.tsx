import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversationList } from "@/hooks/useDirectMessages";
import { useUnreadDmPerPartner } from "@/hooks/useUnreadMessages";
import { useUnreadGroupPerGroup } from "@/hooks/useGroupUnread";
import { useMyGroups } from "@/hooks/useGroupChats";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Loader2, Users, MessageCircle } from "lucide-react";
import chatIcon8 from "@/assets/chat_icon_8.png";

interface Props {
  onSelectDm?: (userId: string) => void;
  onSelectGroup?: (groupId: string) => void;
}

export function MessagesChatsTab({ onSelectDm, onSelectGroup }: Props) {
  const { data: conversations = [], isLoading: loadingDms } = useConversationList();
  const { data: unreadMap } = useUnreadDmPerPartner();
  const { data: unreadGroupMap } = useUnreadGroupPerGroup();
  const { data: groups = [], isLoading: loadingGroups } = useMyGroups();
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

  const threads = useMemo(() => {
    const list: any[] = [];

    for (const conv of conversations) {
      const profile = profileMap.get(conv.partnerId);
      const name = profile?.display_name || profile?.username || "User";
      const resolved = profile ? resolveAvatarUrl(profile) : null;
      list.push({
        type: "dm",
        id: conv.partnerId,
        name,
        avatar: resolved,
        initials: name.slice(0, 2).toUpperCase(),
        preview: conv.lastMessage.content,
        date: new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
        timestamp: new Date(conv.lastMessage.created_at).getTime(),
        unreadCount: unreadMap?.get(conv.partnerId) || 0,
      });
    }

    for (const g of groups) {
      const ts = g.last_message_at ? new Date(g.last_message_at).getTime() : new Date(g.created_at).getTime();
      list.push({
        type: "group",
        id: g.id,
        name: g.name,
        avatar: g.avatar_url,
        initials: g.name.slice(0, 2).toUpperCase(),
        preview: g.last_message || "No messages yet",
        date: new Date(ts).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
        timestamp: ts,
        memberCount: g.member_count ?? 0,
        unreadCount: unreadGroupMap?.get(g.id) || 0,
      });
    }

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [conversations, groups, profileMap, unreadMap, unreadGroupMap]);

  if (loadingDms || loadingGroups) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full">
        <div className="rounded-2xl p-8 text-center max-w-xs" style={{ background: "rgba(255,255,255,0.03)" }}>
          <img src={chatIcon8} alt="No messages" className="w-20 h-20 mx-auto mb-3 object-contain" style={{ opacity: 0.9 }} />
          <p className="text-sm font-medium text-foreground">No conversations yet</p>
          <p className="text-xs mt-1.5 text-muted-foreground">
            Start a conversation or create a group chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-1">
        {threads.map((thread) => (
          <button
            key={`${thread.type}-${thread.id}`}
            onClick={() => {
              if (thread.type === "dm") onSelectDm?.(thread.id);
              else onSelectGroup?.(thread.id);
            }}
            className="w-full rounded-xl p-3 flex items-center gap-3 text-left min-h-[56px] transition-colors hover:bg-white/[0.04]"
            style={{ background: "transparent" }}
          >
            {/* Avatar — consistent 40px */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{
                background: thread.type === "group" ? "rgba(168,85,247,0.2)" : "rgba(96,165,250,0.2)",
                color: thread.type === "group" ? "rgba(168,85,247,0.9)" : "rgba(96,165,250,0.9)" }}
            >
              {thread.avatar ? (
                <img src={thread.avatar} alt="" className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : thread.type === "group" ? (
                <Users className="w-4 h-4" />
              ) : (
                thread.initials
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground truncate">{thread.name}</p>
                {thread.type === "group" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(168,85,247,0.15)", color: "rgba(168,85,247,0.8)" }}>
                    Group
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5 truncate text-muted-foreground">
                {thread.preview.length > 50 ? thread.preview.slice(0, 50) + "…" : thread.preview}
              </p>
            </div>
            {/* Meta */}
            <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
              <span className="text-[11px] text-muted-foreground">
                {thread.date}
              </span>
              {thread.unreadCount > 0 && (
                <span
                  className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground px-1.5"
                  style={{ background: thread.type === "group" ? "#a855f7" : "#ef4444" }}
                >
                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
