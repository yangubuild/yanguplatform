import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversationList } from "@/hooks/useDirectMessages";
import { useUnreadDmPerPartner } from "@/hooks/useUnreadMessages";
import { useUnreadGroupPerGroup } from "@/hooks/useGroupUnread";
import { useMyGroups, type ChatGroup } from "@/hooks/useGroupChats";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Search, Loader2, Plus, Users } from "lucide-react";

interface Props {
  selectedUserId: string | null;
  selectedGroupId?: string | null;
  onSelectUser: (userId: string) => void;
  onSelectGroup?: (groupId: string) => void;
  onOpenCreateMenu?: () => void;
}

type UnifiedThread = {
  type: "dm";
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  preview: string;
  date: string;
  timestamp: number;
  unreadCount: number;
} | {
  type: "group";
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  preview: string;
  date: string;
  timestamp: number;
  memberCount: number;
  unreadCount: number;
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

  // Build unified thread list sorted by latest activity
  const threads = useMemo(() => {
    const list: UnifiedThread[] = [];

    // DMs
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

    // Groups
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

    // Sort by latest activity
    list.sort((a, b) => b.timestamp - a.timestamp);

    // Filter by search
    if (search.trim()) {
      return list.filter(t => t.name.toLowerCase().includes(lowerSearch));
    }
    return list;
  }, [conversations, groups, profileMap, unreadMap, search, lowerSearch]);

  const isLoading = loadingDms || loadingGroups;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
        </div>
        <button
          onClick={onOpenCreateMenu}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
          aria-label="Create chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No conversations yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              Start messaging someone or create a group
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
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                style={isSelected ? { background: "rgba(255,255,255,0.08)" } : {}}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden relative"
                  style={{
                    background: thread.type === "group" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.1)",
                    color: thread.type === "group" ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {thread.avatar ? (
                    <img src={thread.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : thread.type === "group" ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    thread.initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">{thread.name}</span>
                    {thread.type === "group" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(168,85,247,0.15)", color: "rgba(168,85,247,0.8)" }}>
                        Group
                      </span>
                    )}
                    <span className="ml-auto text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {thread.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs truncate flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {thread.preview}
                    </p>
                    {thread.type === "dm" && thread.unreadCount > 0 && (
                      <span
                        className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 shrink-0"
                        style={{ background: "#ef4444" }}
                      >
                        {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                      </span>
                    )}
                    {thread.type === "group" && (
                      <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {thread.memberCount}👤
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
