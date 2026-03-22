import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Info, Trophy, X, Smile, ImagePlus, Video, MapPin, Hash, AtSign, Send, Loader2, ShoppingCart, Tag, Reply, CornerDownRight } from "lucide-react";
import { useGlobalChatMessages, useSendGlobalMessage, useToggleGlobalReaction, GlobalChatMessage } from "@/hooks/useGlobalChat";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { uploadPostMedia } from "@/hooks/usePosts";
import { toast } from "sonner";
import { buildChatPresenceMap } from "@/lib/chatPresence";
import { YanguEmojiPicker } from "@/components/emoji/YanguEmojiPicker";
import { EmojiSuggestions } from "@/components/emoji/EmojiSuggestions";
import { EmojiRenderer } from "@/components/emoji/EmojiRenderer";
import { useEmojiInput } from "@/hooks/useEmojiInput";
import type { YanguEmoji } from "@/lib/emojiSystem";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "👏"];

export function MessagesGlobalChatTab() {
  const { user, profile } = useAuth();
  const { data: messages = [], isLoading } = useGlobalChatMessages();
  const sendMessage = useSendGlobalMessage();
  const toggleReaction = useToggleGlobalReaction();
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<GlobalChatMessage | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [showComposerEmoji, setShowComposerEmoji] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Emoji input hook for type-to-suggest
  const {
    currentWord,
    handleInputChange,
    insertEmoji,
    replaceCurrentWord,
  } = useEmojiInput(message, setMessage);

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
      const cleanContent = message
        .replace(/\[buynow\]/g, "").replace(/\[sellnow\]/g, "").replace(/\[location:[^\]]+\]/g, "")
        .trim() || (mediaUrl ? "📷" : "");

      await sendMessage.mutateAsync({ content: cleanContent, mediaUrl, mediaType, metadata, replyTo: replyTo?.id });
      setMessage("");
      setReplyTo(null);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaFile(null);
      setMediaPreview(null);
    } catch { toast.error("Failed to send"); } finally { setUploading(false); }
  };

  const handleReaction = (msgId: string, emoji: string) => {
    toggleReaction.mutate({ messageId: msgId, emoji });
    setEmojiPickerMsgId(null);
  };

  const handleEmojiSelect = (value: string | YanguEmoji) => {
    insertEmoji(value);
    setShowComposerEmoji(false);
  };

  const insertTag = (tag: string) => setMessage(prev => prev + tag);
  const presenceMap = useMemo(() => buildChatPresenceMap(messages, user?.id), [messages, user?.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <button className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Global <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:opacity-80 text-muted-foreground"><Info className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "#facc15" }}><Trophy className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm font-semibold text-foreground">Welcome to Global Chat</p>
            <p className="text-xs mt-1 text-muted-foreground">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              presenceMap={presenceMap}
              currentUserId={user?.id}
              onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
              onReaction={(emoji) => handleReaction(msg.id, emoji)}
              emojiPickerOpen={emojiPickerMsgId === msg.id}
              onToggleEmojiPicker={() => setEmojiPickerMsgId(prev => prev === msg.id ? null : msg.id)}
            />
          ))
        )}
      </div>

      {/* Reply banner */}
      {replyTo && (
        <div className="px-4 py-1.5 flex items-center gap-2 shrink-0" style={{ background: "rgba(255,255,255,0.04)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <CornerDownRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold" style={{ color: "#60a5fa" }}>{replyTo.author_name}</span>
            <p className="text-[10px] truncate text-muted-foreground">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-0.5"><X className="w-3 h-3 text-muted-foreground" /></button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 pb-1">
          <div className="relative inline-block">
            {mediaFile?.type.startsWith("video")
              ? <video src={mediaPreview} className="h-14 rounded-lg" />
              : <img src={mediaPreview} alt="" className="h-14 rounded-lg object-cover" />}
            <button onClick={() => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); setMediaFile(null); setMediaPreview(null); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center"><X className="w-2.5 h-2.5 text-foreground" /></button>
          </div>
        </div>
      )}

      {/* Type-to-suggest emoji suggestions */}
      {currentWord && (
        <div className="px-4 pb-1">
          <EmojiSuggestions
            currentWord={currentWord}
            onSelect={(value, keyword) => replaceCurrentWord(value, keyword)}
          />
        </div>
      )}

      {/* Composer emoji picker — now uses YanguEmojiPicker */}
      {showComposerEmoji && (
        <div className="px-4 pb-1">
          <YanguEmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowComposerEmoji(false)}
          />
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart ?? undefined)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={replyTo ? `Reply to ${replyTo.author_name}...` : "Your message..."}
              className="flex-1 bg-transparent text-sm outline-none text-muted-foreground"
            />
            <button onClick={handleSend} disabled={(!message.trim() && !mediaFile) || uploading}
              className="p-1.5 rounded-lg transition-colors" style={{ background: (message.trim() || mediaFile) ? "#22c55e" : "rgba(255,255,255,0.08)" }}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" /> : <Send className="w-3.5 h-3.5 text-foreground" />}
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1.5 -mb-0.5">
            <input ref={imageRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }} />
            <button onClick={() => imageRef.current?.click()} className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="Image"><ImagePlus className="w-3.5 h-3.5" /></button>
            <input ref={videoRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }} />
            <button onClick={() => videoRef.current?.click()} className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="Video"><Video className="w-3.5 h-3.5" /></button>
            <button className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="GIF" onClick={() => imageRef.current?.click()}><span className="text-[9px] font-bold">GIF</span></button>
            <button onClick={() => setShowComposerEmoji(p => !p)} className="p-1 rounded hover:bg-white/5" style={{ color: showComposerEmoji ? "#facc15" : "rgba(255,255,255,0.35)" }} title="Emoji"><Smile className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertTag("[location:📍 My Location]")} className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="Location"><MapPin className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertTag("@")} className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="Tag user"><AtSign className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertTag("#")} className="p-1 rounded hover:bg-white/5 text-muted-foreground" title="Hashtag"><Hash className="w-3.5 h-3.5" /></button>
            <div className="flex-1" />
            <button onClick={() => insertTag(" [buynow]")} className="p-1 rounded hover:bg-white/5" style={{ color: "rgba(16,185,129,0.6)" }} title="Buy Now"><ShoppingCart className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertTag(" [sellnow]")} className="p-1 rounded hover:bg-white/5" style={{ color: "rgba(251,146,60,0.6)" }} title="Sell Now"><Tag className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Message bubble with reactions + reply ── */
