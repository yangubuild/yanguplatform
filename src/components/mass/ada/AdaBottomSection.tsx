import { useState, useEffect, useCallback, useRef } from "react";
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
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ANON_CHATS_KEY = "ada_anon_chats";

interface ChatItem {
  id: string;
  title: string;
  updated_at: string;
}

interface ImageItem {
  id: string;
  storage_path: string;
  signed_url?: string;
  prompt_text?: string;
}

interface SearchResult {
  type: "chat" | "image";
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      .select("id, storage_path, metadata")
      .eq("user_id", user.id)
      .eq("kind", "image")
      .order("created_at", { ascending: false })
      .limit(4);
    if (!data || data.length === 0) {
      setImages([]);
      return;
    }

    // Generate signed URLs for each image
    const paths = data.map(d => d.storage_path);
    const { data: signedData } = await supabase.storage
      .from("ada-media")
      .createSignedUrls(paths, 3600);

    const items: ImageItem[] = data.map((d, i) => ({
      id: d.id,
      storage_path: d.storage_path,
      signed_url: signedData?.[i]?.signedUrl || d.storage_path,
      prompt_text: (d.metadata as any)?.prompt_text || (d.metadata as any)?.prompt || "",
    }));
    setImages(items);
  }, [isAuthenticated, user]);

  useEffect(() => { loadHistory(); loadImages(); }, [loadHistory, loadImages]);

  useEffect(() => {
    const handler = () => { setTimeout(() => { loadHistory(); loadImages(); }, 500); };
    window.addEventListener("ada-new-chat", handler);
    window.addEventListener("ada-chat-created", handler);
    window.addEventListener("ada-media-saved", handler);
    return () => {
      window.removeEventListener("ada-new-chat", handler);
      window.removeEventListener("ada-chat-created", handler);
      window.removeEventListener("ada-media-saved", handler);
    };
  }, [loadHistory, loadImages]);

  // Search handler
  useEffect(() => {
    if (!showSearch || !searchQuery.trim() || !isAuthenticated || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results: SearchResult[] = [];
      const q = searchQuery.trim();

      // Search chats by title
      const { data: chatResults } = await supabase
        .from("ada_chats")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .ilike("title", `%${q}%`)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (chatResults) {
        chatResults.forEach(c => results.push({ type: "chat", id: c.id, title: c.title || "Untitled" }));
      }

      // Search chat messages by content
      const { data: msgResults } = await supabase
        .from("ada_messages")
        .select("id, chat_id, content, role")
        .ilike("content", `%${q}%`)
        .limit(5);
      if (msgResults) {
        for (const msg of msgResults) {
          // Avoid duplicating chats already found
          if (!results.find(r => r.type === "chat" && r.id === msg.chat_id)) {
            results.push({
              type: "chat",
              id: msg.chat_id,
              title: msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : ""),
              subtitle: msg.role === "user" ? "Your message" : "ADA response",
            });
          }
        }
      }

      // Search images by prompt_text in metadata
      const { data: imgResults } = await supabase
        .from("ada_media")
        .select("id, storage_path, metadata")
        .eq("user_id", user.id)
        .eq("kind", "image")
        .ilike("metadata->>prompt_text", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(4);
      if (imgResults && imgResults.length > 0) {
        const imgPaths = imgResults.map(d => d.storage_path);
        const { data: signedData } = await supabase.storage
          .from("ada-media")
          .createSignedUrls(imgPaths, 3600);
        imgResults.forEach((img, i) => {
          results.push({
            type: "image",
            id: img.id,
            title: (img.metadata as any)?.prompt_text || "Generated image",
            image_url: signedData?.[i]?.signedUrl || img.storage_path,
          });
        });
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, isAuthenticated, user]);

  const handleLoadChat = (chatId: string) => {
    window.dispatchEvent(new CustomEvent("ada-load-chat", { detail: chatId }));
    setShowSearch(false);
  };

  const handleIconAction = (id: string) => {
    window.dispatchEvent(new CustomEvent("ada-command", { detail: id }));
  };

  const openSearch = () => {
    setShowSearch(true);
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <>
      <div
        className="border-t border-white/5 px-6 py-6"
        style={{ background: "rgba(5,10,7,0.6)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6">
          {/* Left: ALL CHAT */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">All Chat</h3>
              <button onClick={openSearch} className="text-white/30 hover:text-white/70 transition-colors">
                <Search className="w-4 h-4" />
              </button>
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
              {images.length === 0 && (
                <p className="text-white/20 text-xs col-span-2">No images yet</p>
              )}
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.signed_url || null)}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/20 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <img src={img.signed_url} alt={img.prompt_text || ""} className="w-full h-full object-cover" />
                </button>
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

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setShowSearch(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: "#0d1210" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search chats and images…"
                className="flex-1 bg-transparent text-white/90 text-sm placeholder:text-white/30 outline-none"
              />
              <button onClick={() => setShowSearch(false)} className="text-white/40 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {!searchQuery.trim() && (
                <p className="text-white/30 text-xs text-center py-8">Type to search chats and images</p>
              )}
              {isSearching && (
                <p className="text-white/40 text-xs text-center py-4">Searching…</p>
              )}
              {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                <p className="text-white/30 text-xs text-center py-8">No results found</p>
              )}
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    if (result.type === "chat") {
                      handleLoadChat(result.id);
                    } else if (result.image_url) {
                      setSelectedImage(result.image_url);
                      setShowSearch(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  {result.type === "chat" ? (
                    <MessageCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
                  ) : result.image_url ? (
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <img src={result.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <Image className="w-4 h-4 text-white/30 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-white/30 text-xs">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-white/20 text-[10px] uppercase tracking-wider flex-shrink-0">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt=""
            className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
