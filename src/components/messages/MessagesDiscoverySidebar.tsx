import { Search, Command } from "lucide-react";
import type { PopularUser } from "@/pages/dashboard/MessagesPage";

interface Props {
  users: PopularUser[];
  onUserClick: (user: PopularUser) => void;
}

export function MessagesDiscoverySidebar({ users, onUserClick }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.3)" }}>Search</span>
          <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      {/* Recent chats */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Recent chats</span>
          <button className="text-xs font-medium" style={{ color: "rgba(96,165,250,0.9)" }}>See all</button>
        </div>
        <div className="flex items-center gap-3 py-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.9)" }}
          >
            U
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate">
              <span className="font-medium">User</span>{" "}
              <span style={{ color: "rgba(255,255,255,0.4)" }}>in</span>{" "}
              <span className="font-medium">Chat</span>
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>No messages yet</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Popular users */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Popular users</span>
          <button className="text-xs font-medium" style={{ color: "rgba(96,165,250,0.9)" }}>See all</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserClick(user)}
            className="w-full flex items-center gap-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              {user.online && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{
                    background: user.onlineColor === "yellow" ? "#facc15" : "#22c55e",
                    borderColor: "#1f262b",
                  }}
                />
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{user.descriptor}</p>
            </div>
            {/* Follow button */}
            <span
              className="px-3 py-1 rounded-md text-xs font-semibold shrink-0"
              style={{ background: "#152A20", color: "#fff" }}
            >
              Follow
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
