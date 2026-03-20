import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  business_name: string | null;
}

export function FriendsPanel() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["friends-panel-users"],
    queryFn: async (): Promise<UserRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, business_name")
        .eq("account_status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Friends</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            No users found
          </p>
        ) : (
          filtered.map((user) => {
            const initials = (user.display_name || user.username || "U").slice(0, 2).toUpperCase();
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.display_name || user.username || "Unnamed"}
                  </p>
                  {user.business_name && (
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {user.business_name}
                    </p>
                  )}
                </div>
                <span
                  className="px-3 py-1 rounded-md text-xs font-semibold shrink-0"
                  style={{ background: "#22c55e", color: "#fff" }}
                >
                  Follow
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
