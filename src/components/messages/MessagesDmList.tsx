import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversationList } from "@/hooks/useDirectMessages";
import { useUnreadDmPerPartner } from "@/hooks/useUnreadMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Search, Loader2, Plus } from "lucide-react";

interface Props {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  onOpenCreateMenu?: () => void;
}

export function MessagesDmList({ selectedUserId, onSelectUser, onOpenCreateMenu }: Props) {
  const [search, setSearch] = useState("");
  const { data: conversations = [], isLoading: loadingDms } = useConversationList();
  const { data: unreadMap } = useUnreadDmPerPartner();

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

  const filteredConversations = search.trim()
    ? conversations.filter((c) => {
        const p = profileMap.get(c.partnerId);
        const name = (p?.display_name || p?.username || "").toLowerCase();
        return name.includes(lowerSearch);
      })
    : conversations;

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
        {loadingDms ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No conversations yet</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              Start messaging someone or search for influencers
            </p>
          </div>
        ) : (
          <>
            {/* DMs */}
            {filteredConversations.map((conv) => {
              const profile = profileMap.get(conv.partnerId);
              const name = profile?.display_name || profile?.username || "User";
              const initials = name.slice(0, 2).toUpperCase();
              const resolved = profile ? resolveAvatarUrl(profile) : null;
              const preview = conv.lastMessage.content;
              const date = new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              });
              const unreadCount = unreadMap?.get(conv.partnerId) || 0;

              return (
                <button
                  key={conv.partnerId}
                  onClick={() => onSelectUser(conv.partnerId)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                  style={selectedUserId === conv.partnerId ? { background: "rgba(255,255,255,0.08)" } : {}}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                    {resolved ? (
                      <img src={resolved} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{name}</span>
                      <span className="ml-auto text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs truncate flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {preview}
                      </p>
                      {unreadCount > 0 && (
                        <span
                          className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 shrink-0"
                          style={{ background: "#ef4444" }}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
