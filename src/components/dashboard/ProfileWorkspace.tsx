import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useNavigate } from "react-router-dom";

const TABS = ["Home", "KYC", "Apps", "Business", "About"] as const;

export function ProfileWorkspace() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch published surfaces
  const { data: allSurfaces, isLoading: surfacesLoading } = useSurfaces();
  const publishedSurfaces = (allSurfaces || []).filter(s => s.activePublishes.length > 0);

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
  const displayCover = coverUrl || (profile as any)?.cover_url || null;
  const displayAvatar = avatarUrl || profile?.avatar_url || null;
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
    if (file.size > maxSize) {
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

      const updateCol = type === "cover" ? "cover_url" : "avatar_url";
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ [updateCol]: url })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      if (type === "cover") setCoverUrl(url);
      else setAvatarUrl(url);

      toast.success(`${type === "cover" ? "Cover" : "Profile"} image updated`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const displayName = "Fresh & Wholesome Foods Co.";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full" style={{ background: "#0f141a" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Home</span>
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-md"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-md"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content — ONLY this area scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cover banner */}
        <div
          className="w-full h-[200px] relative overflow-hidden group cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
          style={{
            background: displayCover
              ? `url(${displayCover}) center/cover no-repeat`
              : "radial-gradient(ellipse 80% 140% at 65% 30%, rgba(34,197,94,0.45) 0%, rgba(16,185,129,0.2) 35%, rgba(6,78,59,0.15) 60%, transparent 80%), linear-gradient(135deg, #061a12 0%, #0a2e1e 30%, #0d3a27 55%, #072217 80%, #051510 100%)",
          }}
        >
          {!displayCover && (
            <>
              <div
                className="absolute -right-16 -top-10 w-[480px] h-[200px] rounded-full"
                style={{ border: "1.5px solid rgba(134,239,172,0.2)", transform: "rotate(-15deg)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <img src={adaIcon} alt="Ada AI" className="w-14 h-14" />
                <span className="text-5xl font-bold text-white tracking-tight">Ada AI</span>
              </div>
            </>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingCover ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImagePlus className="w-6 h-6 text-white" />
                <span className="text-xs text-white/80 font-medium">Change cover</span>
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
              className="w-full h-full rounded-[20px] flex items-center justify-center text-2xl font-bold text-white cursor-pointer overflow-hidden"
              onClick={() => avatarInputRef.current?.click()}
              style={{
                background: "#1e293b",
                border: "4px solid #0f141a",
              }}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="w-full h-full rounded-[18px] object-cover"
                />
              ) : (
                initials
              )}
              {/* Hover overlay */}
              <div className="absolute inset-1 rounded-[16px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, "avatar");
                e.target.value = "";
              }}
            />
          </div>

          {/* Name row */}
          <div className="flex items-start justify-between mt-3 gap-4">
            <h2
              className="text-[28px] leading-[1.15] font-bold text-white"
              style={{ maxWidth: "420px" }}
            >
              {displayName}
            </h2>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#60a5fa",
                }}
              >
                Add team <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-sm mt-1.5"
            style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}
          >
            Set a description...
          </p>

          {/* Meta row */}
          <div
            className="flex items-center gap-2.5 mt-2 text-xs flex-wrap"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dubai, AE
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <button className="flex items-center gap-1 hover:text-white/70 transition-colors">
              <Plus className="w-3 h-3" />
              Add social links
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <span className="flex items-center gap-1">
              Created by
              <span
                className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[8px] font-bold"
                style={{ background: "#f97316" }}
              >
                🐉
              </span>
              Kafeero Aziizi
            </span>
          </div>

          <p
            className="text-xs mt-1.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            1 members
          </p>
        </div>

        {/* Tabs */}
        <div
          className="px-5 mt-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
        <div className="flex justify-between">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative pb-2.5 text-sm font-medium transition-colors"
                style={{
                  color:
                    activeTab === tab ? "#60a5fa" : "rgba(255,255,255,0.45)",
                }}
              >
                {tab}
                {activeTab === tab && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "#3b82f6" }}
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
                  <span className="text-sm font-semibold text-white">Business</span>
                  <button
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: "#3b82f6" }}
                    onClick={() => navigate("/my-business")}
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <button
                  className="text-sm font-medium"
                  style={{ color: "#60a5fa" }}
                  onClick={() => navigate("/my-business")}
                >
                  See all
                </button>
              </div>

              {/* Published surfaces list */}
              {surfacesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
                </div>
              ) : publishedSurfaces.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-sm font-medium text-white mb-1">No published business yet</p>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Publish your first business to see it here.
                  </p>
                  <button
                    onClick={() => navigate("/my-business")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "#3b82f6", color: "#fff" }}
                  >
                    Publish your business
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 flex-wrap">
                  {publishedSurfaces.map((surface) => {
                    const initials = (surface.title || "B").slice(0, 1).toUpperCase();
                    const publishDomain = surface.activePublishes[0];
                    const liveUrl = publishDomain
                      ? `https://${publishDomain.domain_host}${publishDomain.slug ? `/${publishDomain.slug}` : ""}`
                      : null;
                    return (
                      <div
                        key={surface.id}
                        className="w-[280px] rounded-xl overflow-hidden"
                        style={{ background: "#1a2129", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-36 flex items-center justify-center text-4xl font-bold"
                          style={{ background: "#2563eb", color: "rgba(255,255,255,0.3)" }}
                        >
                          {initials}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-white">{surface.title || "Untitled"}</p>
                          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {surface.surface_type}
                          </p>
                        </div>
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          {liveUrl ? (
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" style={{ color: "#22c55e" }} />
                            </a>
                          ) : (
                            <Eye className="w-4 h-4" style={{ color: "#22c55e" }} />
                          )}
                          <Pencil
                            className="w-4 h-4 cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            onClick={() => navigate("/my-business")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "KYC" && (
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  <Shield className="w-5 h-5" style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Identity Verification</h3>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Complete KYC to unlock full publishing
                  </p>
                </div>
              </div>

              {kycLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
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
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {kycStatus === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
                      ) : kycStatus === "rejected" ? (
                        <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                      ) : kycStatus === "pending" || kycStatus === "submitted" ? (
                        <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                      ) : (
                        <Shield className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                      )}
                      <span className="text-sm font-medium text-white">
                        Status: {kycStatus
                          ? kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)
                          : "Not started"}
                      </span>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-medium text-white mb-2">What you'll need:</p>
                    <ul className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                      background: kycStatus === "approved" ? "rgba(34,197,94,0.12)" : "#3b82f6",
                      color: kycStatus === "approved" ? "#22c55e" : "#fff",
                    }}
                    disabled={kycStatus === "approved"}
                  >
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

          {activeTab === "Business" && (
            <>
              {surfacesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
                </div>
              ) : publishedSurfaces.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-sm font-medium text-white mb-1">No published business</p>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Go to My Business to publish your first surface.
                  </p>
                  <button
                    onClick={() => navigate("/my-business")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "#3b82f6", color: "#fff" }}
                  >
                    Go to My Business
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 flex-wrap">
                  {publishedSurfaces.map((surface) => {
                    const initials = (surface.title || "B").slice(0, 1).toUpperCase();
                    const publishDomain = surface.activePublishes[0];
                    const liveUrl = publishDomain
                      ? `https://${publishDomain.domain_host}${publishDomain.slug ? `/${publishDomain.slug}` : ""}`
                      : null;
                    return (
                      <div
                        key={surface.id}
                        className="w-[280px] rounded-xl overflow-hidden"
                        style={{ background: "#1a2129", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-36 flex items-center justify-center text-4xl font-bold"
                          style={{ background: "#2563eb", color: "rgba(255,255,255,0.3)" }}
                        >
                          {initials}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-white">{surface.title || "Untitled"}</p>
                          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {surface.surface_type}
                          </p>
                        </div>
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          {liveUrl ? (
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" style={{ color: "#22c55e" }} />
                            </a>
                          ) : (
                            <Eye className="w-4 h-4" style={{ color: "#22c55e" }} />
                          )}
                          <Pencil
                            className="w-4 h-4 cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            onClick={() => navigate("/my-business")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Composer bar — inside scroll flow, NOT sticky */}
        <div className="px-5 pb-5">
          <div
            className="flex items-center gap-3 rounded-2xl px-3 py-3"
            style={{
              background: "#151b21",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: "#f97316" }}
            >
              🐉
            </span>
            <span
              className="flex-1 text-sm"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Say something they'll screenshot...
            </span>
            <div
              className="w-px h-5"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shrink-0"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              <Video className="w-4 h-4" />
              Go live
            </button>
          </div>
        </div>

        {/* Empty posts section */}
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Skeleton post card */}
          <div
            className="w-full max-w-md rounded-xl p-5 mb-6"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="h-2 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3 w-3/5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>

          <p className="text-sm font-semibold text-white">
            Looks like there aren't any posts yet.
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Be the first one to make a post!
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
