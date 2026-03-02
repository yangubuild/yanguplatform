import { useState } from "react";
import {
  Home,
  PlusCircle,
  MessageSquare,
  BookOpen,
  Radio,
  GraduationCap,
  ChevronDown,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, color: "#3b82f6" },
  { id: "add-app", label: "Add app", icon: PlusCircle },
  { id: "forum", label: "Public forum", icon: MessageSquare, color: "#6366f1" },
  { id: "content", label: "Content", icon: BookOpen, color: "#22c55e" },
  { id: "livestreaming", label: "Livestreaming", icon: Radio, color: "#ef4444" },
  { id: "courses", label: "Courses", icon: GraduationCap, color: "#22c55e" },
  { id: "chat", label: "Chat", customIcon: true, color: "#f97316" },
];

interface InnerPageSidebarProps {
  className?: string;
}

export function InnerPageSidebar({ className = "" }: InnerPageSidebarProps) {
  const [active, setActive] = useState("home");

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ background: "transparent" }}
    >
      {/* Preview role */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Preview as
        </span>
        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#4ade80" }}
          />
          Admin
          <ChevronDown
            className="w-3 h-3"
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-2 mt-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5"
              style={{
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                color: isActive ? "#60a5fa" : "rgba(255,255,255,0.6)",
              }}
            >
              {item.customIcon ? (
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: item.color || "#f97316" }}
                />
              ) : (
                <item.icon
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: isActive
                      ? "#60a5fa"
                      : item.color || "rgba(255,255,255,0.45)",
                  }}
                />
              )}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Chat section header */}
      <div className="px-2 pb-3">
        <div className="flex items-center justify-between px-3 mb-2">
          <div className="flex items-center gap-1">
            <p
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Chat
            </p>
            <ChevronDown
              className="w-3 h-3"
              style={{ color: "rgba(255,255,255,0.25)" }}
            />
          </div>
          <Plus
            className="w-3.5 h-3.5"
            style={{ color: "rgba(255,255,255,0.3)" }}
          />
        </div>
      </div>
    </div>
  );
}
