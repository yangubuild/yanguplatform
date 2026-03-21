import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversationList } from "@/hooks/useDirectMessages";
import { useMyGroups } from "@/hooks/useGroupChats";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Loader2, Users } from "lucide-react";
import chatIcon8 from "@/assets/chat_icon_8.png";

interface Props {
  onSelectDm?: (userId: string) => void;
  onSelectGroup?: (groupId: string) => void;
}

export function MessagesChatsTab({ onSelectDm, onSelectGroup }: Props) {
  const { data: conversations = [], isLoading: loadingDms } = useConversationList();
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
  const isLoading = loadingDms || loadingGroups;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
    );
  }

  if (conversations.length === 0 && groups.length === 0) {
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
        {/* Groups */}
        {groups.map((group) => (
          <button
            key={`group-${group.id}`}
            onClick={() => onSelectGroup?.(group.id)}
            className="w-full rounded-xl p-3 flex items-start gap-3 text-left"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{ background: "rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.9)" }}
            >
              {group.avatar_url ? (
                <img src={group.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{group.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {group.member_count ?? 0} member{(group.member_count ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(96,165,250,0.15)", color: "rgba(96,165,250,0.8)" }}>
              Group
            </span>
          </button>
        ))}

        {/* DMs */}
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
            <button
              key={conv.partnerId}
              onClick={() => onSelectDm?.(conv.partnerId)}
              className="w-full rounded-xl p-3 flex items-start gap-3 text-left"
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
