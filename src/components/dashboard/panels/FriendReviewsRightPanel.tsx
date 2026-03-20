import { useState } from "react";
import { Star, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { toast } from "sonner";
import type { FriendUser } from "../FriendProfileView";

interface Props {
  friend: FriendUser;
}

export function FriendReviewsRightPanel({ friend }: Props) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const friendName = friend.display_name || friend.username || "Unnamed";
  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const reviewerName = profile?.display_name || profile?.username || "You";

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    toast.success("Review submitted");
    setRating(0);
    setText("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Review {friendName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Review summary */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs font-semibold text-white mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4" style={{ color: "rgba(255,255,255,0.15)", fill: "transparent" }} />
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>No ratings yet</span>
          </div>
        </div>

        {/* Review form */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs font-semibold text-white mb-2">Your Review</p>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="text-white/60">{reviewerName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs text-white">{reviewerName}</span>
          </div>

          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 cursor-pointer"
                onClick={() => setRating(i + 1)}
                style={{
                  color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
                  fill: i < rating ? "#f59e0b" : "transparent",
                }}
              />
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your review..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none min-h-[60px] rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: rating > 0 ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
              color: rating > 0 ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          >
            <Send className="w-3.5 h-3.5" /> Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
