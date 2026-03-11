import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { triggerEmojiPreload } from "@/hooks/useEmojiPreloader";
import AvatarPickerModal from "@/components/profile/AvatarPickerModal";
import { supabase } from "@/integrations/supabase/client";
import { ICON_MAP } from "@/lib/app-store/icon-map";
import { connectApp } from "@/lib/app-store/connect";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Link2,
  Pencil,
  DollarSign,
  Grid3X3,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useRef } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import CoverCropModal, { type CropData } from "@/components/profile/CoverCropModal";

import xIcon from "@/assets/icons/x-3.png";
import instagramIcon from "@/assets/icons/instagram-3.png";
import linkedinIcon from "@/assets/icons/linkedin-2.png";
import facebookIcon from "@/assets/icons/facebook-3.png";
import tiktokIcon from "@/assets/icons/tiktok-3.png";
import youtubeIcon from "@/assets/icons/youtube-3.png";
import snapchatIcon from "@/assets/icons/snapchat-2.png";
import whatsappIcon from "@/assets/icons/whatsapp-3.png";
import threadsIcon from "@/assets/icons/threads-2.png";
import telegramIcon from "@/assets/icons/telegram-2.png";
import discordIcon from "@/assets/icons/discord-2.png";
import twitchIcon from "@/assets/icons/twitch-2.png";
import pinterestIcon from "@/assets/icons/pinterest-2.png";
import spotifyIcon from "@/assets/icons/spotify-2.png";
import appleMusicIcon from "@/assets/icons/apple-music.png";
import tidalIcon from "@/assets/icons/tidal-2.png";
import behanceIcon from "@/assets/icons/behance-2.png";
import dribbbleIcon from "@/assets/icons/dribbble-2.png";
import messengerIcon from "@/assets/icons/messenger-2.png";
import emailIcon from "@/assets/icons/email-2.png";
import githubIcon from "@/assets/icons/github-2.png";
import deezerIcon from "@/assets/icons/deezer-2.png";
import redditIcon from "@/assets/icons/reddit-2.png";
import websiteIcon from "@/assets/icons/website-3.png";
import zillowIcon from "@/assets/icons/zillow-2.png";

/** Primary 6 — always visible in edit mode */
const PRIMARY_SOCIALS = [
  { id: "x", name: "X", icon: xIcon, placeholder: "x.com/username" },
  { id: "instagram", name: "Instagram", icon: instagramIcon, placeholder: "instagram.com/username" },
  { id: "linkedin", name: "LinkedIn", icon: linkedinIcon, placeholder: "linkedin.com/in/username" },
  { id: "facebook", name: "Facebook", icon: facebookIcon, placeholder: "facebook.com/page" },
  { id: "tiktok", name: "TikTok", icon: tiktokIcon, placeholder: "tiktok.com/@username" },
  { id: "youtube", name: "YouTube", icon: youtubeIcon, placeholder: "youtube.com/@channel" },
] as const;

/** Extra socials shown in "+ More" modal */
const EXTRA_SOCIALS = [
  { id: "snapchat", name: "Snapchat", icon: snapchatIcon, placeholder: "snapchat.com/add/username" },
  { id: "whatsapp", name: "WhatsApp", icon: whatsappIcon, placeholder: "+00000000000" },
  { id: "threads", name: "Threads", icon: threadsIcon, placeholder: "threads.net/@username" },
  { id: "telegram", name: "Telegram", icon: telegramIcon, placeholder: "t.me/username" },
  { id: "discord", name: "Discord", icon: discordIcon, placeholder: "discord.gg/invite" },
  { id: "twitch", name: "Twitch", icon: twitchIcon, placeholder: "twitch.tv/username" },
  { id: "pinterest", name: "Pinterest", icon: pinterestIcon, placeholder: "pinterest.com/username" },
  { id: "spotify", name: "Spotify", icon: spotifyIcon, placeholder: "open.spotify.com/artist/..." },
  { id: "apple_music", name: "Apple Music", icon: appleMusicIcon, placeholder: "music.apple.com/..." },
  { id: "tidal", name: "Tidal", icon: tidalIcon, placeholder: "tidal.com/browse/..." },
  { id: "behance", name: "Behance", icon: behanceIcon, placeholder: "behance.net/username" },
  { id: "dribbble", name: "Dribbble", icon: dribbbleIcon, placeholder: "dribbble.com/username" },
  { id: "messenger", name: "Messenger", icon: messengerIcon, placeholder: "m.me/username" },
  { id: "email", name: "Email", icon: emailIcon, placeholder: "you@example.com" },
  { id: "github", name: "GitHub", icon: githubIcon, placeholder: "github.com/username" },
  { id: "deezer", name: "Deezer", icon: deezerIcon, placeholder: "deezer.com/..." },
  { id: "reddit", name: "Reddit", icon: redditIcon, placeholder: "reddit.com/u/username" },
  { id: "website", name: "Website", icon: websiteIcon, placeholder: "www.my-website.com" },
  { id: "zillow", name: "Zillow", icon: zillowIcon, placeholder: "zillow.com/profile/username" },
] as const;

