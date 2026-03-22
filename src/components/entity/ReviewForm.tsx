import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface ReviewFormProps {
  entityId: string;
  onSuccess: () => void;
}

export function ReviewForm({ entityId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to write a review</p>
        <button onClick={() => navigate("/auth/login")} className="text-xs px-4 py-1.5 rounded-lg font-medium" style={{ background: "rgba(181,98,42,0.2)", color: "#b5622a" }}>
          Sign in
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("entity_reviews").insert({
      entity_id: entityId,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "You've already reviewed this", variant: "destructive" });
      } else {
        toast({ title: "Failed to submit review", variant: "destructive" });
      }
      return;
    }
    toast({ title: "Review submitted!" });
    queryClient.invalidateQueries({ queryKey: ["entity_reviews", entityId] });
    queryClient.invalidateQueries({ queryKey: ["entity_detail"] });
    onSuccess();
  };

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
          >
            <Star className={`w-5 h-5 transition-colors ${n <= (hoverRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="w-full bg-transparent text-foreground text-sm mb-2 px-3 py-2 rounded-lg focus:outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your review..."
        rows={3}
        className="w-full bg-transparent text-foreground text-sm mb-3 px-3 py-2 rounded-lg resize-none focus:outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      />
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting} className="text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-50" style={{ background: "linear-gradient(135deg, #c47a3a, #b5622a)", color: "#fff" }}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}
