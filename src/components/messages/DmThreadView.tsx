import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversation, useSendMessage } from "@/hooks/useDirectMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { renderChatContent, shareMessageExternal } from "@/lib/chatMessageRenderer";
import { Send, Loader2, MoreVertical, Reply, Forward, Trash2, Image, Video, X, Share2, Smile } from "lucide-react";
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

interface Props {
  targetUserId: string;
}

export function DmThreadView({ targetUserId }: Props) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<string | null>(null);
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const markDmsRead = useMarkDmsRead();

  const { data: targetProfile } = useQuery({
    queryKey: ["dm-target-profile", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
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
        .from("profiles")
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

  // Online/offline presence (UI wired, backend deferred - uses last_seen heuristic)
  const [isOnline] = useState(false); // Deferred: no real presence backend yet

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!user || !targetUserId) return;
    void markDmsRead(targetUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, user?.id]);

  // Delete single message
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

  // Delete entire conversation
  const deleteChat = useMutation({
    mutationFn: async () => {
      // Delete messages where current user is sender
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
    toast.info("Select a user from the sidebar to forward this message");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/dm-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(path, file);

    if (uploadError) {
      toast.error("Upload failed");
      return;
    }

    const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
    const mediaUrl = urlData.publicUrl;
    const emoji = type === "image" ? "📷" : "🎥";
    sendMessage.mutate({ receiverId: targetUserId, content: `${emoji} ${mediaUrl}` });
  };

  const renderContent = (content: string) => renderChatContent(content, navigate);

  const handleEmojiSelect = (value: string | YanguEmoji) => {
    insertEmoji(value);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            {targetAvatar ? (
              <img src={targetAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-muted-foreground">{targetInitials}</span>
            )}
          </div>
          {/* Online/offline indicator */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: isOnline ? "#22c55e" : "#6b7280",
              borderColor: "#0F141A" }}
          />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-foreground">{targetName}</span>
          {targetProfile?.username && (
            <p className="text-[10px] text-muted-foreground">
              @{targetProfile.username}
            </p>
          )}
        </div>
        {/* Chat-level menu */}
        <div className="relative">
          <button
            onClick={() => setShowChatMenu(!showChatMenu)}
            className="p-1.5 rounded-lg hover:opacity-80 text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </button>
          {showChatMenu && (
            <div
              className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[160px]"
              style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => { deleteChat.mutate(); setShowChatMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80"
                style={{ color: "#ef4444" }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Reply className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs truncate flex-1 text-muted-foreground">
            Replying to: {replyTo.content.slice(0, 60)}
          </span>
          <button onClick={() => setReplyTo(null)}>
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
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
              <div key={msg.id} className={`group flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mt-1"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
                    {avatar ? (
                      <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground">{initials}</span>
                    )}
                  </div>
                )}
                <div className="relative max-w-[75%]">
                  <div
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{
                       background: isMine ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
                       backdropFilter: "blur(16px)",
                       WebkitBackdropFilter: "blur(16px)",
                       border: isMine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)" }}>
                    {renderContent(msg.content)}
                    <p className="text-[9px] mt-1 text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {/* Message-level actions (hover) */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setMsgMenuId(msgMenuId === msg.id ? null : msg.id)}
                      className="p-1 rounded"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <MoreVertical className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  {msgMenuId === msg.id && (
                    <div
                      className="absolute top-6 right-0 z-20 rounded-lg py-1 min-w-[140px]"
                      style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <button
                        onClick={() => { setReplyTo({ id: msg.id, content: msg.content }); setMsgMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80 text-foreground">
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button
                        onClick={() => { handleForward(msg.content); setMsgMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80 text-foreground">
                        <Forward className="w-3 h-3" /> Forward
                      </button>
                      <button
                        onClick={() => { shareMessageExternal(msg.content); setMsgMenuId(null); toast.success("Shared"); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80 text-foreground">
                        <Share2 className="w-3 h-3" /> Share
                      </button>
                      {isMine && (
                        <button
                          onClick={() => { deleteMsg.mutate(msg.id); setMsgMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80"
                          style={{ color: "#ef4444" }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isMine && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mt-1"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
                    {avatar ? (
                      <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground">{initials}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, "video")} />

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

      {/* Input */}
      <div className="shrink-0 px-3 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:opacity-80 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center text-muted-foreground">
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="p-1.5 rounded hover:opacity-80 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center text-muted-foreground">
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-1.5 rounded hover:opacity-80 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
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
          <Button variant={message.trim() ? "accent" : "outline"} size="icon" onClick={handleSend} disabled={!message.trim()} className="w-8 h-8 rounded-lg shrink-0">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
