import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Bell,
  Plus,
  Eye,
  Pencil,
  MapPin,
  Link as LinkIcon,
  Video,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";

const TABS = ["Home", "Chats", "Apps", "Products", "About"] as const;

export function ProfileWorkspace() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Home");

  const displayName = profile?.display_name || profile?.business_name || "Your Business";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Home</span>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Search className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cover banner */}
      <div
        className="w-full h-[160px] md:h-[200px] shrink-0 relative"
        style={{
          background: "linear-gradient(135deg, #0a1a12 0%, #0d2818 40%, #1a3d2a 70%, #0a1a12 100%)",
        }}
      >
        {/* Ada AI branding */}
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <img src={adaIcon} alt="Ada AI" className="w-12 h-12 md:w-16 md:h-16" />
          <span className="text-2xl md:text-4xl font-bold text-white tracking-wide">Ada AI</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-8 relative z-10 shrink-0">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
          style={{ background: "#1e293b", border: "3px solid #1a2025" }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            initials
          )}
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
        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
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
      <div className="px-4 mt-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
      <div className="flex-1 px-4 py-4">
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

      {/* Composer bar */}
      <div
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#1a2025" }}
      >
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shrink-0"
          style={{ background: "#22c55e", color: "#fff" }}
          onClick={() => console.log("[GoLive] placeholder")}
        >
          <Video className="w-3.5 h-3.5" />
          Go live
        </button>
      </div>
    </div>
  );
}
