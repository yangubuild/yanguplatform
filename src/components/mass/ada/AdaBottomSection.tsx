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
  Share,
  Users,
  Pencil,
  Pin,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ImageTileActions } from "./ImageTileActions";
import { DriveConnectModal } from "./DriveConnectModal";
import { toast } from "sonner";

const ANON_CHATS_KEY = "ada_anon_chats";

interface ChatItem {
  id: string;
  title: string;
  updated_at: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

interface ImageItem {
  id: string;
  storage_path: string;
  signed_url?: string;
  prompt_text?: string;
  provider: string;
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
  const [showDriveConnect, setShowDriveConnect] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    if (isAuthenticated && user) {
      const { data } = await supabase
        .from("ada_chats")
        .select("id, title, updated_at, is_pinned, is_archived")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(8);
      setChats((data || []).map(c => ({ id: c.id, title: c.title || "Untitled", updated_at: c.updated_at, is_pinned: c.is_pinned, is_archived: c.is_archived })));
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
      .select("id, storage_path, metadata, provider")
      .eq("user_id", user.id)
      .eq("kind", "image")
      .order("created_at", { ascending: false })
      .limit(4);
    if (!data || data.length === 0) {
      setImages([]);
      return;
    }

    const uploadPaths: string[] = [];
    const generatedPaths: string[] = [];
    const bucketMap: ("upload" | "generated")[] = [];
    for (const d of data) {
      if (d.provider === "upload") {
        uploadPaths.push(d.storage_path);
        bucketMap.push("upload");
      } else {
        generatedPaths.push(d.storage_path);
        bucketMap.push("generated");
      }
    }

    const [uploadSigned, generatedSigned] = await Promise.all([
      uploadPaths.length> 0
        ? supabase.storage.from("ada-uploads").createSignedUrls(uploadPaths, 3600)
        : Promise.resolve({ data: [] as any[] }),
      generatedPaths.length> 0
        ? supabase.storage.from("ai-generated").createSignedUrls(generatedPaths, 3600)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    let upIdx = 0, genIdx = 0;
    const items: ImageItem[] = data.map((d) => {
      let signedUrl = d.storage_path;
      if (d.provider === "upload") {
        signedUrl = uploadSigned.data?.[upIdx]?.signedUrl || d.storage_path;
        upIdx++;
      } else {
        signedUrl = generatedSigned.data?.[genIdx]?.signedUrl || d.storage_path;
        genIdx++;
      }
      return {
        id: d.id,
        storage_path: d.storage_path,
        signed_url: signedUrl,
        prompt_text: (d.metadata as any)?.prompt_text || (d.metadata as any)?.prompt || "",
        provider: d.provider,
      };
    });
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

      const { data: msgResults } = await supabase
        .from("ada_messages")
        .select("id, chat_id, content, role")
        .ilike("content", `%${q}%`)
        .limit(5);
      if (msgResults) {
        for (const msg of msgResults) {
          if (!results.find(r => r.type === "chat" && r.id === msg.chat_id)) {
            results.push({
              type: "chat",
              id: msg.chat_id,
              title: msg.content.slice(0, 60) + (msg.content.length> 60 ? "…" : ""),
              subtitle: msg.role === "user" ? "Your message" : "ADA response",
            });
          }
        }
      }

      const { data: imgResults } = await supabase
        .from("ada_media")
        .select("id, storage_path, metadata, provider")
        .eq("user_id", user.id)
        .eq("kind", "image")
        .ilike("metadata->>prompt_text", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(4);
      if (imgResults && imgResults.length> 0) {
        for (const img of imgResults) {
          const bucket = img.provider === "upload" ? "ada-uploads" : "ai-generated";
          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrls([img.storage_path], 3600);
          results.push({
            type: "image",
            id: img.id,
            title: (img.metadata as any)?.prompt_text || "Generated image",
            image_url: signedData?.[0]?.signedUrl || img.storage_path,
          });
        }
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

  const handleDeleteChat = async (chatId: string) => {
    if (isAuthenticated) {
      await supabase.from("ada_messages").delete().eq("chat_id", chatId);
      await supabase.from("ada_chats").delete().eq("id", chatId);
    }
    setChats(prev => prev.filter(c => c.id !== chatId));
    toast.success("Chat deleted");
  };

  const handleRenameChat = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    const newName = prompt("Rename chat", chat?.title || "");
    if (!newName?.trim()) return;
    if (isAuthenticated) {
      await supabase.from("ada_chats").update({ title: newName.trim() }).eq("id", chatId);
    }
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newName.trim() } : c));
    toast.success("Chat renamed");
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

  const handleImageDeleted = () => {
    loadImages();
  };

  return (
    <>
      <div
        className="border-t border-white/5 px-6 py-6"
        style={{ background: "rgba(5,10,7,0.6)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6">
          {/* Left: ALL CHAT */}
          <div>
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">All Chat</h3>
              <div className="flex items-center gap-1">
                {showSearch && (
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); } }}
                    placeholder="Search…"
                    className="bg-white/5 text-muted-foreground text-xs rounded px-2 py-1 w-40 placeholder:text-muted-foreground outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none"
                  />
                )}
                <button
                  onClick={() => {
                    if (showSearch && !searchQuery.trim()) {
                      setShowSearch(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    } else if (!showSearch) {
                      openSearch();
                    }
                  }}
                  className="text-muted-foreground hover:text-muted-foreground transition-colors p-1">
                  {showSearch && !searchQuery.trim() ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {showSearch && searchQuery.trim() ? (
              <div className="space-y-1">
                {isSearching && <p className="text-muted-foreground text-xs py-2">Searching…</p>}
                {!isSearching && searchResults.length === 0 && <p className="text-muted-foreground text-xs py-2">No results</p>}
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      if (result.type === "chat") { handleLoadChat(result.id); }
                      else if (result.image_url) { setSelectedImage(result.image_url); setShowSearch(false); setSearchQuery(""); }
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors">
                    {result.type === "chat" ? (
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    ) : result.image_url ? (
                      <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                        <img src={result.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <Image className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-muted-foreground text-xs truncate flex-1">{result.title}</span>
                    <span className="text-muted-foreground text-[10px] uppercase flex-shrink-0">{result.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">30 Days</p>
                <div className="space-y-1">
                  {chats.length === 0 && (
                    <p className="text-muted-foreground text-xs">No chats yet</p>
                  )}
                  {chats.map((chat) => (
                    <div key={chat.id} className="flex items-center gap-0 group">
                      <button
                        onClick={() => handleLoadChat(chat.id)}
                        className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-white/5 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground text-xs truncate flex-1">{chat.title}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right" sideOffset={6} className="z-[9999] w-48" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/dashboard/ada?chat=${chat.id}`); toast.info("Share link copied!"); }}>
                            <Share className="w-3.5 h-3.5 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info("Group chat coming soon"); }}>
                            <Users className="w-3.5 h-3.5 mr-2" /> Start a group chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameChat(chat.id); }}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Chat pinned"); }}>
                            <Pin className="w-3.5 h-3.5 mr-2" /> Pin chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Chat archived"); }}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Center: IMAGES */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Images</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {images.length === 0 && (
                <p className="text-muted-foreground text-xs col-span-2">No images yet</p>
              )}
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/20 transition-all group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onClick={() => setSelectedImage(img.signed_url || null)}>
                  <ImageWithFallback src={img.signed_url} alt={img.prompt_text || ""} />
                  <ImageTileActions
                    imageId={img.id}
                    signedUrl={img.signed_url}
                    storagePath={img.storage_path}
                    provider={img.provider}
                    onDeleted={handleImageDeleted}
                    onDriveConnect={() => setShowDriveConnect(true)}
                  />
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
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-muted-foreground hover:bg-white/5 transition-all"
                  title={item.label}
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedImage(null)}>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
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

      {/* Google Drive connect modal */}
      <DriveConnectModal
        open={showDriveConnect}
        onOpenChange={setShowDriveConnect}
      />
    </>
  );
}

function ImageWithFallback({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
        <Image className="w-5 h-5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground text-center">Failed to load</span>
        <button
          onClick={(e) => { e.stopPropagation(); setError(false); setRetryCount(c => c + 1); }}
          className="text-[10px] text-[#F4A83D]/70 hover:text-[#F4A83D] transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <img
      key={retryCount}
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
}
