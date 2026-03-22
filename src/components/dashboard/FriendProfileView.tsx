import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageSquare,
  Heart,
  Send,
  ExternalLink,
  Loader2,
  Users,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { useUserPosts, useToggleReaction } from "@/hooks/usePosts";
import { useProfileReviews, useSubmitProfileReview } from "@/hooks/useProfileReviews";
import { useFollowCounts } from "@/hooks/useFollows";
import { FollowButton } from "./panels/FollowButton";

export interface FriendUser {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_mode?: string | null;
  avatar_emoji_key?: string | null;
  business_name: string | null;
  cover_url?: string | null;
}

const FRIEND_TABS = ["Home", "Reviews", "Posts", "About"] as const;
type FriendTab = (typeof FRIEND_TABS)[number];

interface FriendProfileViewProps {
  user: FriendUser;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

interface FriendSurface {
  id: string;
  title: string | null;
  surface_type: string;
  cover_image: string | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_name: string | null;
}

export function FriendProfileView({ user, onBack, onTabChange }: FriendProfileViewProps) {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<FriendTab>("Home");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [postComment, setPostComment] = useState("");

  const name = user.display_name || user.username || "Unnamed";
  const initials = name.slice(0, 2).toUpperCase();
  const resolvedAvatar = resolveAvatarUrl(user);
  const username = user.username;

  // Fetch friend's profile for about data
  const { data: friendProfile } = useQuery({
    queryKey: ["friend-profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Follow counts
  const { data: followCounts } = useFollowCounts(user.id);

  // Determine account type for Follow vs Join
  const accountType = (friendProfile as any)?.account_type as string | null;
  const isCommunityType = accountType === "community";

  // Fetch friend's published surfaces
  const { data: surfaces = [], isLoading: surfacesLoading } = useQuery({
    queryKey: ["friend-surfaces", user.id],
    queryFn: async (): Promise<FriendSurface[]> => {
      const { data: builderSurfaces, error } = await supabase
        .from("builder_surfaces")
        .select("id, title, surface_type, cover_image_url, metadata")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (!builderSurfaces?.length) return [];

      const surfaceIds = builderSurfaces.map((s) => s.id);
      const { data: publishes } = await supabase
        .from("builder_publishes")
        .select("surface_id")
        .in("surface_id", surfaceIds)
        .eq("state", "published");

      const publishedIds = new Set((publishes ?? []).map((p) => p.surface_id));
      return builderSurfaces
        .filter((s) => publishedIds.has(s.id))
        .map((s) => ({
          id: s.id,
          title: s.title,
          surface_type: s.surface_type,
          cover_image: (s as any).cover_image_url || null,
        }));
    },
  });

  // Fetch reviews about this user using shared hook
  const { data: reviewData, isLoading: reviewsLoading } = useProfileReviews(user.id);
  const reviews = reviewData?.reviews ?? [];
  const avgRating = reviewData?.avgRating ?? 0;

  // Fetch posts using shared hook
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(user.id);
  const toggleReaction = useToggleReaction();
  const submitReview = useSubmitProfileReview();

  const handleTabChange = (tab: FriendTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleSubmitReview = async () => {
    if (!currentUser || reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    submitReview.mutate(
      { targetUserId: user.id, rating: reviewRating, title: reviewText ? undefined : undefined, body: reviewText },
      { onSuccess: () => { setReviewRating(0); setReviewText(""); } }
    );
  };

  const aboutData = (friendProfile as any)?.social_links as any;
  const createdAt = friendProfile?.created_at
    ? new Date(friendProfile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const renderStars = (rating: number, interactive = false) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${interactive ? "cursor-pointer" : ""}`}
          onClick={interactive ? () => setReviewRating(i + 1) : undefined}
          style={{
            color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
            fill: i < rating ? "#f59e0b" : "transparent" }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Top bar with back */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="p-1 rounded-md hover:bg-white/5 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cover */}
        <div
          className="w-full h-[180px] relative overflow-hidden"
          style={{
            background: user.cover_url
              ? `url(${user.cover_url}) center/cover no-repeat`
              : "linear-gradient(135deg, #0d3a27 0%, #061a12 100%)" }}
        />

        {/* Profile header */}
        <div className="px-5 -mt-10 relative z-10">
          <div
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-xl font-bold overflow-hidden"
            style={{
              background: resolvedAvatar ? "transparent" : "#1e293b",
              border: "4px solid #0f141a" }}>
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Name + action button row */}
          <div className="flex items-start justify-between mt-3 gap-4">
            <div>
              <h2 className="text-[24px] leading-[1.15] font-bold text-foreground">{name}</h2>
              {username && (
                <p className="text-sm mt-0.5 text-muted-foreground">
                  @{username}
                </p>
              )}
              {user.business_name && (
                <p className="text-sm mt-1 text-muted-foreground">
                  {user.business_name}
                </p>
              )}
            </div>
            {/* Single visitor action button */}
            {isCommunityType ? (
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
                style={{ background: "#22c55e" }}>
                <Users className="w-3.5 h-3.5" /> Join
              </button>
            ) : (
              <FollowButton targetUserId={user.id} />
            )}
          </div>

          {/* Meta row */}
          <div
            className="flex items-center gap-2.5 mt-2.5 text-xs flex-wrap text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {(friendProfile as any)?.location || "Location"}
            </span>
            {createdAt && (
              <>
                <span className="text-muted-foreground">•</span>
                <span>Joined {createdAt}</span>
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span>{followCounts?.followers ?? 0} followers · {followCounts?.following ?? 0} following</span>
            <span className="text-muted-foreground">•</span>
            <span>{surfaces.length} surface{surfaces.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 mt-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-6">
            {FRIEND_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="relative pb-2.5 text-sm font-medium transition-colors"
                style={{ color: activeTab === tab ? "#E67E22" : "rgba(255,255,255,0.45)" }}>
                {tab}
                {activeTab === tab && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "#b5622a" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-5 py-4">
          {/* HOME TAB */}
          {activeTab === "Home" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">
                  Surfaces <span className="text-muted-foreground">{surfaces.length}</span>
                </span>
              </div>
              {surfacesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : surfaces.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-sm text-foreground mb-1">No published surfaces</p>
                  <p className="text-xs text-muted-foreground">
                    This user has no public offerings yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {surfaces.map((surface) => (
                    <a
                      key={surface.id}
                      href={`/s/${surface.id}/preview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-all"
                      style={{ background: "#1a2129", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {surface.cover_image ? (
                        <img src={surface.cover_image} alt={surface.title || ""} className="w-full h-24 object-cover" />
                      ) : (
                        <div
                          className="h-24 flex items-center justify-center text-3xl font-bold"
                          style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
                          {(surface.title || "S").charAt(0)}
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium text-foreground">{surface.title || "Untitled"}</p>
                        <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                          {surface.surface_type}
                          <ExternalLink className="w-3 h-3 ml-auto" style={{ color: "#22c55e" }} />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "Reviews" && (
            <div className="space-y-4">
              {/* Submit review form */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-semibold text-foreground mb-2">Leave a review</p>
                {renderStars(reviewRating, true)}
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review..."
                  className="w-full mt-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[60px] rounded-lg px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: reviewRating> 0 ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
                    color: reviewRating> 0 ? "#fff" : "rgba(255,255,255,0.35)" }}>
                  <Send className="w-3.5 h-3.5" /> Submit
                </button>
              </div>

              {/* Existing reviews */}
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Star className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-foreground mb-1">No reviews yet</p>
                  <p className="text-xs text-muted-foreground">
                    Be the first to review {name}.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                        {review.reviewer_avatar ? <img src={review.reviewer_avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-muted-foreground">{(review.reviewer_name||"U").slice(0,2).toUpperCase()}</div>}
                      </div>
                      <span className="text-[11px] font-medium text-foreground">{review.reviewer_name}</span>
                      {review.reviewer_username && <span className="text-[10px] text-muted-foreground">@{review.reviewer_username}</span>}
                    </div>
                    {renderStars(review.rating)}
                    {review.title && <p className="text-sm font-medium text-foreground mt-1.5">{review.title}</p>}
                    {review.body && <p className="text-xs mt-1 text-muted-foreground">{review.body}</p>}
                    <p className="text-[10px] mt-2 text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* POSTS TAB */}
          {activeTab === "Posts" && (
            <div className="space-y-3">
              {postsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground mb-1">{name}'s Posts</p>
                  <p className="text-xs text-muted-foreground">
                    No posts from this user yet.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                        {post.author_avatar ? <img src={post.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-muted-foreground">{(post.author_name||"U").slice(0,2).toUpperCase()}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{post.author_name}</p>
                        {post.author_username && <p className="text-[10px] text-muted-foreground">@{post.author_username}</p>}
                      </div>
                      <span className="text-[10px] shrink-0 text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{post.content}</p>
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleReaction.mutate({ postId: post.id, reactionType: "like", isActive: !!post.user_liked })} className="flex items-center gap-1 text-[11px]" style={{ color: post.user_liked ? "#3b82f6" : "rgba(255,255,255,0.35)" }}>
                        <ThumbsUp className="w-3.5 h-3.5" /> {post.like_count || ""}
                      </button>
                      <button onClick={() => toggleReaction.mutate({ postId: post.id, reactionType: "love", isActive: !!post.user_loved })} className="flex items-center gap-1 text-[11px]" style={{ color: post.user_loved ? "#ef4444" : "rgba(255,255,255,0.35)" }}>
                        <Heart className="w-3.5 h-3.5" /> {post.love_count || ""}
                      </button>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comment_count || ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "About" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Bio</p>
                <p className="text-sm text-muted-foreground">
                  {aboutData?.about_me || "No bio available."}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Business</p>
                <p className="text-sm text-muted-foreground">
                  {aboutData?.about_business || user.business_name || "No business info available."}
                </p>
              </div>
              {(friendProfile as any)?.location && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Location</p>
                  <p className="text-sm flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {(friendProfile as any).location}
                  </p>
                </div>
              )}
              {createdAt && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Joined</p>
                  <p className="text-sm text-muted-foreground">{createdAt}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
