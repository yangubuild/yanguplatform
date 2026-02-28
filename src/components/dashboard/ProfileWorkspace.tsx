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
  Video,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";

const TABS = ["Home", "Chats", "Apps", "Products", "About"] as const;

export function ProfileWorkspace() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("Home");

  const displayName = "Fresh & Wholesome Foods Co.";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
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

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Cover banner */}
        <div
          className="w-full h-[240px] relative overflow-hidden"
          style={{
            background:
              "radial-gradient(70% 120% at 70% 20%, rgba(34,197,94,0.36) 0%, rgba(12,32,24,0) 62%), linear-gradient(120deg, #02130d 10%, #06301f 44%, #0f3f2c 70%, #02130d 100%)",
          }}
        >
          <div
            className="absolute -right-20 -top-14 w-[520px] h-[230px] rounded-full"
            style={{ border: "2px solid rgba(134,239,172,0.25)", transform: "rotate(-18deg)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <img src={adaIcon} alt="Ada AI" className="w-16 h-16" />
            <span className="text-6xl font-bold text-white tracking-tight">Ada AI</span>
          </div>
        </div>

        {/* Profile card */}
        <div className="px-6 -mt-9 relative z-10">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-[22px] flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: "#1e293b", border: "4px solid #0f171c" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-[22px] object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Name row */}
          <div className="flex items-center justify-between mt-4 gap-4">
            <h2 className="text-5xl leading-[1.05] font-bold text-white">{displayName}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <UserPlus className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Bell className="w-4 h-4" />
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
              >
                Add team <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
            Set a description...
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dubai, AE
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
              Kafeero Aziizi
            </span>
          </div>

          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>1 members</p>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-10">
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
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#3b82f6" }}
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <button className="text-sm font-medium" style={{ color: "#60a5fa" }}>
              See all
            </button>
          </div>

          {/* Product card */}
          <div
            className="w-[300px] rounded-xl overflow-hidden"
            style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-40 flex items-center justify-center text-4xl font-bold"
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
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-3 rounded-2xl px-3 py-3"
            style={{ background: "#171d23", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "#f97316" }}>
              🐉
            </span>
            <span className="flex-1 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Say something they'll screenshot...
            </span>
            <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.1)" }} />
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold shrink-0"
              style={{ background: "#ef4444", color: "#fff" }}
              onClick={() => console.log("[GoLive] placeholder")}
            >
              <Video className="w-4 h-4" />
              Go live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
