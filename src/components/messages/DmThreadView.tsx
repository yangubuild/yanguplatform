import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversation, useSendMessage } from "@/hooks/useDirectMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { renderChatContent, shareMessageExternal } from "@/lib/chatMessageRenderer";
import { Send, Loader2, MoreVertical, Reply, Forward, Trash2, Image, Video, X, Smile, Phone, VideoIcon, SmilePlus, ChevronDown, Search, Tag, Info, CheckSquare, BellOff, Heart, Flag, Ban, Megaphone, Plus, Camera, Mic, Download, Languages } from "lucide-react";
import { ChatHeaderBusinessMenu } from "@/components/messages/ChatHeaderBusinessMenu";
import { useLongPress } from "@/hooks/useLongPress";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMarkDmsRead } from "@/hooks/useUnreadMessages";
import { YanguEmojiPicker } from "@/components/emoji/YanguEmojiPicker";
import { EmojiSuggestions } from "@/components/emoji/EmojiSuggestions";
import { useEmojiInput } from "@/hooks/useEmojiInput";
import type { YanguEmoji } from "@/lib/emojiSystem";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { QuickReactionBar } from "@/components/messages/QuickReactionBar";
import { MessageReactions } from "@/components/messages/MessageReactions";
import { ChatLabelBadges, ChatLabelPicker } from "@/components/messages/ChatLabel";
import { ChatBusinessActions } from "@/components/messages/ChatBusinessActions";
import { ForwardMessageDialog } from "@/components/messages/ForwardMessageDialog";
import { useChatAudioRecorder } from "@/hooks/useChatAudioRecorder";
import { buildChatAttachmentMessage, uploadChatAttachment } from "@/lib/chatUploads";

interface Props {
  targetUserId: string;
}

