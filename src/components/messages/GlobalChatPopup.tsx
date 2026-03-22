import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X, Smile, Send, ImagePlus, Video, MapPin, AtSign, Hash, ShoppingCart, Tag, Loader2, Trophy } from "lucide-react";
import { useGlobalChatMessages, useSendGlobalMessage } from "@/hooks/useGlobalChat";
import { useAuth } from "@/hooks/useAuth";
import { uploadPostMedia } from "@/hooks/usePosts";
import { toast } from "sonner";
import { buildChatPresenceMap } from "@/lib/chatPresence";

interface GlobalChatPopupProps {
  onClose: () => void;
}

export function GlobalChatPopup({ onClose }: GlobalChatPopupProps) {
  const { user, profile } = useAuth();
  const { data: messages = [], isLoading } = useGlobalChatMessages();
  const sendMessage = useSendGlobalMessage();
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const feedRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const presenceMap = useMemo(() => buildChatPresenceMap(messages, user?.id), [messages, user?.id]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const handleFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const f = files[0];
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const handleSend = async () => {
    if (!message.trim() && !mediaFile) return;
    if (!user) return;
    setUploading(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType = "text";
      if (mediaFile) {
        mediaUrl = await uploadPostMedia(user.id, mediaFile);
        mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
      }
      const metadata: any = {};
      if (message.includes("[buynow]")) metadata.cta = "buynow";
      if (message.includes("[sellnow]")) metadata.cta = "sellnow";
      if (message.includes("[location:")) {
        const match = message.match(/\[location:([^\]]+)\]/);
        if (match) metadata.location = match[1];
      }
      const cleanContent = message.replace(/\[buynow\]/g, "").replace(/\[sellnow\]/g, "").replace(/\[location:[^\]]+\]/g, "").trim() || (mediaUrl ? "📷" : "");
      await sendMessage.mutateAsync({ content: cleanContent, mediaUrl, mediaType, metadata });
      setMessage("");
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaFile(null);
      setMediaPreview(null);
    } catch { toast.error("Failed to send"); } finally { setUploading(false); }
  };

  const insertTag = (tag: string) => setMessage(prev => prev + tag);

  return (
    <div
      className="fixed z-50 flex flex-col"
      style={{
        top: 64, right: 16, width: 380,
        height: "calc(100vh - 80px)", maxHeight: 600,
        background: "#1a2026",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          Global <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-md" style={{ color: "#facc15" }} title="Weekly and monthly product awards">
            <Trophy className="w-4 h-4" />
          </button>
          <button onClick={() => { onClose(); navigate("/dashboard/messages?tab=global"); }}
            className="text-[10px] font-medium px-2 py-1 rounded"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            Open in Messages
          </button>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-xs font-semibold text-foreground">No messages yet</p>
            <p className="text-[10px] mt-1 text-muted-foreground">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="relative w-7 h-7 shrink-0">
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                  {msg.author_avatar ? (
                    <img src={msg.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-bold text-muted-foreground">{(msg.author_name || "U").slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border"
                  style={{
                    background: presenceMap[msg.user_id] === "live" ? "#22c55e" : "#6b7280",
                    borderColor: "#1a2026",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground truncate">{msg.author_name}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="mt-0.5 inline-block rounded-xl px-2.5 py-1.5 text-[11px]" style={{ background: "rgba(255,255,255,0.07)", }}>
                  {msg.content}
                </div>
                {msg.media_url && (
                  <div className="mt-1">
                    {msg.media_type === "video"
                      ? <video src={msg.media_url} controls className="rounded-lg max-h-32 max-w-[200px]" />
                      : <img src={msg.media_url} alt="" className="rounded-lg max-h-32 max-w-[200px] object-cover" />}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 pb-1">
          <div className="relative inline-block">
            {mediaFile?.type.startsWith("video")
              ? <video src={mediaPreview} className="h-12 rounded-lg" />
              : <img src={mediaPreview} alt="" className="h-12 rounded-lg object-cover" />}
            <button onClick={() => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); setMediaFile(null); setMediaPreview(null); }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-black/70 flex items-center justify-center">
              <X className="w-2 h-2 text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Your message..." className="flex-1 bg-transparent text-xs outline-none text-muted-foreground" />
            <button onClick={handleSend} disabled={(!message.trim() && !mediaFile) || uploading}
              className="p-1.5 rounded-lg" style={{ background: (message.trim() || mediaFile) ? "#22c55e" : "rgba(255,255,255,0.08)" }}>
              {uploading ? <Loader2 className="w-3 h-3 text-foreground animate-spin" /> : <Send className="w-3 h-3 text-foreground" />}
            </button>
          </div>
          <div className="flex items-center gap-0.5 mt-1 -mb-0.5">
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }} />
            <button onClick={() => imageRef.current?.click()} className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><ImagePlus className="w-3 h-3" /></button>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }} />
            <button onClick={() => videoRef.current?.click()} className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><Video className="w-3 h-3" /></button>
            <button className="p-0.5 rounded hover:bg-white/5 text-muted-foreground" onClick={() => imageRef.current?.click()}><span className="text-[8px] font-bold">GIF</span></button>
            <button className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><Smile className="w-3 h-3" /></button>
            <button onClick={() => insertTag("[location:📍 My Location]")} className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><MapPin className="w-3 h-3" /></button>
            <button onClick={() => insertTag("@")} className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><AtSign className="w-3 h-3" /></button>
            <button onClick={() => insertTag("#")} className="p-0.5 rounded hover:bg-white/5 text-muted-foreground"><Hash className="w-3 h-3" /></button>
            <div className="flex-1" />
            <button onClick={() => insertTag(" [buynow]")} className="p-0.5 rounded hover:bg-white/5" style={{ color: "rgba(16,185,129,0.5)" }}><ShoppingCart className="w-3 h-3" /></button>
            <button onClick={() => insertTag(" [sellnow]")} className="p-0.5 rounded hover:bg-white/5" style={{ color: "rgba(251,146,60,0.5)" }}><Tag className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
