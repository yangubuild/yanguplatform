import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useProfileReviews, useSubmitProfileReview } from "@/hooks/useProfileReviews";
import type { FriendUser } from "../FriendProfileView";

interface Props {
  friend: FriendUser;
}

export function FriendReviewsRightPanel({ friend }: Props) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const friendName = friend.display_name || friend.username || "Unnamed";
  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const reviewerName = profile?.display_name || profile?.username || "You";

  const { data, isLoading } = useProfileReviews(friend.id);
  const submitReview = useSubmitProfileReview();

  const avgRating = data?.avgRating ?? 0;
  const totalCount = data?.totalCount ?? 0;

  const handleSubmit = () => {
    if (rating === 0) return;
    submitReview.mutate(
      { targetUserId: friend.id, rating, title, body: text },
      {
        onSuccess: () => {
          setRating(0);
          setTitle("");
          setText("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-semibold text-foreground">Review {friendName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Review summary */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold text-foreground mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  style={{
                    color: i < Math.round(avgRating) ? "#f59e0b" : "rgba(255,255,255,0.15)",
                    fill: i < Math.round(avgRating) ? "#f59e0b" : "transparent" }}
                />
              ))}
            </div>
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">
                {totalCount> 0 ? `${avgRating.toFixed(1)} (${totalCount} review${totalCount !== 1 ? "s" : ""})` : "No ratings yet"}
              </span>
            )}
          </div>
        </div>

        {/* Review form */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold text-foreground mb-2">Your Review</p>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="text-muted-foreground">{reviewerName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs text-foreground">{reviewerName}</span>
          </div>

          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 cursor-pointer"
                onClick={() => setRating(i + 1)}
                style={{
                  color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
                  fill: i < rating ? "#f59e0b" : "transparent" }}
              />
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none mb-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your review..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[60px] rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: rating> 0 ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
              color: rating> 0 ? "#fff" : "rgba(255,255,255,0.35)" }}>
            {submitReview.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
