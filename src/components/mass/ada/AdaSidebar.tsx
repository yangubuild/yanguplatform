import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  CloudUpload,
  Palette,
  Code2,
  BarChart3,
  Search,
  X,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import adaIcon from "@/assets/ada-icon.png";
import adaLogo from "@/assets/ada-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

const commandIcons = [
  { icon: Globe, label: "Open Asset Link", id: "preview" },
  { icon: CloudUpload, label: "Save to Studio", id: "save" },
  { icon: Palette, label: "Preset Styles", id: "styles" },
  { icon: Code2, label: "Advanced Mode", id: "advanced" },
  { icon: BarChart3, label: "View History", id: "history" },
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
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId]);

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

  useEffect(() => {
    const handler = () => { setTimeout(loadHistory, 500); };
    window.addEventListener("ada-new-chat", handler);
    window.addEventListener("ada-chat-created", handler);
    return () => {
      window.removeEventListener("ada-new-chat", handler);
      window.removeEventListener("ada-chat-created", handler);
    };
  }, [loadHistory]);

  // Filter chats by search
  const filteredChats = debouncedSearch.trim()
    ? chatHistory.filter(c => c.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : chatHistory;

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("ada-new-chat"));
  };

  const handleLoadChat = (chatId: string) => {
    window.dispatchEvent(new CustomEvent("ada-load-chat", { detail: chatId }));
    onClose?.();
  };

  const handleDeleteChat = async (chatId: string) => {
    setMenuOpenId(null);
    if (isAuthenticated) {
      await supabase.from("ada_messages").delete().eq("chat_id", chatId);
      await supabase.from("ada_chats").delete().eq("id", chatId);
    } else {
      try {
        const chats = JSON.parse(localStorage.getItem(ANON_CHATS_KEY) || "[]");
        localStorage.setItem(ANON_CHATS_KEY, JSON.stringify(chats.filter((c: any) => c.id !== chatId)));
      } catch {}
    }
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    window.dispatchEvent(new CustomEvent("ada-new-chat"));
    toast.success("Chat deleted");
  };

  const handleRenameChat = async (chatId: string) => {
    setMenuOpenId(null);
    const chat = chatHistory.find(c => c.id === chatId);
    setRenamingId(chatId);
    setRenameValue(chat?.title || "");
  };

  const submitRename = async () => {
    if (!renamingId || !renameValue.trim()) return;
    if (isAuthenticated) {
      await supabase.from("ada_chats").update({ title: renameValue.trim() }).eq("id", renamingId);
    }
    setChatHistory(prev => prev.map(c => c.id === renamingId ? { ...c, title: renameValue.trim() } : c));
    setRenamingId(null);
    setRenameValue("");
  };

  // Icon action handlers
  const handleIconAction = (id: string) => {
    window.dispatchEvent(new CustomEvent("ada-command", { detail: id }));
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

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-[#F4A83D] font-medium">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
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
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
              else setSearchQuery("");
            }}
            className={`p-1.5 rounded-lg transition-colors ${isSearchOpen ? "text-[#F4A83D] bg-white/5" : "text-white/40 hover:text-white/70"}`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="px-4 pt-1 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-8 pr-8 py-2 rounded-lg text-sm text-white/80 placeholder:text-white/30 outline-none border border-white/10 focus:border-[#C4841F]/50"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Command icon strip */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          {commandIcons.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleIconAction(item.id)}
                className="group relative p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {item.label}
                </span>
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
            {debouncedSearch.trim() ? `Results (${filteredChats.length})` : "All chat"}
          </p>
          <div className="space-y-1">
            {filteredChats.length === 0 && (
              <p className="text-white/30 text-xs px-3 py-2">
                {debouncedSearch.trim() ? "No matching chats" : "No chats yet"}
              </p>
            )}
            {filteredChats.map((chat) => (
              <div key={chat.id} className="relative group">
                {renamingId === chat.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); submitRename(); }}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={submitRename}
                      className="flex-1 bg-white/10 text-white text-sm rounded px-2 py-1 outline-none border border-white/20 focus:border-[#C4841F]"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => handleLoadChat(chat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <span className="text-white/70 text-sm truncate flex-1">
                      {highlightMatch(chat.title, debouncedSearch)}
                    </span>
                    {chat.updated_at && (
                      <span className="text-white/30 text-xs flex-shrink-0 group-hover:hidden">
                        {timeAgo(chat.updated_at)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                      }}
                      className="p-1 rounded text-white/30 hover:text-white hover:bg-white/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </button>
                )}

                {/* Dropdown menu */}
                {menuOpenId === chat.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-10 z-50 w-40 rounded-lg border border-white/10 py-1 shadow-xl"
                    style={{ background: "#1a1a1a" }}
                  >
                    <button
                      onClick={() => handleRenameChat(chat.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Rename
                    </button>
                    <div className="border-t border-white/10 my-0.5" />
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="p-4" />
      </aside>
    </>
  );
}
