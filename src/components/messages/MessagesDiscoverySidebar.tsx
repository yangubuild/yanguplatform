import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Command, Loader2 } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { FollowButton } from "@/components/dashboard/panels/FollowButton";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onUserClick: (userId: string) => void;
}

export function MessagesDiscoverySidebar({ onUserClick }: Props) {
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuth();

  // Use same real user source as FriendsPanel
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["friends-panel-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profile_view")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, cover_url")
        .eq("account_status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Always exclude current user from people list
  const excludeSelf = (list: typeof users) => list.filter((u) => u.id !== currentUser?.id);

  const filtered = search.trim()
    ? excludeSelf(users).filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : excludeSelf(users);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="text-sm flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">People</span>
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs py-8 text-muted-foreground">
            No users found
          </p>
        ) : (
          filtered.map((user) => {
            const resolved = resolveAvatarUrl(user);
            const name = user.display_name || user.username || "User";
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <button
                key={user.id}
                onClick={() => onUserClick(user.id)}
                className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  {resolved ? (
                    <img src={resolved} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  {user.username && (
                    <p className="text-xs truncate text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                </div>
                <FollowButton targetUserId={user.id} compact />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
