import { useAuth } from "@/hooks/useAuth";
import { Star, Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { useProfileReviews } from "@/hooks/useProfileReviews";
import { useState } from "react";
import { toast } from "sonner";

export function ReviewsPanel() {
  const { user, profile } = useAuth();
  const { data, isLoading } = useProfileReviews(user?.id);
  const [copied, setCopied] = useState(false);

  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating ?? 0;
  const totalCount = data?.totalCount ?? 0;

  const handleRequestReview = () => {
    const username = profile?.username;
    if (!username) {
      toast.error("Set up your username first");
      return;
    }
    const link = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Profile link copied! Share it to receive reviews.");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Could not copy link"));
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
            fill: i < rating ? "#f59e0b" : "transparent" }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-foreground">Reviews</span>
        <button
          onClick={handleRequestReview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(181,98,42,0.12)", color: "#E67E22" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Request Review"}
        </button>
      </div>

      {/* Summary bar */}
      {totalCount > 0 && (
        <div className="px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            {renderStars(Math.round(avgRating))}
            <span className="text-xs text-muted-foreground">
              {avgRating.toFixed(1)} avg · {totalCount} review{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Star className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground mb-1">No reviews yet</p>
            <p className="text-xs text-center text-muted-foreground">
              Share your profile link to receive reviews from clients.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                  {review.reviewer_avatar ? (
                    <img src={review.reviewer_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {(review.reviewer_name || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-foreground">{review.reviewer_name}</span>
                {review.reviewer_username && (
                  <span className="text-[10px] text-muted-foreground">@{review.reviewer_username}</span>
                )}
              </div>
              {renderStars(review.rating)}
              {review.title && (
                <p className="text-sm font-medium text-foreground mt-1.5">{review.title}</p>
              )}
              {review.body && (
                <p className="text-xs mt-1 text-muted-foreground">
                  {review.body}
                </p>
              )}
              <p className="text-[10px] mt-2 text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
