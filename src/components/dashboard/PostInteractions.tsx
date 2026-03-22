import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, ThumbsUp, MessageSquare, ExternalLink, Loader2, X, ImagePlus, Video, Smile, Sparkles, Search, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePostComments, useCreateComment, uploadPostMedia, type Post } from "@/hooks/usePosts";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PostInteractionsProps {
  post: Post;
  toggleReaction: { mutate: (args: { postId: string; reactionType: "like" | "love"; isActive: boolean }) => void };
}

function useReactionUsers(postId: string, reactionType: "like" | "love", enabled: boolean) {
  return useQuery({
    queryKey: ["reaction-users", postId, reactionType],
    enabled,
    queryFn: async () => {
      const { data: reactions } = await supabase
        .from("post_reactions")
        .select("user_id")
        .eq("post_id", postId)
        .eq("reaction_type", reactionType);
      if (!reactions || reactions.length === 0) return [];
      const userIds = [...new Set(reactions.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .in("id", userIds);
      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        name: p.display_name || p.username || "Unknown",
        username: p.username,
        avatar: resolveAvatarUrl(p),
      }));
    },
  });
}

export function PostInteractions({ post, toggleReaction }: PostInteractionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [showLovers, setShowLovers] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentMediaFile, setCommentMediaFile] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
  const [uploadingComment, setUploadingComment] = useState(false);
  const commentImageRef = useRef<HTMLInputElement>(null);
  const commentVideoRef = useRef<HTMLInputElement>(null);

  // Optimistic local state for reactions
  const [optimisticLiked, setOptimisticLiked] = useState(!!post.user_liked);
  const [optimisticLoved, setOptimisticLoved] = useState(!!post.user_loved);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(post.like_count ?? 0);
  const [optimisticLoveCount, setOptimisticLoveCount] = useState(post.love_count ?? 0);
  const [optimisticCommentCount, setOptimisticCommentCount] = useState(post.comment_count ?? 0);

  // Sync with server data when post prop changes
  useEffect(() => {
    setOptimisticLiked(!!post.user_liked);
    setOptimisticLoved(!!post.user_loved);
    setOptimisticLikeCount(post.like_count ?? 0);
    setOptimisticLoveCount(post.love_count ?? 0);
    setOptimisticCommentCount(post.comment_count ?? 0);
  }, [post.user_liked, post.user_loved, post.like_count, post.love_count, post.comment_count]);

  const activePostId = showComments ? post.id : undefined;
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(activePostId);
  const createComment = useCreateComment();
  const { data: likers = [] } = useReactionUsers(post.id, "like", showLikers);
  const { data: lovers = [] } = useReactionUsers(post.id, "love", showLovers);

  // Realtime: subscribe to new comments when comments are open
  useRealtimeComments(activePostId);

  // Auth gate: redirect to login if not authenticated
  const requireAuth = useCallback(() => {
    if (!user) {
      navigate("/auth/login");
      return false;
    }
    return true;
  }, [user, navigate]);

  const handleLike = () => {
    if (!requireAuth()) return;
    const wasLiked = optimisticLiked;
    setOptimisticLiked(!wasLiked);
    setOptimisticLikeCount(prev => Math.max(0, wasLiked ? prev - 1 : prev + 1));
    toggleReaction.mutate({ postId: post.id, reactionType: "like", isActive: wasLiked });
  };

  const handleLove = () => {
    if (!requireAuth()) return;
    const wasLoved = optimisticLoved;
    setOptimisticLoved(!wasLoved);
    setOptimisticLoveCount(prev => Math.max(0, wasLoved ? prev - 1 : prev + 1));
    toggleReaction.mutate({ postId: post.id, reactionType: "love", isActive: wasLoved });
  };

  const handleCommentMedia = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setCommentMediaFile(file);
    setCommentMediaPreview(URL.createObjectURL(file));
  };

  const [submittingComment, setSubmittingComment] = useState(false);

  const handleComment = async () => {
    if (!requireAuth()) return;
    const trimmedText = commentText.trim();
    if (!trimmedText && !commentMediaFile) return;
    if (submittingComment) return; // prevent double submit
    setSubmittingComment(true);
    setUploadingComment(true);
    try {
      let content = trimmedText;
      if (commentMediaFile) {
        const url = await uploadPostMedia(user!.id, commentMediaFile);
        content = content ? `${content}\n${url}` : url;
      }
      if (!content) return;
      await createComment.mutateAsync({ postId: post.id, content });
      setCommentText("");
      if (commentMediaPreview) URL.revokeObjectURL(commentMediaPreview);
      setCommentMediaFile(null);
      setCommentMediaPreview(null);
    } catch { /* handled by mutation onError */ } finally {
      setUploadingComment(false);
      setSubmittingComment(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Like */}
        <div className="relative">
          <button
            onClick={handleLike}
            onMouseEnter={() => (optimisticLikeCount > 0) && setShowLikers(true)}
            onMouseLeave={() => setShowLikers(false)}
            className={`flex items-center gap-1.5 text-[11px] transition-colors min-h-[36px] px-1 ${optimisticLiked ? "font-semibold" : ""}`}
            style={{ color: optimisticLiked ? "#3b82f6" : "rgba(255,255,255,0.35)" }}
          >
            <ThumbsUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill={optimisticLiked ? "#3b82f6" : "none"} /> {optimisticLikeCount || ""}
          </button>
          {showLikers && likers.length > 0 && <ReactionPopover users={likers} />}
        </div>
        {/* Love */}
        <div className="relative">
          <button
            onClick={handleLove}
            onMouseEnter={() => (optimisticLoveCount > 0) && setShowLovers(true)}
            onMouseLeave={() => setShowLovers(false)}
            className={`flex items-center gap-1.5 text-[11px] transition-colors min-h-[36px] px-1 ${optimisticLoved ? "font-semibold" : ""}`}
            style={{ color: optimisticLoved ? "#ef4444" : "rgba(255,255,255,0.35)" }}
          >
            <Heart className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill={optimisticLoved ? "#ef4444" : "none"} /> {optimisticLoveCount || ""}
          </button>
          {showLovers && lovers.length > 0 && <ReactionPopover users={lovers} />}
        </div>
        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-[11px] min-h-[36px] px-1"
          style={{ color: showComments ? "#a78bfa" : "rgba(255,255,255,0.35)" }}
        >
          <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {optimisticCommentCount || ""}
        </button>
        {/* Share */}
        <div className="relative ml-auto">
          <button onClick={() => setShowShare(!showShare)} className="flex items-center gap-1.5 text-[11px] min-h-[36px] px-1" style={{ color: showShare ? "#a78bfa" : "rgba(255,255,255,0.35)" }} title="Share">
            <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          {showShare && <SharePanel postId={post.id} postContent={post.content} onClose={() => setShowShare(false)} />}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {commentsLoading ? (
            <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                    {c.author_avatar ? (
                      <img src={c.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        {(c.author_name || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-semibold text-foreground">{c.author_name}</span>
                      {c.author_username && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>@{c.author_username}</span>}
                    </div>
                    <CommentContent content={c.content} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground mb-2">No comments yet</p>
          )}
          {/* Rich comment composer */}
          <div>
            {commentMediaPreview && (
              <div className="relative w-14 h-14 rounded-md overflow-hidden mb-2">
                {commentMediaFile?.type.startsWith("video")
                  ? <video src={commentMediaPreview} className="w-14 h-14 object-cover" />
                  : <img src={commentMediaPreview} alt="" className="w-14 h-14 object-cover" />}
                <button onClick={() => { if (commentMediaPreview) URL.revokeObjectURL(commentMediaPreview); setCommentMediaFile(null); setCommentMediaPreview(null); }} className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 flex items-center justify-center">
                  <X className="w-2 h-2 text-foreground" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none px-2 py-2 rounded-md min-h-[36px]"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
            <div className="flex items-center gap-0.5 mt-1.5">
              <input ref={commentImageRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { handleCommentMedia(e.target.files); e.target.value = ""; }} />
              <button onClick={() => commentImageRef.current?.click()} className="p-1.5 rounded hover:bg-white/5 min-w-[32px] min-h-[32px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.35)" }} title="Image"><ImagePlus className="w-3.5 h-3.5" /></button>
              <input ref={commentVideoRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => { handleCommentMedia(e.target.files); e.target.value = ""; }} />
              <button onClick={() => commentVideoRef.current?.click()} className="p-1.5 rounded hover:bg-white/5 min-w-[32px] min-h-[32px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.35)" }} title="Video"><Video className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded hover:bg-white/5 min-w-[32px] min-h-[32px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.35)" }} title="Emoji"><Smile className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded hover:bg-white/5 min-w-[32px] min-h-[32px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.25)" }} title="AI"><Sparkles className="w-3.5 h-3.5" /></button>
              <div className="flex-1" />
              <button
                onClick={handleComment}
                disabled={(!commentText.trim() && !commentMediaFile) || createComment.isPending || uploadingComment}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-md min-h-[32px]"
                style={{ color: (commentText.trim() || commentMediaFile) ? "#a78bfa" : "rgba(255,255,255,0.2)" }}
              >
                {(createComment.isPending || uploadingComment) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders comment content, detecting embedded media URLs */
function CommentContent({ content }: { content: string }) {
  const urlRegex = /(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|mp4|webm))/gi;
  const parts = content.split(urlRegex);
  const urls = content.match(urlRegex) || [];
  const textOnly = content.replace(urlRegex, "").trim();

  return (
    <div>
      {textOnly && <p className="text-[11px] text-muted-foreground">{textOnly}</p>}
      {urls.map((url, i) => (
        url.match(/\.(mp4|webm)$/i)
          ? <video key={i} src={url} controls className="mt-1 rounded max-h-24 max-w-[180px]" />
          : <img key={i} src={url} alt="" className="mt-1 rounded max-h-24 max-w-[180px] object-cover" />
      ))}
    </div>
  );
}

/** Share panel — search users, send post to chat */
function SharePanel({ postId, postContent, onClose }: { postId: string; postContent: string; onClose: () => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const { data: users = [] } = useQuery({
    queryKey: ["share-search", user?.id, search],
    enabled: !!user,
    queryFn: async () => {
      // Get followed users first
      const { data: follows } = await supabase
        .from("follows" as any)
        .select("following_id")
        .eq("follower_id", user!.id);
      const followedIds = (follows ?? []).map((f: any) => f.following_id);
      
      let query = supabase.from("profiles").select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key");
      if (search.trim()) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      } else if (followedIds.length > 0) {
        query = query.in("id", followedIds);
      }
      query = query.neq("id", user!.id).limit(10);
      const { data } = await query;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.display_name || p.username || "Unknown",
        username: p.username,
        avatar: resolveAvatarUrl(p),
        isFollowed: followedIds.includes(p.id),
      }));
    },
  });

  const sendToUser = async (receiverId: string) => {
    if (!user) return;
    setSending(receiverId);
    try {
      const msg = `📎 Shared a post: "${postContent.slice(0, 80)}${postContent.length > 80 ? "…" : ""}"`;
      await supabase.from("direct_messages" as any).insert({ sender_id: user.id, receiver_id: receiverId, content: msg } as any);
      toast.success("Post shared!");
      onClose();
    } catch { toast.error("Failed to share"); } finally { setSending(null); }
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-2 z-50 rounded-lg p-3 w-[220px] shadow-xl"
      style={{ background: "#1a1f28", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <p className="text-[10px] font-semibold text-muted-foreground mb-2">Share with…</p>
      <div className="flex items-center gap-1.5 mb-2 rounded-md px-2 py-1" style={{ background: "rgba(255,255,255,0.05)" }}>
        <Search className="w-3 h-3 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people…"
          className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground outline-none"
          autoFocus
        />
      </div>
      <div className="max-h-[150px] overflow-y-auto space-y-1">
        {users.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No users found</p>}
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => sendToUser(u.id)}
            disabled={sending === u.id}
            className="flex items-center gap-2 w-full p-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              {u.avatar ? <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-muted-foreground">{u.name.slice(0, 2).toUpperCase()}</div>}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-medium text-foreground truncate">{u.name}</p>
              {u.username && <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>@{u.username}</p>}
            </div>
            {sending === u.id ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" /> : <Send className="w-3 h-3 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReactionPopover({ users }: { users: { id: string; name: string; username: string | null; avatar: string | null }[] }) {
  return (
    <div
      className="absolute bottom-full left-0 mb-1 z-50 rounded-lg p-2 min-w-[140px] max-w-[200px] shadow-xl"
      style={{ background: "#1a1f28", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {users.slice(0, 10).map((u) => (
        <div key={u.id} className="flex items-center gap-2 py-1">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
            {u.avatar ? (
              <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-muted-foreground">{u.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">{u.name}</p>
            {u.username && <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>@{u.username}</p>}
          </div>
        </div>
      ))}
      {users.length > 10 && <p className="text-[9px] text-muted-foreground mt-1">+{users.length - 10} more</p>}
    </div>
  );
}
