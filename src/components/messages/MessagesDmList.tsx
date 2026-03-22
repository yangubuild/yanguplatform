import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversationList } from "@/hooks/useDirectMessages";
import { useUnreadDmPerPartner } from "@/hooks/useUnreadMessages";
import { useUnreadGroupPerGroup } from "@/hooks/useGroupUnread";
import { useMyGroups, type ChatGroup } from "@/hooks/useGroupChats";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Search, Loader2, Plus, Users, MessageCircle } from "lucide-react";

interface Props {
  selectedUserId: string | null;
  selectedGroupId?: string | null;
  onSelectUser: (userId: string) => void;
  onSelectGroup?: (groupId: string) => void;
  onOpenCreateMenu?: () => void;
}

type UnifiedThread = {
  type: "dm" | "group";
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  preview: string;
  date: string;
  timestamp: number;
  unreadCount: number;
  memberCount?: number;
};

export function MessagesDmList({ selectedUserId, selectedGroupId, onSelectUser, onSelectGroup, onOpenCreateMenu }: Props) {
  const [search, setSearch] = useState("");
  const { data: conversations = [], isLoading: loadingDms } = useConversationList();
  const { data: unreadMap } = useUnreadDmPerPartner();
  const { data: unreadGroupMap } = useUnreadGroupPerGroup();
  const { data: groups = [], isLoading: loadingGroups } = useMyGroups();

  const partnerIds = conversations.map((c) => c.partnerId);

  const { data: profiles = [] } = useQuery({
    queryKey: ["dm-partner-profiles", partnerIds.join(",")],
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
  const lowerSearch = search.toLowerCase();

  const threads = useMemo(() => {
    const list: UnifiedThread[] = [];

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
        unreadCount: unreadGroupMap?.get(g.id) || 0,
        memberCount: g.member_count ?? 0,
      });
    }

    list.sort((a, b) => b.timestamp - a.timestamp);

    if (search.trim()) {
      return list.filter(t => t.name.toLowerCase().includes(lowerSearch));
    }
    return list;
  }, [conversations, groups, profileMap, unreadMap, unreadGroupMap, search, lowerSearch]);

  const isLoading = loadingDms || loadingGroups;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent text-sm flex-1 outline-none min-w-0 text-muted-foreground"
          />
        </div>
        <button
          onClick={onOpenCreateMenu}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.06)", }}
          aria-label="Create chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground">
              Start messaging or create a group
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const isSelected = thread.type === "dm"
              ? selectedUserId === thread.id
              : selectedGroupId === thread.id;

            return (
              <button
                key={`${thread.type}-${thread.id}`}
                onClick={() => {
                  if (thread.type === "dm") onSelectUser(thread.id);
                  else onSelectGroup?.(thread.id);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors min-h-[60px]"
                style={isSelected ? { background: "rgba(255,255,255,0.08)" } : {}}
              >
                {/* Avatar — consistent 40px */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden"
                  style={{
                    background: thread.type === "group" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.1)",
                    color: thread.type === "group" ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.6)",
                  }}
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
                    <span className="text-sm font-medium text-foreground truncate">{thread.name}</span>
                    {thread.type === "group" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(168,85,247,0.15)", color: "rgba(168,85,247,0.8)" }}>
                        Group
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5 text-muted-foreground">
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
                  {thread.type === "group" && thread.unreadCount === 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {thread.memberCount}👤
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
