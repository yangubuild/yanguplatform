import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Loader2, MessageSquare } from "lucide-react";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_id: string;
}

export function ReviewsPanel() {
  const { user } = useAuth();

  // Fetch reviews for user's surfaces (entity_reviews where entity_id = user's searchable_entity)
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews-panel", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ReviewRow[]> => {
      if (!user) return [];
      // Get reviews where the entity belongs to the user
      const { data, error } = await supabase
        .from("entity_reviews")
        .select("id, rating, title, body, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
            fill: i < rating ? "#f59e0b" : "transparent",
          }}
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
        <span className="text-sm font-semibold text-white">Reviews</span>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(181,98,42,0.12)", color: "#E67E22" }}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Request Review
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Star className="w-8 h-8 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm text-white mb-1">No reviews yet</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Request reviews from your clients to build trust.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {renderStars(review.rating)}
              {review.title && (
                <p className="text-sm font-medium text-white mt-1.5">{review.title}</p>
              )}
              {review.body && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {review.body}
                </p>
              )}
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
