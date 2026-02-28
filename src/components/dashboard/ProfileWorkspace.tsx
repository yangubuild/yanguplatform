import { ChangeEvent, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  UserPlus,
  Bell,
  Plus,
  Eye,
  Pencil,
  MapPin,
  Video,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";

const TABS = ["Home", "Chats", "Apps", "Products", "About"] as const;

export function ProfileWorkspace() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.display_name || profile?.business_name || "Your Business";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarSrc = avatarImage || profile?.avatar_url || null;

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>, target: "cover" | "avatar") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextImage = typeof reader.result === "string" ? reader.result : null;
      if (!nextImage) return;
      if (target === "cover") setCoverImage(nextImage);
      if (target === "avatar") setAvatarImage(nextImage);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cover banner */}
        <div
          className="w-full h-[180px] relative overflow-hidden"
          style={
            coverImage
              ? {
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: "linear-gradient(135deg, #0a1a12 0%, #0d2818 40%, #1a3d2a 70%, #0a1a12 100%)",
                }
          }
        >
          {!coverImage && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <img src={adaIcon} alt="Ada AI" className="w-14 h-14" />
              <span className="text-3xl font-bold text-white tracking-wide">Ada AI</span>
            </div>
          )}

          <button
            className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{ background: "rgba(15,23,28,0.7)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.16)" }}
            onClick={() => coverInputRef.current?.click()}
          >
            Change cover
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleImagePick(event, "cover")}
          />
        </div>

        {/* Profile card */}
        <div className="px-6 -mt-8 relative z-10">
          {/* Avatar */}
          <div className="relative w-fit">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: "#1e293b", border: "3px solid #0f171c" }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#0f171c", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change profile image"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImagePick(event, "avatar")}
            />
          </div>

          {/* Name row */}
          <div className="flex items-center justify-between mt-3">
            <h2 className="text-lg font-bold text-white">{displayName}</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <UserPlus className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Bell className="w-4 h-4" />
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
              >
                Add team <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
            Set a description...
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile?.country || "Location"}
            </span>
            <span>•</span>
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <Plus className="w-3 h-3" />
              Add social links
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              Created by
              <span
                className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[8px] font-bold"
                style={{ background: "#f97316" }}
              >
                🐉
              </span>
              {profile?.display_name || "Creator"}
            </span>
          </div>

          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>1 members</p>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative pb-3 text-sm font-medium transition-colors"
                style={{ color: activeTab === tab ? "#60a5fa" : "rgba(255,255,255,0.5)" }}
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

        {/* Content — Products */}
        <div className="px-6 py-4">
          {/* Products header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Products</span>
              <button
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: "#3b82f6" }}
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
            <button className="text-xs font-medium" style={{ color: "#60a5fa" }}>
              See all
            </button>
          </div>

          {/* Product card */}
          <div
            className="w-48 rounded-xl overflow-hidden"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-32 flex items-center justify-center text-4xl font-bold"
              style={{ background: "#2563eb", color: "rgba(255,255,255,0.3)" }}
            >
              B
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-white">Budget-Friendly Meal Prep Kits</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>$29.99 / month</p>
            </div>
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Eye className="w-4 h-4" style={{ color: "#22c55e" }} />
              <Pencil className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            </div>
          </div>
        </div>

        {/* Composer bar — scrollable content */}
        <div className="px-6 py-4 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "#f97316" }}>
            🐉
          </span>
          <div
            className="flex-1 flex items-center rounded-xl px-3 h-10"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Say something they'll screenshot...
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: "#ef4444", color: "#fff" }}
            onClick={() => console.log("[GoLive] placeholder")}
          >
            <Video className="w-3.5 h-3.5" />
            Go live
          </button>
        </div>
      </div>
    </div>
  );
}