function MessageBubble({ msg, presenceMap, currentUserId, onReply, onReaction, emojiPickerOpen, onToggleEmojiPicker }: {
  msg: GlobalChatMessage;
  presenceMap: Record<string, string>;
  currentUserId?: string;
  onReply: () => void;
  onReaction: (emoji: string) => void;
  emojiPickerOpen: boolean;
  onToggleEmojiPicker: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); }}>
      <div className="flex items-start gap-3 relative">
        {/* Avatar */}
        <div className="relative w-8 h-8 shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            {msg.author_avatar ? (
              <img src={msg.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold text-muted-foreground">{(msg.author_name || "U").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border" style={{ background: presenceMap[msg.user_id] === "live" ? "#22c55e" : "#6b7280", borderColor: "#111820" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{msg.author_name}</span>
            {msg.author_username && <span className="text-[10px] text-muted-foreground">@{msg.author_username}</span>}
            <span className="text-[10px] text-muted-foreground">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Reply reference */}
          {msg.replyMessage && (
            <div className="flex items-center gap-1.5 mt-0.5 mb-0.5 pl-2" style={{ borderLeft: "2px solid rgba(96,165,250,0.4)" }}>
              <span className="text-[10px] font-semibold" style={{ color: "#60a5fa" }}>{msg.replyMessage.author_name}</span>
              <span className="text-[10px] truncate max-w-[180px] text-muted-foreground">{msg.replyMessage.content}</span>
            </div>
          )}

          <div className="mt-1 inline-block rounded-xl px-3 py-2 text-xs max-w-[280px]" style={{ background: "rgba(255,255,255,0.07)", }}>
            <ChatContent content={msg.content} metadata={msg.metadata} />
          </div>

          {msg.media_url && (
            <div className="mt-1">
              {msg.media_type === "video" ? (
                <video src={msg.media_url} controls className="rounded-lg max-h-40 max-w-[240px]" />
              ) : (
                <img src={msg.media_url} alt="" className="rounded-lg max-h-40 max-w-[240px] object-cover" />
              )}
            </div>
          )}

          {/* Existing reactions */}
          {msg.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {msg.reactions.map(r => {
                const isMine = currentUserId && r.userIds.includes(currentUserId);
                return (
                  <button key={r.emoji} onClick={() => onReaction(r.emoji)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] transition-colors"
                    style={{
                      background: isMine ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMine ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <span>{r.emoji}</span>
                    <span style={{ color: isMine ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover actions: reply + react */}
        {hovered && (
          <div className="absolute -top-2 right-0 flex items-center gap-0.5 rounded-lg px-1 py-0.5" style={{ background: "rgba(17,24,32,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={onReply} className="p-1 rounded hover:bg-white/10" title="Reply"><Reply className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <button onClick={onToggleEmojiPicker} className="p-1 rounded hover:bg-white/10" title="React"><Smile className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
        )}
      </div>

      {/* Quick emoji picker for this message */}
      {emojiPickerOpen && (
        <div className="ml-11 mt-1 flex gap-1 p-1.5 rounded-lg w-fit" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {QUICK_EMOJIS.map(e => (
            <button key={e} onClick={() => onReaction(e)} className="text-base hover:scale-125 transition-transform px-0.5">{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Render message content with custom emoji support ── */
function ChatContent({ content, metadata }: { content: string; metadata?: any }) {
  const parts = content.split(/(@\w+|#\w+)/g);
  return (
    <div>
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("@")) return <span key={i} className="font-semibold" style={{ color: "#60a5fa" }}>{part}</span>;
          if (part.startsWith("#")) return <span key={i} className="font-semibold" style={{ color: "#a78bfa" }}>{part}</span>;
          // Render custom emojis via :keyword: shortcodes
          return <EmojiRenderer key={i} text={part} />;
        })}
      </span>
      {metadata?.location && (
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <MapPin className="w-3 h-3" /> <span className="text-[10px]">{metadata.location}</span>
        </div>
      )}
      {metadata?.cta === "buynow" && (
        <button className="mt-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>Buy Now</button>
      )}
      {metadata?.cta === "sellnow" && (
        <button className="mt-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" }}>Sell Now</button>
      )}
    </div>
  );
}
