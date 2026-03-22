import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfilePopup } from "./UserProfilePopup";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { FollowButton } from "./FollowButton";
import { useAuth } from "@/hooks/useAuth";

interface UserRow {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_mode: string | null;
  avatar_emoji_key: string | null;
  business_name: string | null;
  cover_url: string | null;
}

interface FriendsPanelProps {
  onViewProfile?: (user: UserRow) => void;
}

export function FriendsPanel({ onViewProfile }: FriendsPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["friends-panel-users"],
    queryFn: async (): Promise<UserRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name, cover_url")
        .eq("account_status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ["platform-user-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Always exclude the current user from the people list
  const excludeSelf = (list: UserRow[]) => list.filter((u) => u.id !== currentUser?.id);

  const filtered = search.trim()
    ? excludeSelf(users).filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : excludeSelf(users);

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      {/* Search - fixed top */}
      <div className="shrink-0">
        <div className="p-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <Search className="w-4 h-4" className="text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-0.5 text-[11px]" className="text-muted-foreground">
              <Command className="w-3 h-3" />K
            </div>
          </div>
        </div>

        {/* Affiliate promo card */}
        <div className="px-3 pb-2">
          <button
            onClick={() => navigate("/dashboard/affiliates")}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:opacity-90 transition-opacity"
            style={{ background: "rgba(181,98,42,0.1)", border: "1px solid rgba(181,98,42,0.15)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(181,98,42,0.2)" }}
            >
              <span className="text-sm">💰</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground">Affiliate dashboard</p>
              <p className="text-[11px]" className="text-muted-foreground">
                Earn by referring others
              </p>
            </div>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
              style={{ background: "rgba(181,98,42,0.3)", color: "#E67E22" }}
            >
              New
            </span>
          </button>
        </div>

        {/* People count + See all */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              People{" "}
              <span className="text-muted-foreground">
                {totalCount.toLocaleString()}
              </span>
            </span>
            <button
              className="text-xs font-medium"
              style={{ color: "#E67E22" }}
              onClick={() => {/* Already showing full list */}}
            >
              See all
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" className="text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs py-8" className="text-muted-foreground">
            No users found
          </p>
        ) : (
          filtered.map((user) => {
            const resolved = resolveAvatarUrl(user);
            const fallbackInitials = (user.display_name || user.username || "U").slice(0, 2).toUpperCase();
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)", }}
                >
                  {resolved ? (
                    <img src={resolved} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    fallbackInitials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.display_name || user.username || "Unnamed"}
                  </p>
                  {user.username && (
                    <p className="text-[11px] truncate" className="text-muted-foreground">
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

      {/* User popup */}
      {selectedUser && (
        <UserProfilePopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onViewProfile={onViewProfile ? () => {
            onViewProfile(selectedUser);
            setSelectedUser(null);
          } : undefined}
        />
      )}
    </div>
  );
}