const ALL_SOCIALS = [...PRIMARY_SOCIALS, ...EXTRA_SOCIALS];

type SocialLinks = Record<string, string>;

const mockCreated = [
  { id: "1", initials: "F&", title: "Fresh & Wholesome Foods Co.", category: "Food And Beverages", members: 1, earnings: "$0", age: "13d" },
  { id: "2", initials: "UO", title: "Urban Oasis Salon & Spa", category: "Salon Spa", members: 0, earnings: "$0", age: "2mo" },
];

const mockJoined = [
  { id: "3", initials: "YG", title: "yangu Creators Hub", category: "Community", members: 24, earnings: "$0", age: "1mo" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"created" | "joined" | "apps" | "reviews">("created");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [name, setName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState((profile as any)?.bio || "");
  const [showTotalEarned, setShowTotalEarned] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showOwnedApps, setShowOwnedApps] = useState(true);
  const [showJoinedApps, setShowJoinedApps] = useState(true);
  const [saving, setSaving] = useState(false);

  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [expandedSocial, setExpandedSocial] = useState<string | null>(null);
  const [moreSocialsOpen, setMoreSocialsOpen] = useState(false);

  // Load social links from profile
  useEffect(() => {
    const sl = (profile as any)?.social_links;
    if (sl && typeof sl === "object") {
      const links: SocialLinks = {};
      for (const [k, v] of Object.entries(sl)) {
        if (v && typeof v === "string") links[k] = v;
      }
      setSocialLinks(links);
    }
  }, [profile]);

  const avatarSrc = profile ? resolveAvatarUrl(profile) : null;
  const coverUrl = (profile as any)?.cover_url || null;
  const coverCrop = (profile as any)?.cover_crop as CropData | null;
  const displayName = profile?.display_name || "User";
  const usernameDisplay = profile?.username || "user";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Dec 2025";

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Cover image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/cover.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("profile-media").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      // Open crop modal instead of saving immediately
      setPendingCoverUrl(url);
      setCropModalOpen(true);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSaveCrop = async (cropData: CropData) => {
    if (!user || !pendingCoverUrl) return;
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ cover_url: pendingCoverUrl, cover_crop: cropData } as any)
      .eq("id", user.id);
    if (profileErr) throw profileErr;
    await refreshProfile();
    toast({ title: "Cover image updated" });
    setPendingCoverUrl(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://yangu.io/@${usernameDisplay}`);
    toast({ title: "Link copied to clipboard" });
  };

  const handleStartEditing = () => {
    setName(profile?.display_name || "");
    setUsername(profile?.username || "");
    setBio((profile as any)?.bio || "");
    setExpandedSocial(null);
    setEditing(true);
  };

  const handleSaveSocialLink = async (platformId: string, url: string) => {
    const trimmed = url.trim();
    const updated = { ...socialLinks };
    if (trimmed) {
      updated[platformId] = trimmed;
    } else {
      delete updated[platformId];
    }
    setSocialLinks(updated);

    // Persist
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ social_links: updated } as any)
        .eq("id", user.id);
      await refreshProfile();
    } catch {}
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name,
          username: username,
          social_links: socialLinks,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Profile saved" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSocialExpand = (id: string) => {
    setExpandedSocial(prev => (prev === id ? null : id));
  };

  // Public profile: show only socials that have a link, max 6
  const filledSocials = ALL_SOCIALS.filter(s => socialLinks[s.id]);
  const publicSocials = filledSocials.slice(0, 6);

  const tabData = activeTab === "created" ? mockCreated : activeTab === "joined" ? mockJoined : activeTab === "reviews" ? [] : [];

  // Fetch user's installed apps for the "apps" tab
  const { data: installedApps } = useQuery({
    queryKey: ["profile-my-apps", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_user_installs")
        .select("id, app_id, status, installed_at")
        .eq("user_id", user!.id)
        .order("installed_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const appIds = data.map((i) => i.app_id);
      const { data: apps } = await supabase
        .from("app_registry")
        .select("id, slug, name, short_description, icon, provider_name, is_native_yangu")
        .in("id", appIds);
      const appMap = new Map((apps || []).map((a: any) => [a.id, a]));
      return data.map((install) => ({ ...install, app: appMap.get(install.app_id) })).filter((i) => i.app);
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Banner */}
      <div
        className="relative rounded-2xl overflow-hidden group cursor-pointer"
        style={{
          height: 160,
          background: coverUrl && !coverCrop
            ? `url(${coverUrl}) center/cover no-repeat`
            : !coverUrl ? "#2a3038" : undefined,
          overflow: "hidden",
          position: "relative",
        }}
        onClick={() => coverInputRef.current?.click()}
      >
        {/* Positioned cover image with crop data */}
        {coverUrl && coverCrop && (
          <img
            src={coverUrl}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              width: "100%",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${coverCrop.x}px), calc(-50% + ${coverCrop.y}px)) scale(${coverCrop.scale})`,
              transformOrigin: "center center",
            }}
          />
        )}
        {/* Hidden cover file input */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleCoverUpload}
        />

        {/* Hover overlay — same as dashboard */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-[5]">
          {uploadingCover ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="w-6 h-6 text-white" />
              <span className="text-xs text-white/80 font-medium">Change cover</span>
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => coverInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> Change cover
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Share dialog coming soon" })}>
                <ExternalLink className="w-4 h-4 mr-2" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="w-4 h-4 mr-2" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleStartEditing}>
                <Pencil className="w-4 h-4 mr-2" /> Edit profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Avatar */}
      <div className="-mt-12 ml-4 mb-2">
        <button
          onClick={() => setAvatarModalOpen(true)}
          onMouseEnter={triggerEmojiPreload}
          className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden group relative"
          style={avatarSrc
            ? { background: "transparent" }
            : { borderWidth: 4, borderStyle: "solid", borderColor: "#1a2025", background: "#2a3038", color: "rgba(255,255,255,0.6)" }
          }
          title="Change avatar"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-24 h-24 rounded-full object-cover" style={{ clipPath: "circle(50%)" }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Pencil className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      <AvatarPickerModal open={avatarModalOpen} onOpenChange={setAvatarModalOpen} />

      {/* === EDIT MODE === */}
      {editing ? (
        <div className="px-1 mt-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to profile
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="h-px mb-5" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{name.length}/100</p>
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 42))}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{username.length}/42</p>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-white block mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="No bio"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <p className="text-right text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{bio.length}/200</p>
            </div>
          </div>

          <div className="h-px my-8" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Social links section */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-white mb-1">Social links</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Tap an icon to add your link. Only linked socials appear on your profile.
            </p>

            {/* Primary 6 icons */}
            <div className="flex items-center gap-3 flex-wrap">
              {PRIMARY_SOCIALS.map((s) => {
                const hasLink = !!socialLinks[s.id];
                const isExpanded = expandedSocial === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSocialExpand(s.id)}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all relative"
                    style={{
                      border: isExpanded
                        ? "2px solid #b5622a"
                        : hasLink
                        ? "2px solid rgba(255,255,255,0.3)"
                        : "1px solid rgba(255,255,255,0.12)",
                      opacity: hasLink || isExpanded ? 1 : 0.5,
                    }}
                    title={s.name}
                  >
                    <img src={s.icon} alt={s.name} className="w-6 h-6 object-contain" />
                    {hasLink && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-[#1a2025]" />
                    )}
                  </button>
                );
              })}

              {/* + More button */}
              <button
                onClick={() => setMoreSocialsOpen(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{ border: "1px dashed rgba(255,255,255,0.2)" }}
                title="More socials"
              >
                <Plus className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* Expanded input for selected social */}
            {expandedSocial && (() => {
              const platform = ALL_SOCIALS.find(s => s.id === expandedSocial);
              if (!platform) return null;
              return (
                <div
                  className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <img src={platform.icon} alt={platform.name} className="w-6 h-6 object-contain shrink-0" />
                  <input
                    autoFocus
                    value={socialLinks[platform.id] || ""}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, [platform.id]: e.target.value }))}
                    onBlur={() => handleSaveSocialLink(platform.id, socialLinks[platform.id] || "")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveSocialLink(platform.id, socialLinks[platform.id] || "");
                        setExpandedSocial(null);
                      }
                    }}
                    placeholder={platform.placeholder}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  />
                  {socialLinks[platform.id] && (
                    <button
                      onClick={() => {
                        handleSaveSocialLink(platform.id, "");
                        setExpandedSocial(null);
                      }}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="h-px my-8" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* More details */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-white mb-1">More details</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Choose what appears on your profile and other discovery surfaces.
            </p>
            <div className="space-y-4">
              <ToggleRow icon={DollarSign} label="Total earned" checked={showTotalEarned} onChange={setShowTotalEarned} />
              <ToggleRow icon={MapPin} label="Location" checked={showLocation} onChange={setShowLocation} />
              <ToggleRow icon={Grid3X3} label="Owned yangu apps" checked={showOwnedApps} onChange={setShowOwnedApps} />
              <ToggleRow icon={Users} label="Joined yangu apps" checked={showJoinedApps} onChange={setShowJoinedApps} />
            </div>
          </div>

          {/* More Socials Modal */}
          <Dialog open={moreSocialsOpen} onOpenChange={setMoreSocialsOpen}>
            <DialogContent
              className="sm:max-w-sm"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <DialogHeader>
                <DialogTitle className="text-white">More socials</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-2">
                {EXTRA_SOCIALS.map((s) => {
                  const hasLink = !!socialLinks[s.id];
                  return (
                    <div key={s.id}>
                      <div
                        className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                        style={{ background: hasLink ? "rgba(181,98,42,0.1)" : "transparent" }}
                        onClick={() => {
                          setMoreSocialsOpen(false);
                          setExpandedSocial(s.id);
                        }}
                      >
                        <img src={s.icon} alt={s.name} className="w-8 h-8 object-contain shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{s.name}</p>
                          {hasLink && (
                            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {socialLinks[s.id]}
                            </p>
                          )}
                        </div>
                        {hasLink ? (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        ) : (
                          <Plus className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {/* === VIEW MODE === */}
          <div className="px-1">
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>@{usernameDisplay}</p>

            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Dubai, AE</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {joinDate}</span>
            </div>

            {/* Public social icons — only those with links, max 6 */}
            {publicSocials.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {publicSocials.map((s) => (
                  <a
                    key={s.id}
                    href={socialLinks[s.id].startsWith("http") ? socialLinks[s.id] : `https://${socialLinks[s.id]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    title={s.name}
                  >
                    <img src={s.icon} alt={s.name} className="w-6 h-6 object-contain" />
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-white"><strong>0</strong> <span style={{ color: "rgba(255,255,255,0.5)" }}>Followers</span></span>
              <span className="text-sm text-white"><strong>0</strong> <span style={{ color: "rgba(255,255,255,0.5)" }}>Following</span></span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleStartEditing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", background: "transparent" }}
              >
                Edit profile
              </button>
              <button
                onClick={() => navigate("/dashboard/profile/subscription")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", background: "transparent" }}
              >
                Manage subscriptions
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex">
              {(["created", "joined", "apps", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-3 text-sm font-medium text-center capitalize transition-colors relative"
                  style={{ color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.45)" }}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: "#b5622a" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="mt-4 space-y-1">
            {activeTab === "apps" ? (
              !installedApps || installedApps.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  No apps installed yet.
                </p>
              ) : (
                installedApps.map((item: any) => {
                  const appIcon = ICON_MAP[item.app.slug] || item.app.icon;
                  return (
                    <ProfileAppRow key={item.id} item={item} appIcon={appIcon} navigate={navigate} />
                  );
                })
              )
            ) : tabData.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nothing here yet.
              </p>
            ) : (
              tabData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-4 rounded-xl transition-colors cursor-pointer"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: "#2a3038", color: "rgba(255,255,255,0.6)" }}
                  >
                    {item.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{item.category}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <Users className="w-3 h-3" /> {item.members}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-white">{item.earnings}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>all-time · {item.age}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {/* Cover Crop Modal */}
      {pendingCoverUrl && (
        <CoverCropModal
          open={cropModalOpen}
          onOpenChange={(open) => {
            setCropModalOpen(open);
            if (!open) setPendingCoverUrl(null);
          }}
          imageUrl={pendingCoverUrl}
          onSave={handleSaveCrop}
        />
      )}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#232a30" }}
        >
          <Icon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