export function DmThreadView({ targetUserId }: Props) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<string | null>(null);
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const markDmsRead = useMarkDmsRead();

  const { data: targetProfile } = useQuery({
    queryKey: ["dm-target-profile", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profile_view")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key, business_name")
        .eq("id", targetUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: myProfile } = useQuery({
    queryKey: ["dm-my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profile_view")
        .select("id, display_name, username, avatar_url, avatar_mode, avatar_emoji_key")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], isLoading } = useConversation(targetUserId);
  const sendMessage = useSendMessage();
  const {
    currentWord,
    handleInputChange,
    insertEmoji,
    replaceCurrentWord,
  } = useEmojiInput(message, setMessage);

  const targetName = targetProfile?.display_name || targetProfile?.username || "User";
  const targetAvatar = targetProfile ? resolveAvatarUrl(targetProfile) : null;
  const targetInitials = targetName.slice(0, 2).toUpperCase();

  const myName = myProfile?.display_name || myProfile?.username || "Me";
  const myAvatar = myProfile ? resolveAvatarUrl(myProfile) : null;
  const myInitials = myName.slice(0, 2).toUpperCase();

  // Typing indicator
  const dmChannelKey = useMemo(() => {
    if (!user?.id || !targetUserId) return null;
    const ids = [user.id, targetUserId].sort();
    return `dm-${ids[0]}-${ids[1]}`;
  }, [user?.id, targetUserId]);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(dmChannelKey, myName);

  const [isOnline] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!user || !targetUserId) return;
    void markDmsRead(targetUserId);
  }, [targetUserId, user?.id]);

  const deleteMsg = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await supabase
        .from("direct_messages")
        .delete()
        .eq("id", msgId)
        .eq("sender_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["conversation-list"] });
      toast.success("Message deleted");
    },
  });

  const deleteChat = useMutation({
    mutationFn: async () => {
      await supabase
        .from("direct_messages")
        .delete()
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user!.id})`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["conversation-list"] });
      toast.success("Conversation deleted");
      navigate("/dashboard/messages?tab=chats");
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    const prefix = replyTo ? `↩️ Re: "${replyTo.content.slice(0, 40)}"\n\n` : "";
    sendMessage.mutate({ receiverId: targetUserId, content: prefix + message.trim() });
    setMessage("");
    setReplyTo(null);
    stopTyping();
  };

  const handleForward = (content: string) => {
    setForwardingMsg(content);
  };

  const sendAttachment = async (file: File, type: "image" | "video" | "audio" | "document") => {
    if (!user) return;
    const url = await uploadChatAttachment({ userId: user.id, file, prefix: `dm-${type}` });
    sendMessage.mutate({ receiverId: targetUserId, content: buildChatAttachmentMessage(type, url, file.name) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await sendAttachment(file, type);
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await sendAttachment(file, file.type.startsWith("video/") ? "video" : "image");
    } catch {
      toast.error("Camera upload failed");
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendMessage.mutate({
          receiverId: targetUserId,
          content: `📍 Shared location\nhttps://maps.google.com/?q=${latitude},${longitude}`,
        });
      },
      () => toast.error("Unable to get your location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const renderContent = (content: string) => renderChatContent(content, navigate);

  const handleEmojiSelect = (value: string | YanguEmoji) => {
    insertEmoji(value);
    setShowEmojiPicker(false);
  };

  const { isRecording, toggleRecording } = useChatAudioRecorder({
    onRecorded: async (blob) => {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
      try {
        await sendAttachment(file, "audio");
        toast.success("Voice note sent");
      } catch {
        toast.error("Voice upload failed");
      }
    },
    onError: (message) => toast.error(message),
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 relative"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="relative">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            {targetAvatar ? (
              <img src={targetAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-muted-foreground">{targetInitials}</span>
            )}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: isOnline ? "#22c55e" : "#6b7280", borderColor: "#0F141A" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{targetName}</span>
          {targetProfile?.username && (
            <p className="text-[10px] text-muted-foreground">@{targetProfile.username}</p>
          )}
          <ChatLabelBadges targetUserId={targetUserId} />
        </div>

        {/* Call buttons */}
        <button
          onClick={() => toast.info("Voice calling not available yet")}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
          title="Voice call">
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => toast.info("Video calling not available yet")}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
          title="Video call">
          <VideoIcon className="w-4 h-4" />
        </button>

        {/* Labels icon */}
        <button
          onClick={() => setShowLabelPicker(!showLabelPicker)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
          title="Labels">
          <Tag className="w-4 h-4" />
        </button>

        {/* Business actions */}
        <ChatHeaderBusinessMenu />

        {/* Search */}
        <button
          onClick={() => toast.info("Chat search coming soon")}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
          title="Search">
          <Search className="w-4 h-4" />
        </button>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowChatMenu(!showChatMenu)}
            className="p-1.5 rounded-lg hover:opacity-80 text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </button>
          {showChatMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowChatMenu(false)} />
              <div
                className="absolute right-0 top-8 z-40 rounded-xl py-1.5 min-w-[200px] shadow-2xl"
                style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => { navigate(`/dashboard/profile/${targetUserId}`); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Info className="w-4 h-4 text-muted-foreground" /> Contact info
                </button>
                <button
                  onClick={() => { toast.info("Chat search coming soon"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Search className="w-4 h-4 text-muted-foreground" /> Search
                </button>
                <button
                  onClick={() => { toast.info("Select messages coming soon"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" /> Select messages
                </button>
                <button
                  onClick={() => { toast.info("Notifications muted"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <BellOff className="w-4 h-4 text-muted-foreground" /> Mute notifications
                </button>
                <button
                  onClick={() => { toast.info("Added to favorites"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Heart className="w-4 h-4 text-muted-foreground" /> Add to Favorites
                </button>
                <button
                  onClick={() => { setShowLabelPicker(true); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Tag className="w-4 h-4 text-muted-foreground" /> Labels
                </button>
                <button
                  onClick={() => { navigate("/dashboard/ads"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Megaphone className="w-4 h-4 text-muted-foreground" /> Advertise
                </button>
                <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                <button
                  onClick={() => { toast.info("User reported"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Flag className="w-4 h-4 text-muted-foreground" /> Report
                </button>
                <button
                  onClick={() => { toast.info("User blocked"); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 text-foreground">
                  <Ban className="w-4 h-4 text-muted-foreground" /> Block
                </button>
                <button
                  onClick={() => { deleteChat.mutate(); setShowChatMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5"
                  style={{ color: "#ef4444" }}>
                  <Trash2 className="w-4 h-4" /> Delete chat
                </button>
              </div>
            </>
          )}
        </div>

        {/* Labels picker dropdown */}
        <ChatLabelPicker targetUserId={targetUserId} open={showLabelPicker} onClose={() => setShowLabelPicker(false)} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" onClick={() => { setReactionMsgId(null); setMsgMenuId(null); }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              {targetAvatar ? (
                <img src={targetAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-sm font-bold">{targetInitials}</span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground">Start a conversation</p>
            <p className="text-xs text-center max-w-[200px] text-muted-foreground">
              Send a message to {targetName}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            const avatar = isMine ? myAvatar : targetAvatar;
            const initials = isMine ? myInitials : targetInitials;
            return (
              <DmMessageBubble
                key={msg.id}
                msg={msg}
                isMine={isMine}
                avatar={avatar}
                initials={initials}
                reactionMsgId={reactionMsgId}
                msgMenuId={msgMenuId}
                setReactionMsgId={setReactionMsgId}
                setMsgMenuId={setMsgMenuId}
                setReplyTo={setReplyTo}
                handleForward={handleForward}
                renderContent={renderContent}
                deleteMsg={deleteMsg}
                userId={user?.id}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, "video")} />
      <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden" onChange={(e) => handleFileUpload(e, "document")} />
      <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={handleCameraCapture} />

      {currentWord && (
        <div className="px-4 pb-1">
          <EmojiSuggestions
            currentWord={currentWord}
            onSelect={(value, keyword) => replaceCurrentWord(value, keyword)}
          />
        </div>
      )}

      {showEmojiPicker && (
        <div className="px-4 pb-1">
          <YanguEmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}

      <TypingIndicator names={typingUsers.map(u => u.name)} />

      {/* Reply indicator above input */}
      {replyTo && (
        <div className="shrink-0 px-3 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-1 h-8 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold" style={{ color: "#f59e0b" }}>Replying</p>
            <p className="text-xs truncate text-foreground">{replyTo.content.slice(0, 60)}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input bar — WhatsApp style: Plus, text, emoji, camera, mic */}
      <div className="shrink-0 px-3 py-2.5" style={{ borderTop: replyTo ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5">
          {/* Plus button for attachments */}
          <div className="relative shrink-0">
            <ChatBusinessActions
              onPhotos={() => fileInputRef.current?.click()}
              onCamera={() => cameraInputRef.current?.click()}
              onDocument={() => documentInputRef.current?.click()}
              onLocation={handleShareLocation}
            />
          </div>

          {/* Text input area */}
          <div
            className="flex-1 flex items-center gap-1.5 rounded-full px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-1 rounded-full hover:opacity-80 shrink-0"
              style={{ color: showEmojiPicker ? "#facc15" : "rgba(255,255,255,0.4)" }}>
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => { handleInputChange(e.target.value, e.target.selectionStart ?? undefined); startTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={replyTo ? "Type a reply..." : "Type a message..."}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>

          {/* Camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-white/10 shrink-0 text-muted-foreground"
            title="Photo">
            <Camera className="w-5 h-5" />
          </button>

          {/* Send or Mic */}
          {message.trim() ? (
            <Button variant="accent" size="icon" onClick={handleSend} className="w-9 h-9 rounded-full shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <button
              onClick={() => void toggleRecording()}
              className="p-2 rounded-full hover:bg-white/10 shrink-0 text-muted-foreground"
              title={isRecording ? "Stop recording" : "Voice message"}
              style={isRecording ? { color: "#ef4444" } : undefined}>
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Forward dialog */}
      {forwardingMsg && (
        <ForwardMessageDialog content={forwardingMsg} onClose={() => setForwardingMsg(null)} />
      )}
    </div>
  );
}

/* ── WhatsApp-style message bubble with side icons: Forward, Emoji, Dropdown ── */
function DmMessageBubble({
  msg, isMine, avatar, initials, reactionMsgId, msgMenuId,
  setReactionMsgId, setMsgMenuId, setReplyTo, handleForward, renderContent, deleteMsg, userId,
}: {
  msg: any; isMine: boolean; avatar: string | null; initials: string;
  reactionMsgId: string | null; msgMenuId: string | null;
  setReactionMsgId: (id: string | null) => void; setMsgMenuId: (id: string | null) => void;
  setReplyTo: (v: { id: string; content: string }) => void;
  handleForward: (content: string) => void;
  renderContent: (content: string) => React.ReactNode;
  deleteMsg: any; userId?: string;
}) {
  const longPress = useLongPress(() => setReactionMsgId(msg.id), 400);
  const isImage = msg.content.includes("📷") || /https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i.test(msg.content);

  return (
    <div className={`flex gap-1 sm:gap-1.5 items-end ${isMine ? "justify-end" : "justify-start"}`}>
      {!isMine && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mb-1" style={{ background: "rgba(255,255,255,0.1)" }}>
          {avatar ? <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="text-muted-foreground">{initials}</span>}
        </div>
      )}

      <div className="relative max-w-[65%] sm:max-w-[75%]">
        <div
          className="px-3 py-2 rounded-xl text-sm select-none cursor-pointer"
          style={{
            background: isMine ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: isMine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
          }}
          {...longPress}
          onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}>
          {renderContent(msg.content)}
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-[9px] text-muted-foreground">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            {/* Inline reply button */}
            <button
              onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msg.id, content: msg.content }); }}
              className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              title="Reply">
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>
        </div>
        <MessageReactions messageId={msg.id} type="dm" />
        {/* Quick reaction bar floating below */}
        {reactionMsgId === msg.id && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-30">
            <QuickReactionBar messageId={msg.id} type="dm" onClose={() => setReactionMsgId(null)} />
          </div>
        )}
        {/* Dropdown menu */}
        {msgMenuId === msg.id && (
          <div
            className="absolute top-6 right-0 z-20 rounded-xl py-1.5 min-w-[160px] shadow-xl"
            style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setReplyTo({ id: msg.id, content: msg.content }); setMsgMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5 text-foreground">
              <Reply className="w-3.5 h-3.5 text-muted-foreground" /> Reply
            </button>
            <button onClick={() => { handleForward(msg.content); setMsgMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5 text-foreground">
              <Forward className="w-3.5 h-3.5 text-muted-foreground" /> Forward
            </button>
            {isImage && (
              <button onClick={() => { toast.info("Save to device coming soon"); setMsgMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5 text-foreground">
                <Download className="w-3.5 h-3.5 text-muted-foreground" /> Save
              </button>
            )}
            <button onClick={() => { toast.info("Translation coming soon"); setMsgMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5 text-foreground">
              <Languages className="w-3.5 h-3.5 text-muted-foreground" /> Translate
            </button>
            <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            <button onClick={() => { deleteMsg.mutate(msg.id); setMsgMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-white/5" style={{ color: "#ef4444" }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Side action icons — Forward, Emoji, Dropdown (always visible) */}
      <div className="flex flex-col items-center gap-0.5 mb-1 shrink-0 min-w-[24px]">
        <button
          onClick={(e) => { e.stopPropagation(); handleForward(msg.content); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          title="Forward">
          <Forward className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          title="React">
          <SmilePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setMsgMenuId(msgMenuId === msg.id ? null : msg.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          title="More">
          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
      </div>

      {isMine && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mb-1" style={{ background: "rgba(255,255,255,0.1)" }}>
          {avatar ? <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="text-muted-foreground">{initials}</span>}
        </div>
      )}
    </div>
  );
}
