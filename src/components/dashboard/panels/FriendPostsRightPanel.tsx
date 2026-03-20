import { useState } from "react";
import { Heart, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import type { FriendUser } from "../FriendProfileView";

interface Props {
  friend: FriendUser;
}

export function FriendPostsRightPanel({ friend }: Props) {
  const { profile } = useAuth();
  const [comment, setComment] = useState("");
  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();
  const friendName = friend.display_name || friend.username || "Unnamed";

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Comments</span>
      </div>

      {/* Comments area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-8">
          <MessageSquare className="w-8 h-8 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm text-white mb-1">No comments yet</p>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            Select a post from {friendName}'s feed to see and add comments.
          </p>
        </div>
      </div>

      {/* Comment input */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-white/60">{initials}</span>
            )}
          </div>
          <div
            className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
            />
            <button
              disabled={!comment.trim()}
              className="p-1 rounded"
              style={{ color: comment.trim() ? "#E67E22" : "rgba(255,255,255,0.2)" }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="p-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
