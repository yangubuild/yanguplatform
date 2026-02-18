import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  CloudUpload,
  Palette,
  Code2,
  BarChart3,
  Search,
  MessageCircle,
  MoreHorizontal,
  Image,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ANON_CHATS_KEY = "ada_anon_chats";

interface ChatItem {
  id: string;
  title: string;
  updated_at: string;
}

const commandIcons = [
  { icon: Globe, label: "Open Asset Link", id: "preview" },
  { icon: CloudUpload, label: "Save to Studio", id: "save" },
  { icon: Palette, label: "Preset Styles", id: "styles" },
  { icon: Code2, label: "Advanced Mode", id: "advanced" },
  { icon: BarChart3, label: "View History", id: "history" },
];

export function AdaBottomSection() {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const loadHistory = useCallback(async () => {
    if (isAuthenticated && user) {
      const { data } = await supabase
        .from("ada_chats")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(8);
      setChats((data || []).map(c => ({ id: c.id, title: c.title || "Untitled", updated_at: c.updated_at })));
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(ANON_CHATS_KEY) || "[]");
        setChats(stored.slice(0, 8).map((c: any) => ({ id: c.id, title: c.title || "Untitled", updated_at: "" })));
      } catch { setChats([]); }
    }
  }, [isAuthenticated, user]);

  const loadImages = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    const { data } = await supabase
      .from("ada_media")
      .select("storage_path")
      .eq("user_id", user.id)
      .eq("kind", "image")
      .order("created_at", { ascending: false })
      .limit(4);
    if (data) setImageUrls(data.map(d => d.storage_path));
  }, [isAuthenticated, user]);

  useEffect(() => { loadHistory(); loadImages(); }, [loadHistory, loadImages]);

  useEffect(() => {
    const handler = () => { setTimeout(() => { loadHistory(); loadImages(); }, 500); };
    window.addEventListener("ada-new-chat", handler);
    window.addEventListener("ada-chat-created", handler);
    return () => {
      window.removeEventListener("ada-new-chat", handler);
      window.removeEventListener("ada-chat-created", handler);
    };
  }, [loadHistory, loadImages]);

  const handleLoadChat = (chatId: string) => {
    window.dispatchEvent(new CustomEvent("ada-load-chat", { detail: chatId }));
  };

  const handleIconAction = (id: string) => {
    window.dispatchEvent(new CustomEvent("ada-command", { detail: id }));
  };

  return (
    <div
      className="border-t border-white/5 px-6 py-6"
      style={{ background: "rgba(5,10,7,0.6)" }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6">
        {/* Left: ALL CHAT */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">All Chat</h3>
            <Search className="w-4 h-4 text-white/30" />
          </div>
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">30 Days</p>
          <div className="space-y-1">
            {chats.length === 0 && (
              <p className="text-white/20 text-xs">No chats yet</p>
            )}
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleLoadChat(chat.id)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                <span className="text-white/60 text-xs truncate flex-1">{chat.title}</span>
                <MoreHorizontal className="w-3.5 h-3.5 text-white/20 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Center: IMAGES */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-white/30" />
            <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Images</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {imageUrls.length === 0 && (
              <p className="text-white/20 text-xs col-span-2">No images yet</p>
            )}
            {imageUrls.map((url, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Icon cluster */}
        <div className="flex flex-col gap-2 pt-8">
          {commandIcons.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleIconAction(item.id)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                title={item.label}
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
