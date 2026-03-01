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
        {/* Cover banner — bright green vibrant gradient */}
        <div
          className="w-full h-[200px] relative overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 80% 140% at 65% 30%, rgba(34,197,94,0.45) 0%, rgba(16,185,129,0.2) 35%, rgba(6,78,59,0.15) 60%, transparent 80%), linear-gradient(135deg, #061a12 0%, #0a2e1e 30%, #0d3a27 55%, #072217 80%, #051510 100%)",
          }}
        >
          {/* Decorative arc */}
          <div
            className="absolute -right-16 -top-10 w-[480px] h-[200px] rounded-full"
            style={{
              border: "1.5px solid rgba(134,239,172,0.2)",
              transform: "rotate(-15deg)",
            }}
          />
          {/* Ada AI centered */}
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <img src={adaIcon} alt="Ada AI" className="w-14 h-14" />
            <span className="text-5xl font-bold text-white tracking-tight">
              Ada AI
            </span>
          </div>
        </div>

        {/* Profile section */}
        <div className="px-5 -mt-10 relative z-10">
          {/* Avatar */}
          <div
            className="w-[88px] h-[88px] rounded-[20px] flex items-center justify-center text-2xl font-bold text-white"
            style={{
              background: "#1e293b",
              border: "4px solid #0f141a",
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full rounded-[18px] object-cover"
              />
            ) : (
              initials
            )}
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

        {/* Content — Products */}
        <div className="px-5 py-4">
          {/* Products header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Products</span>
              <button
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "#3b82f6" }}
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <button
              className="text-sm font-medium"
              style={{ color: "#60a5fa" }}
            >
              See all
            </button>
          </div>

          {/* Product card — wider to match screenshot */}
          <div
            className="w-[280px] rounded-xl overflow-hidden"
            style={{
              background: "#1a2129",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="h-36 flex items-center justify-center text-4xl font-bold"
              style={{
                background: "#2563eb",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              B
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-white">
                Budget-Friendly Meal Prep Kits
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                $29.99 / month
              </p>
            </div>
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Eye className="w-4 h-4" style={{ color: "#22c55e" }} />
              <Pencil
                className="w-4 h-4"
                style={{ color: "rgba(255,255,255,0.35)" }}
              />
            </div>
          </div>
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
