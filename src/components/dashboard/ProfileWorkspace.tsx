import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { useEmojiInput } from "@/hooks/useEmojiInput";
import { EmojiSuggestions } from "@/components/emoji/EmojiSuggestions";
import { EmojiRenderer } from "@/components/emoji/EmojiRenderer";
import { YanguEmojiPicker } from "@/components/emoji/YanguEmojiPicker";
import type { YanguEmoji } from "@/lib/emojiSystem";
import { useUserPosts, useCreatePost, useToggleReaction, uploadPostMedia, type Post } from "@/hooks/usePosts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";

import { useProfileReviews } from "@/hooks/useProfileReviews";
import { Heart, ThumbsUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Bell,
  Plus,
  Eye,
  Pencil,
  MapPin,
  Video,
  Camera,
  ImagePlus,
  Loader2,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Check,
  X,
  BadgeCheck,
  Star,
  MessageSquare,
  Sparkles,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import adaIcon from "@/assets/ada-icon.png";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { triggerEmojiPreload } from "@/hooks/useEmojiPreloader";
import AvatarPickerModal from "@/components/profile/AvatarPickerModal";
import CoverCropModal, { type CropData } from "@/components/profile/CoverCropModal";
import { useNavigate } from "react-router-dom";
import { AddTeamModal } from "./AddTeamModal";
import { VerifiedModal } from "./panels/VerifiedModal";
import { NotificationPrefsModal } from "./NotificationPrefsModal";
import { ShareBusinessPopover } from "./ShareBusinessPopover";
import { DashboardMoreMenu } from "./DashboardMoreMenu";
import { SocialLinksModal, SOCIAL_PLATFORMS, type SocialLinksData } from "./SocialLinksModal";
import { MobilePeopleSheet } from "./mobile/MobilePeopleSheet";
import { useIsMobile } from "@/hooks/use-mobile";

const TABS = ["Home", "KYC", "Reviews", "Posts", "About"] as const;

interface DashboardBusinessSurface {
  id: string;
  title: string | null;
  surface_type: string;
  cover_image: string | null;
}

function OwnReviewsTab() {
  const { user } = useAuth();
  const { data, isLoading } = useProfileReviews(user?.id);
  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating ?? 0;
  const totalCount = data?.totalCount ?? 0;
  if (isLoading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-4">
      {totalCount> 0 && (
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4" style={{ color: i < Math.round(avgRating) ? "#f59e0b" : "rgba(255,255,255,0.15)", fill: i < Math.round(avgRating) ? "#f59e0b" : "transparent" }} />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({totalCount} review{totalCount !== 1 ? "s" : ""})</span>
          </div>
        </div>
      )}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Star className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground mb-1">No reviews yet</p>
          <p className="text-xs text-muted-foreground">Reviews from clients will appear here.</p>
        </div>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                {r.reviewer_avatar ? <img src={r.reviewer_avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 flex items-center justify-center text-[9px] font-bold text-muted-foreground">{(r.reviewer_name||"U").slice(0,2).toUpperCase()}</div>}
              </div>
              <span className="text-xs font-medium text-foreground">{r.reviewer_name}</span>
              {r.reviewer_username && <span className="text-[10px] text-muted-foreground">@{r.reviewer_username}</span>}
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3" style={{ color: i < r.rating ? "#f59e0b" : "rgba(255,255,255,0.15)", fill: i < r.rating ? "#f59e0b" : "transparent" }} />)}
            </div>
            {r.title && <p className="text-sm font-medium text-foreground mt-1.5">{r.title}</p>}
            {r.body && <p className="text-xs mt-1 text-muted-foreground">{r.body}</p>}
            <p className="text-[10px] mt-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}

function OwnPostsTab({ onAuthorClick }: { onAuthorClick?: (post: Post) => void }) {
  const { user, profile } = useAuth();
  const isMobileView = useIsMobile();
  const { data: ownPosts = [], isLoading: ownLoading } = useUserPosts(user?.id);
  const { data: feedPosts = [], isLoading: feedLoading } = useFeedPosts();
  
  // On mobile, show mixed feed (owner + followed). On desktop, show owner only (followed posts are in right panel).
  const isLoading = isMobileView ? (ownLoading || feedLoading) : ownLoading;
  const posts = isMobileView
    ? (() => {
        // Merge owner posts + feed posts, deduplicate, sort by date
        const merged = new Map<string, Post>();
        ownPosts.forEach(p => merged.set(p.id, p));
        feedPosts.forEach(p => { if (!merged.has(p.id)) merged.set(p.id, p); });
        return Array.from(merged.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      })()
    : ownPosts;
  const createPost = useCreatePost();
  const toggleReaction = useToggleReaction();
  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [buyNowEnabled, setBuyNowEnabled] = useState(false);
  const [joinNowEnabled, setJoinNowEnabled] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();

  // Emoji input hook for type-to-suggest
  const {
    currentWord,
    handleInputChange: handleEmojiInputChange,
    insertEmoji,
    replaceCurrentWord,
  } = useEmojiInput(text, setText);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isVideo = file.type.startsWith("video");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxLabel = isVideo ? "50MB" : "5MB";
    if (file.size > maxSize) { toast.error(`File too large. Max ${maxLabel}.`); return; }
    setMediaFiles(prev => [...prev, file]);
    setMediaPreviews(prev => [...prev, URL.createObjectURL(file)]);
  };

  const removeMedia = (idx: number) => {
    URL.revokeObjectURL(mediaPreviews[idx]);
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if (!text.trim() && mediaFiles.length === 0) return;
    if (!user) return;
    setUploading(true);
    try {
      let mediaUrls: string[] = [];
      let mediaType = "text";
      if (mediaFiles.length> 0) {
        mediaUrls = await Promise.all(mediaFiles.map(f => uploadPostMedia(user.id, f)));
        mediaType = mediaFiles[0].type.startsWith("video") ? "video" : "image";
      }
      // Append CTA tags to content
      let finalContent = text.trim() || "📷";
      if (buyNowEnabled) finalContent += "\n[cta:buynow]";
      if (joinNowEnabled) finalContent += "\n[cta:joinnow]";
      await createPost.mutateAsync({ content: finalContent, mediaUrls, mediaType });
      setText("");
      setBuyNowEnabled(false);
      setJoinNowEnabled(false);
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      setMediaFiles([]);
      setMediaPreviews([]);
    } catch { /* handled in hook */ } finally { setUploading(false); }
  };

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      // Build a context-aware prompt based on attached media and surface info
      let contextHint = "";
      if (mediaFiles.length > 0) {
        const types = mediaFiles.map(f => f.type.startsWith("video") ? "video" : "image");
        contextHint = `The user is posting ${types.join(" and ")} content. `;
      }
      if (profile?.display_name) contextHint += `Business name: ${profile.display_name}. `;
      if (profile?.country) contextHint += `Location: ${profile.country}. `;

      // If there's an image attached, convert to data URL for vision analysis
      let imageDataUrl: string | null = null;
      if (mediaFiles.length > 0 && mediaFiles[0].type.startsWith("image")) {
        imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(mediaFiles[0]);
        });
      }

      const { data, error } = await supabase.functions.invoke("ad-caption-generate", {
        body: {
          image_data_url: imageDataUrl,
          campaign_name: "Social post",
          product_name: profile?.display_name || "My business",
          location: profile?.country || "",
          media_type: mediaFiles.length > 0 ? (mediaFiles[0].type.startsWith("video") ? "video" : "image") : "text",
        },
      });
      if (error) throw error;
      const captions = data?.captions;
      if (captions && captions.length > 0) {
        // Pick the first caption, strip it to be concise for a post
        const caption = captions[0].slice(0, 280);
        setText(caption);
      } else {
        toast.error("No caption generated");
      }
    } catch {
      toast.info("AI generation unavailable — type manually");
    } finally {
      setAiGenerating(false);
    }
  };

  const isPosting = createPost.isPending || uploading;
  const canPost = text.trim() || mediaFiles.length> 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" /> : <span className="text-muted-foreground">{initials}</span>}
          </div>
          <div className="flex-1">
            <textarea value={text} onChange={(e) => handleEmojiInputChange(e.target.value, e.target.selectionStart ?? undefined)} onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }} placeholder="Share an update..." className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[50px]" />
            {mediaPreviews.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {mediaPreviews.map((url, idx) => {
                  const isVideo = mediaFiles[idx]?.type.startsWith("video");
                  return (
                    <div key={idx} className="relative rounded-lg overflow-hidden" style={{ width: isVideo ? "100%" : 64, height: isVideo ? "auto" : 64, maxHeight: isVideo ? 240 : 64 }}>
                      {isVideo ? (
                        <video src={url} className="w-full max-h-[240px] object-cover rounded-lg" muted={videoMuted} controls />
                      ) : (
                        <img src={url} alt="" className="w-16 h-16 object-cover" />
                      )}
                      <button onClick={() => removeMedia(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center z-10"><X className="w-3 h-3 text-foreground" /></button>
                      {isVideo && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                          <button
                            onClick={() => setVideoMuted(!videoMuted)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors"
                            style={{ background: "rgba(255,255,255,0.06)", color: videoMuted ? "#ef4444" : "rgba(255,255,255,0.5)" }}
                            title={videoMuted ? "Unmute" : "Mute sound"}>
                            {videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            {videoMuted ? "Muted" : "Sound on"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* CTA toggles */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setBuyNowEnabled(!buyNowEnabled)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${buyNowEnabled ? "border-emerald-500/50 text-emerald-400" : "border-white/10 text-muted-foreground hover:text-muted-foreground"}`}
                style={buyNowEnabled ? { background: "rgba(16,185,129,0.1)" } : {}}>
                🟢 Buy Now {buyNowEnabled ? "✓" : ""}
              </button>
              <button
                onClick={() => setJoinNowEnabled(!joinNowEnabled)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${joinNowEnabled ? "border-blue-500/50 text-blue-400" : "border-white/10 text-muted-foreground hover:text-muted-foreground"}`}
                style={joinNowEnabled ? { background: "rgba(59,130,246,0.1)" } : {}}>
                🔵 Join Now {joinNowEnabled ? "✓" : ""}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }} />
                <button onClick={() => imageInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground" title="Add image"><ImagePlus className="w-4 h-4" /></button>
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }} />
                <button onClick={() => videoInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground" title="Add video"><Video className="w-4 h-4" /></button>
                <button onClick={handleAiGenerate} disabled={aiGenerating} className="p-1.5 rounded-md hover:bg-amber-500/10 transition-colors disabled:opacity-50" style={{ color: "#f59e0b" }} title="Generate post with AI">
                  {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
                <button onClick={() => setShowEmojiPicker(p => !p)} className="p-1.5 rounded-md hover:bg-white/5" style={{ color: showEmojiPicker ? "#facc15" : "rgba(255,255,255,0.4)" }} title="Emoji"><Smile className="w-4 h-4" /></button>
              </div>
              <Button variant={canPost ? "accent" : "outline"} size="sm" onClick={handlePost} disabled={!canPost || isPosting} className="text-xs px-3 h-8">
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Post
              </Button>
            </div>
            {/* Type-to-suggest emoji suggestions */}
            {currentWord && (
              <div className="mt-1">
                <EmojiSuggestions
                  currentWord={currentWord}
                  onSelect={(value, keyword) => replaceCurrentWord(value, keyword)}
                />
              </div>
            )}
            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="mt-1">
                <YanguEmojiPicker
                  onSelect={(value) => { insertEmoji(value); setShowEmojiPicker(false); }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <MessageSquare className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground mb-1">No posts yet</p>
          <p className="text-xs text-muted-foreground">Share your first update above!</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} toggleReaction={toggleReaction} onAuthorClick={onAuthorClick} />)
      )}
    </div>
  );
}





interface ProfileWorkspaceProps {
  activeProfileTab?: string;
  onProfileTabChange?: (tab: string) => void;
  onViewProfile?: (user: { id: string; display_name: string | null; username: string | null; avatar_url: string | null }) => void;
}

export function ProfileWorkspace({ activeProfileTab, onProfileTabChange, onViewProfile }: ProfileWorkspaceProps) {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [internalTab, setInternalTab] = useState<string>("Home");
  const activeTab = activeProfileTab ?? internalTab;
  const setActiveTab = (tab: string) => {
    if (onProfileTabChange) onProfileTabChange(tab);
    else setInternalTab(tab);
  };
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({});
  const [savingSocial, setSavingSocial] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [verifiedOpen, setVerifiedOpen] = useState(false);
  const [peopleSheetOpen, setPeopleSheetOpen] = useState(false);
  const isMobileView = useIsMobile();
  // Fetch social links from profile
  useEffect(() => {
    if (profile) {
      const stored = (profile as any)?.social_links as SocialLinksData | null;
      if (stored && typeof stored === "object") setSocialLinks(stored);
    }
  }, [profile]);

  const handleSaveSocialLinks = async (data: SocialLinksData) => {
    if (!user) return;
    setSavingSocial(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ social_links: data as any })
        .eq("id", user.id);
      if (error) throw error;
      setSocialLinks(data);
      setSocialModalOpen(false);
      toast.success("Social links saved");
      refreshProfile?.();
    } catch (err) {
      toast.error("Failed to save social links");
    } finally {
      setSavingSocial(false);
    }
  };

  const activeSocialLinks = SOCIAL_PLATFORMS.filter(p => socialLinks[p.id]);

  // Fetch dashboard businesses from the same source as My Business
  const { data: publishedSurfaces = [], isLoading: surfacesLoading } = useQuery({
    queryKey: ["dashboard-published-businesses", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DashboardBusinessSurface[]> => {
      if (!user) return [];

      const { data: surfaces, error: surfacesError } = await supabase
        .from("builder_surfaces")
        .select("id, title, surface_type, metadata, updated_at, cover_image_url")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (surfacesError) throw surfacesError;
      if (!surfaces || surfaces.length === 0) return [];

      const surfaceIds = surfaces.map((surface) => surface.id);

      const { data: publishesData, error: publishesError } = await supabase
        .from("builder_publishes")
        .select("surface_id")
        .in("surface_id", surfaceIds)
        .eq("state", "published");

      if (publishesError) throw publishesError;

      const publishedIds = new Set((publishesData ?? []).map((publish) => publish.surface_id));

      return surfaces
        .filter((surface) => publishedIds.has(surface.id))
        .map((surface) => ({
          id: surface.id,
          title: surface.title,
          surface_type: surface.surface_type,
          cover_image:
            typeof (surface as any).cover_image_url === "string" && (surface as any).cover_image_url.trim() !== ""
              ? (surface as any).cover_image_url
              : null,
        }));
    },
  });

  // Fetch KYC status
  useEffect(() => {
    async function fetchKyc() {
      if (!user) { setKycLoading(false); return; }
      try {
        const { data } = await supabase
          .from("kyc_verifications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        setKycStatus(data?.status ?? null);
      } catch (err) {
        console.error("KYC fetch error:", err);
      } finally {
        setKycLoading(false);
      }
    }
    fetchKyc();
  }, [user]);

  // Use local state if just uploaded, otherwise fall back to profile
  const resolvedAvatar = profile ? resolveAvatarUrl(profile) : null;
  const displayCover = coverUrl || (profile as any)?.cover_url || null;
  const displayCoverCrop = (profile as any)?.cover_crop as CropData | null;
  const displayAvatar = avatarUrl || resolvedAvatar || null;
  const handleImageUpload = async (
    file: File,
    type: "cover" | "avatar"
  ) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const maxSize = type === "cover" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size> maxSize) {
      toast.error(`Image must be under ${type === "cover" ? "5MB" : "2MB"}`);
      return;
    }

    const setUploading = type === "cover" ? setUploadingCover : setUploadingAvatar;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${type}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("profile-media").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      if (type === "cover") {
        // Open crop modal instead of saving immediately
        setPendingCoverUrl(url);
        setCropModalOpen(true);
      } else {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", user.id);
        if (profileErr) throw profileErr;
        setAvatarUrl(url);
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["friends-panel-users"] });
        queryClient.invalidateQueries({ queryKey: ["staff-panel-members"] });
        toast.success("Profile image updated");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCoverCrop = async (cropData: CropData) => {
    if (!user || !pendingCoverUrl) return;
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ cover_url: pendingCoverUrl, cover_crop: cropData } as any)
      .eq("id", user.id);
    if (profileErr) throw profileErr;
    setCoverUrl(pendingCoverUrl);
    await refreshProfile();
    queryClient.invalidateQueries({ queryKey: ["friends-panel-users"] });
    queryClient.invalidateQueries({ queryKey: ["staff-panel-members"] });
    toast.success("Cover image updated");
    setPendingCoverUrl(null);
  };

  const displayName = profile?.display_name || profile?.business_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unnamed";
  const displayDescription = profile?.business_name && profile?.business_name !== displayName ? profile.business_name : "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: nameValue.trim() }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["friends-panel-users"] });
      setEditingName(false);
      toast.success("Name updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveDesc = async () => {
    if (!user) return;
    setSavingDesc(true);
    try {
      const { error } = await supabase.from("profiles").update({ business_name: descValue.trim() || null }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["friends-panel-users"] });
      setEditingDesc(false);
      toast.success("Description updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update description");
    } finally {
      setSavingDesc(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-semibold text-foreground">Home</span>
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-md text-muted-foreground">
            <Search className="w-4 h-4" />
          </button>
          <DashboardMoreMenu userId={user?.id}>
            <button
              className="p-1.5 rounded-md text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DashboardMoreMenu>
        </div>
      </div>

      {/* Scrollable content — ONLY this area scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cover banner */}
        <div
          className="w-full h-[200px] relative overflow-hidden group cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
          style={{
            background: displayCover && !displayCoverCrop
              ? `url(${displayCover}) center/cover no-repeat`
              : !displayCover
              ? "radial-gradient(ellipse 80% 140% at 65% 30%, rgba(34,197,94,0.45) 0%, rgba(16,185,129,0.2) 35%, rgba(6,78,59,0.15) 60%, transparent 80%), linear-gradient(135deg, #061a12 0%, #0a2e1e 30%, #0d3a27 55%, #072217 80%, #051510 100%)"
              : undefined }}>
          {/* Positioned cover with crop data */}
          {displayCover && displayCoverCrop && (
            <img
              src={displayCover}
              alt=""
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                width: "100%",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${displayCoverCrop.x}px), calc(-50% + ${displayCoverCrop.y}px)) scale(${displayCoverCrop.scale})`,
                transformOrigin: "center center" }}
            />
          )}
          {!displayCover && (
            <>
              <div
                className="absolute -right-16 -top-10 w-[480px] h-[200px] rounded-full"
                style={{ border: "1.5px solid rgba(134,239,172,0.2)", transform: "rotate(-15deg)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <img src={adaIcon} alt="Ada AI" className="w-14 h-14" />
                <span className="text-5xl font-bold text-foreground tracking-tight">Ada AI</span>
              </div>
            </>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingCover ? (
              <Loader2 className="w-8 h-8 text-foreground animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImagePlus className="w-6 h-6 text-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Change cover</span>
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f, "cover");
              e.target.value = "";
            }}
          />
        </div>

        {/* Profile section */}
        <div className="px-5 -mt-10 relative z-10">
          {/* Avatar */}
          <div className="relative w-[88px] h-[88px] group">
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold text-foreground cursor-pointer overflow-hidden"
              onClick={() => setAvatarPickerOpen(true)}
              onMouseEnter={triggerEmojiPreload}
              style={displayAvatar
                ? { background: "transparent" }
                : { background: "hsl(var(--muted))", border: "4px solid hsl(var(--card))", borderRadius: "50%" }
              }>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="w-[88px] h-[88px] rounded-full object-cover"
                  style={{ clipPath: "circle(50%)" }}
                />
              ) : (
                initials
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-foreground animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Name row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mt-3 gap-2 sm:gap-4">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1" style={{ maxWidth: "420px" }}>
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="text-[22px] leading-[1.15] font-bold text-foreground bg-transparent border-b-2 outline-none flex-1 min-w-0"
                  style={{ borderColor: "#b5622a" }}
                />
                <button onClick={handleSaveName} disabled={savingName} className="p-1 rounded" style={{ color: "#22c55e" }}>
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingName(false)} className="p-1 rounded text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name cursor-pointer min-w-0" onClick={() => { setNameValue(displayName); setEditingName(true); }}>
                <h2
                  className="text-xl sm:text-[28px] leading-[1.15] font-bold text-foreground truncate"
                  style={{ maxWidth: "420px" }}>
                  {displayName}
                </h2>
                {(() => {
                  const vt = (profile as any)?.verified_tick as string | null;
                  if (!vt) return null;
                  const colorMap: Record<string, string> = { blue: "#3b82f6", orange: "#b5622a", green: "#16a34a" };
                  return <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: colorMap[vt] || "#3b82f6" }} />;
                })()}
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground shrink-0" />
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isMobileView ? (
                <button
                  onClick={() => setPeopleSheetOpen(true)}
                  className="p-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <UserPlus className="w-4 h-4" />
                </button>
              ) : (
                <ShareBusinessPopover avatarUrl={displayAvatar} initials={initials}>
                  <button
                    className="p-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <UserPlus className="w-4 h-4" />
                  </button>
                </ShareBusinessPopover>
              )}
              <button
                onClick={() => setNotifModalOpen(true)}
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)" }}>
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTeamModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
                style={{
                  background: "rgba(181,98,42,0.12)",
                  color: "#E67E22" }}>
                Add team <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setVerifiedOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#3b82f6" }}>
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </button>
          </div>
          </div>

          {/* Description */}
          {editingDesc ? (
            <div className="mt-1.5 flex items-start gap-2" style={{ maxWidth: "420px" }}>
              <Textarea
                autoFocus
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveDesc(); } if (e.key === "Escape") setEditingDesc(false); }}
                className="text-sm bg-transparent border-0 border-b-2 rounded-none p-0 min-h-[32px] resize-none text-foreground focus-visible:ring-0"
                style={{ borderColor: "#b5622a" }}
                placeholder="Write a description..."
              />
              <button onClick={handleSaveDesc} disabled={savingDesc} className="p-1 rounded shrink-0" style={{ color: "#22c55e" }}>
                {savingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setEditingDesc(false)} className="p-1 rounded shrink-0 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p
              className="text-sm mt-1.5 cursor-pointer group/desc inline-flex items-center gap-1.5 hover:text-muted-foreground transition-colors"
              style={{ fontStyle: displayDescription ? "normal" : "italic" }}
              onClick={() => { setDescValue(displayDescription); setEditingDesc(true); }}>
              {displayDescription || "Set a description..."}
              <Pencil className="w-3 h-3 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
            </p>
          )}

          {/* Meta row */}
          <div
            className="flex items-center gap-2.5 mt-2 text-xs flex-wrap text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dubai, AE
            </span>
            <span className="text-muted-foreground">•</span>
            <button
              className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
              onClick={() => setSocialModalOpen(true)}>
              <Plus className="w-3 h-3" />
              {activeSocialLinks.length> 0 ? "Edit social links" : "Add social links"}
            </button>
            {activeSocialLinks.length> 0 && (
              <span className="flex items-center gap-1.5 ml-1">
                {activeSocialLinks.map(p => (
                  <a
                    key={p.id}
                    href={socialLinks[p.id] ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <img src={p.icon} alt={p.name} className="w-4 h-4 rounded-sm object-contain" />
                  </a>
                ))}
              </span>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1">
              Created by
              <span
                className="w-4 h-4 rounded-full inline-flex items-center justify-center overflow-hidden shrink-0"
                style={displayAvatar ? { background: "transparent" } : { background: "#f97316" }}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-4 h-4 rounded-full object-cover" style={{ clipPath: "circle(50%)" }} />
                ) : (
                  <span className="text-[8px] font-bold">{initials.charAt(0)}</span>
                )}
              </span>
              {displayName}
            </span>
          </div>

          <p
            className="text-xs mt-1.5 text-muted-foreground">
            1 members
          </p>
        </div>

        {/* Tabs */}
        <div
          className="px-5 mt-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative pb-2.5 text-sm font-medium transition-colors"
                style={{
                  color:
                    activeTab === tab ? "#E67E22" : "rgba(255,255,255,0.45)" }}>
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

        {/* Tab Content */}
        <div className="px-5 py-4">
          {activeTab === "Home" && (
            <>
              {/* Businesses header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Business</span>
                  <button
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: "#b5622a" }}
                    onClick={() => navigate("/my-business")}>
                    <Plus className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
                <button
                  className="text-sm font-medium"
                  style={{ color: "#E67E22" }}
                  onClick={() => navigate("/my-business")}>
                  See all
                </button>
              </div>

              {/* Published surfaces list */}
              {surfacesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : publishedSurfaces.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-sm font-medium text-foreground mb-1">No published business yet</p>
                  <p className="text-xs mb-4 text-muted-foreground">
                    Publish your first business to see it here.
                  </p>
                  <button
                    onClick={() => navigate("/my-business")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
                    Publish your business
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {publishedSurfaces.map((surface) => {
                    const initials = (surface.title || "B").slice(0, 1).toUpperCase();
                    const liveUrl = `/s/${surface.id}/preview`;
                    return (
                      <div
                        key={surface.id}
                        className="rounded-xl overflow-hidden"
                        style={{ background: "#1a2129", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {surface.cover_image ? (
                          <img
                            src={surface.cover_image}
                            alt={surface.title || "Business"}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div
                            className="h-24 flex items-center justify-center text-3xl font-bold"
                            style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
                            {initials}
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground">{surface.title || "Untitled"}</p>
                          <p className="text-xs mt-1 text-muted-foreground">
                            {surface.surface_type}
                          </p>
                        </div>
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          {liveUrl ? (
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" style={{ color: "#22c55e" }} />
                            </a>
                          ) : (
                            <Eye className="w-4 h-4" style={{ color: "#22c55e" }} />
                          )}
                          <Pencil
                            className="w-4 h-4 cursor-pointer text-muted-foreground"
                            onClick={() => navigate("/my-business")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Go Live bar */}
              <div
                className="mt-6 rounded-xl flex items-center gap-3 px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={displayAvatar ? {} : { background: "#f97316" }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-foreground">{initials.charAt(0)}</span>
                  )}
                </div>
                <span className="flex-1 text-sm text-muted-foreground">
                  Say something they'll screenshot...
                </span>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                  onClick={() => navigate("/live")}>
                  <Video className="w-4 h-4" /> Go live
                </button>
              </div>
            </>
          )}

          {activeTab === "KYC" && (
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(181,98,42,0.15)" }}>
                  <Shield className="w-5 h-5" style={{ color: "#E67E22" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Identity Verification</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete KYC to unlock full publishing
                  </p>
                </div>
              </div>

              {kycLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{
                      background: kycStatus === "approved"
                        ? "rgba(34,197,94,0.08)"
                        : kycStatus === "rejected"
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        kycStatus === "approved"
                          ? "rgba(34,197,94,0.2)"
                          : kycStatus === "rejected"
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(255,255,255,0.08)"
                      }` }}>
                    <div className="flex items-center gap-2">
                      {kycStatus === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
                      ) : kycStatus === "rejected" ? (
                        <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                      ) : kycStatus === "pending" || kycStatus === "submitted" ? (
                        <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        Status: {kycStatus
                          ? kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)
                          : "Not started"}
                      </span>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs font-medium text-foreground mb-2">What you'll need:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Government-issued ID</li>
                      <li>• Proof of address</li>
                      <li>• A few minutes to complete</li>
                    </ul>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate("/kyc")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    style={{
                      background: kycStatus === "approved" ? "rgba(34,197,94,0.12)" : "linear-gradient(135deg, #b5622a, #5c2a12)",
                      color: kycStatus === "approved" ? "#22c55e" : "#fff" }}
                    disabled={kycStatus === "approved"}>
                    {kycStatus === "approved" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </>
                    ) : kycStatus === "pending" || kycStatus === "submitted" ? (
                      "Continue Verification"
                    ) : (
                      "Start KYC"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "Reviews" && <OwnReviewsTab />}

          {activeTab === "Posts" && <OwnPostsTab onAuthorClick={onViewProfile ? (post) => {
            if (post.user_id === user?.id) return; // Don't switch to own profile
            onViewProfile({
              id: post.user_id,
              display_name: post.author_name || null,
              username: post.author_username || null,
              avatar_url: post.author_avatar || null,
            });
          } : undefined} />}

          {activeTab === "About" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Bio</p>
                <p className="text-sm text-muted-foreground">
                  {((profile as any)?.social_links as any)?.about_me || "No bio set yet. Use the About panel on the right to add one."}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Business</p>
                <p className="text-sm text-muted-foreground">
                  {((profile as any)?.social_links as any)?.about_business || "No business info set yet."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
      <AddTeamModal open={teamModalOpen} onOpenChange={setTeamModalOpen} />
      <NotificationPrefsModal open={notifModalOpen} onOpenChange={setNotifModalOpen} />
      <SocialLinksModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        initialData={socialLinks}
        onSave={handleSaveSocialLinks}
        saving={savingSocial}
      />
      <AvatarPickerModal open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen} />
      {pendingCoverUrl && (
        <CoverCropModal
          open={cropModalOpen}
          onOpenChange={(open) => {
            setCropModalOpen(open);
            if (!open) setPendingCoverUrl(null);
          }}
          imageUrl={pendingCoverUrl}
          onSave={handleSaveCoverCrop}
        />
      )}
      <VerifiedModal open={verifiedOpen} onOpenChange={setVerifiedOpen} />
      <MobilePeopleSheet open={peopleSheetOpen} onOpenChange={setPeopleSheetOpen} />
    </div>
  );
}
