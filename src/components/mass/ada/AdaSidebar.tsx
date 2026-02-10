import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine,
  Image,
  FileText,
  Share2,
  Search,
  X,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";
import adaLogo from "@/assets/ada-logo-full.png";

const sidebarNavItems = [
  { icon: PenLine, label: "Chat", id: "chat" },
  { icon: Image, label: "Image", id: "image" },
  { icon: FileText, label: "Docs", id: "docs" },
  { icon: Share2, label: "Share", id: "share" },
];

const chatHistory = [
  { title: "Best way to stay...", time: "9s ago" },
  { title: "Why is my phon...", time: "3h ago" },
  { title: "Measure monito...", time: "7h ago" },
];

interface AdaSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdaSidebar({ isOpen = true, onClose }: AdaSidebarProps) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("chat");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1a1a1a" }}
      >
        {/* Close button mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <img src={adaLogo} alt="Ada AI" className="h-7 w-auto" />
          <div className="flex-1" />
          <button className="text-white/40 hover:text-white/70">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Icon nav strip */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* New Chat button */}
        <div className="px-4 pt-4 pb-2">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #D4952B, #F4A83D)" }}
          >
            <span>+</span> New Chat
          </button>
        </div>

        {/* Chat history */}
        <div className="px-4 pt-4 flex-1 overflow-y-auto">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">
            All chat
          </p>
          <div className="space-y-1">
            {chatHistory.map((chat, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-white/70 text-sm truncate flex-1">
                  {chat.title}
                </span>
                <span className="text-white/30 text-xs flex-shrink-0">
                  {chat.time}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="p-4">
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
               background: "linear-gradient(135deg, #C4841F 0%, #D4952B 40%, #F4A83D 100%)",
            }}
          >
            <div>
              <p className="text-white font-semibold text-sm">Get pro features</p>
              <button className="text-white/80 text-xs mt-1 underline">
                Upgrade Now
              </button>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
      </aside>
    </>
  );
}
