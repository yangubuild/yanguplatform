import { useState } from "react";
import {
  Home,
  PlusCircle,
  MessageSquare,
  Users,
  BookOpen,
  Radio,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, color: "#3b82f6" },
  { id: "add-app", label: "Add app", icon: PlusCircle },
  { id: "forum", label: "Public forum", icon: MessageSquare, color: "#6366f1" },
  { id: "content", label: "Content", icon: BookOpen, color: "#22c55e" },
  { id: "livestreaming", label: "Livestreaming", icon: Radio, color: "#ef4444" },
  { id: "courses", label: "Courses", icon: GraduationCap, color: "#22c55e" },
];

const PINNED_ITEMS = [
  { id: "products", label: "Products", icon: BookOpen },
  { id: "checkout-links", label: "Checkout links", icon: BookOpen },
  { id: "invoices", label: "Invoices", icon: BookOpen },
];

interface InnerPageSidebarProps {
  className?: string;
}

export function InnerPageSidebar({ className = "" }: InnerPageSidebarProps) {
  const [active, setActive] = useState("home");

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto ${className}`}
      style={{ background: "#1a2025" }}
    >
      {/* Preview role */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Preview as</span>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: "#4ade80" }} />
          Admin
          <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5 ${
                isActive ? "text-white" : ""
              }`}
              style={{
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                color: isActive ? "#60a5fa" : "rgba(255,255,255,0.65)",
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? "#60a5fa" : item.color || "rgba(255,255,255,0.5)" }}
              />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Pinned section */}
        <div className="mt-4 mb-1">
          <p className="text-[10px] font-semibold tracking-wider px-3 mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Pinned
          </p>
          {PINNED_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* All tools */}
        <div className="mt-4 mb-1">
          <p className="text-[10px] font-semibold tracking-wider px-3 mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            All tools
          </p>
          <button
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              <span className="font-medium">Marketing</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
          <button
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              <span className="font-medium">More</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </div>

        {/* Apps section */}
        <div className="mt-4 mb-1">
          <p className="text-[10px] font-semibold tracking-wider px-3 mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Apps
          </p>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <PlusCircle className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            <span className="font-medium">Add</span>
          </button>
        </div>

        {/* Chat section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                Chat
              </p>
              <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
            </div>
            <PlusCircle className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <span className="w-4 h-4 rounded-full shrink-0" style={{ background: "#f97316" }} />
            <span className="font-medium">Chat</span>
          </button>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 mt-auto">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">Developer</span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
