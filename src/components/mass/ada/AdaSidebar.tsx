import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine,
  Image,
  FileText,
  Share2,
  Search,
  X,
  MessageCircle,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const sidebarNavItems = [
  { icon: PenLine, label: "Chat", id: "chat" },
  { icon: Image, label: "Image", id: "image" },
  { icon: FileText, label: "Docs", id: "docs" },
  { icon: Share2, label: "Share", id: "share" },
];

const ANON_CHATS_KEY = "ada_anon_chats";

interface ChatHistoryItem {
  id: string;
  title: string;
  updated_at: string;
}

interface AdaSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdaSidebar({ isOpen = true, onClose }: AdaSidebarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeNav, setActiveNav] = useState("chat");
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (isAuthenticated && user) {
      const { data } = await supabase
        .from("ada_chats")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      setChatHistory((data || []).map(c => ({ id: c.id, title: c.title || "Untitled", updated_at: c.updated_at })));
    } else {
      try {
        const chats = JSON.parse(localStorage.getItem(ANON_CHATS_KEY) || "[]");
        setChatHistory(chats.map((c: any) => ({ id: c.id, title: c.title || "Untitled", updated_at: "" })));
      } catch { setChatHistory([]); }
    }
  }, [isAuthenticated, user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Refresh history when a new chat is created
  useEffect(() => {
    const handler = () => { setTimeout(loadHistory, 500); };
    window.addEventListener("ada-new-chat", handler);
    window.addEventListener("ada-chat-created", handler);
    return () => {
      window.removeEventListener("ada-new-chat", handler);
      window.removeEventListener("ada-chat-created", handler);
    };
  }, [loadHistory]);

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("ada-new-chat"));
  };

  const handleLoadChat = (chatId: string) => {
    window.dispatchEvent(new CustomEvent("ada-load-chat", { detail: chatId }));
    onClose?.();
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

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
        style={{ background: "transparent" }}
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
          <img src={adaLogo} alt="Ada AI" className="h-10 w-auto cursor-pointer" onClick={() => navigate("/")} />
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
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
            style={{
              background: "linear-gradient(90deg, #C4841F 0%, rgba(212,149,43,0.45) 55%, rgba(26,26,26,0.18) 100%)",
              boxShadow: "0 0 18px rgba(212,149,43,0.18)",
            }}
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
            {chatHistory.length === 0 && (
              <p className="text-white/30 text-xs px-3 py-2">No chats yet</p>
            )}
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleLoadChat(chat.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-white/70 text-sm truncate flex-1">
                  {chat.title}
                </span>
                {chat.updated_at && (
                  <span className="text-white/30 text-xs flex-shrink-0">
                    {timeAgo(chat.updated_at)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="p-4" />
      </aside>
    </>
  );
}
