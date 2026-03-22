import { useState, useRef, useEffect } from "react";
import { useGroupMessages, useSendGroupMessage, useGroupMembers, useLeaveGroup, useRemoveGroupMember, useAddGroupMember, type ChatGroup } from "@/hooks/useGroupChats";
import { renderChatContent, shareMessageExternal } from "@/lib/chatMessageRenderer";
import { Send, Loader2, MoreVertical, Reply, Share2, Trash2, Users, LogOut, UserPlus, Image, Video, X, Smile } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { YanguEmojiPicker } from "@/components/emoji/YanguEmojiPicker";
import { EmojiSuggestions } from "@/components/emoji/EmojiSuggestions";
import { useEmojiInput } from "@/hooks/useEmojiInput";
import type { YanguEmoji } from "@/lib/emojiSystem";

interface Props {
  group: ChatGroup;
  onBack?: () => void;
}

export function GroupChatThreadView({ group, onBack }: Props) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useGroupMessages(group.id);
  const sendMessage = useSendGroupMessage();
  const { data: members = [] } = useGroupMembers(group.id);
  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveGroupMember();
  const addMember = useAddGroupMember();
  const {
    currentWord,
    handleInputChange,
    insertEmoji,
    replaceCurrentWord,
  } = useEmojiInput(message, setMessage);

  const myMembership = members.find(m => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin" || myMembership?.role === "owner";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !user) return;
    if (!myMembership) {
      toast.error("You are not a member of this group");
      return;
    }
    const prefix = replyTo ? `↩️ Re: "${replyTo.content.slice(0, 40)}"\n\n` : "";
    sendMessage.mutate({ groupId: group.id, content: prefix + trimmed });
    setMessage("");
    setReplyTo(null);
  };

  const handleLeave = () => {
    if (myMembership?.role === "owner" && members.length > 1) {
      toast.error("Transfer ownership before leaving");
      return;
    }
    leaveGroup.mutate(group.id, {
      onSuccess: () => {
        toast.success("Left group");
        onBack?.();
      },
    });
    setShowGroupMenu(false);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ groupId: group.id, userId }, {
      onSuccess: () => toast.success("Member removed"),
    });
  };

  const handleSearchUsers = async (q: string) => {
    setAddUserSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(10);
    const memberIds = new Set(members.map(m => m.user_id));
    setSearchResults((data ?? []).filter(p => !memberIds.has(p.id) && p.id !== user?.id));
  };

  const handleAddMember = (userId: string) => {
    addMember.mutate({ groupId: group.id, userId }, {
      onSuccess: () => { toast.success("Member added"); setAddUserSearch(""); setSearchResults([]); },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/group-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file);
    if (uploadError) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
    const emoji = type === "image" ? "📷" : "🎥";
    sendMessage.mutate({ groupId: group.id, content: `${emoji} ${urlData.publicUrl}` });
  };

  const handleDeleteMsg = async (msgId: string) => {
    const { error } = await supabase
      .from("chat_group_messages")
      .delete()
      .eq("id", msgId)
      .eq("user_id", user!.id);
    if (error) { toast.error("Failed to delete"); return; }
    qc.invalidateQueries({ queryKey: ["group-messages", group.id] });
    toast.success("Message deleted");
    setMsgMenuId(null);
  };

  const renderContent = (content: string) => renderChatContent(content, navigate);

  const handleEmojiSelect = (value: string | YanguEmoji) => {
    insertEmoji(value);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {onBack && (
          <button onClick={onBack} className="text-white/50 hover:text-white/80 mr-1">←</button>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: "rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.9)" }}>
          {group.avatar_url ? (
            <img src={group.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            group.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white truncate block">{group.name}</span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={() => setShowMembers(!showMembers)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Users className="w-4 h-4" />
        </button>
        <div className="relative">
          <button onClick={() => setShowGroupMenu(!showGroupMenu)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)" }}>
            <MoreVertical className="w-4 h-4" />
          </button>
          {showGroupMenu && (
            <div className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[160px]" style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={handleLeave} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80" style={{ color: "#ef4444" }}>
                <LogOut className="w-3.5 h-3.5" /> Leave Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members panel (slide) */}
      {showMembers && (
        <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Members ({members.length})</span>
            <button onClick={() => setShowMembers(false)}><X className="w-3.5 h-3.5 text-white/40" /></button>
          </div>
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                {m.avatar ? <img src={m.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : (m.display_name?.slice(0, 2).toUpperCase() || "?")}
              </div>
              <span className="text-xs text-white flex-1 truncate">{m.display_name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{m.role}</span>
              {isAdmin && m.user_id !== user?.id && (
                <button onClick={() => handleRemoveMember(m.user_id)} className="text-[9px] hover:opacity-80" style={{ color: "#ef4444" }}>Remove</button>
              )}
            </div>
          ))}
          {/* Add member (admin only) */}
          {isAdmin && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-white/40" />
                <input
                  value={addUserSearch}
                  onChange={e => handleSearchUsers(e.target.value)}
                  placeholder="Add member..."
                  className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                />
              </div>
              {searchResults.map(p => (
                <button key={p.id} onClick={() => handleAddMember(p.id)} className="w-full flex items-center gap-2 py-1.5 px-1 text-xs text-white hover:opacity-80">
                  <span className="truncate">{p.display_name || p.username}</span>
                  <span className="ml-auto text-[9px]" style={{ color: "#4ade80" }}>+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Reply className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          <span className="text-xs truncate flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Replying to: {replyTo.content.slice(0, 60)}
          </span>
          <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-white mb-1">No messages yet</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Start the conversation in {group.name}
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`group flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mt-1" style={{ background: "rgba(255,255,255,0.1)" }}>
                    {msg.author_avatar ? <img src={msg.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="text-white/60">{(msg.author_name || "?").slice(0, 2).toUpperCase()}</span>}
                  </div>
                )}
                <div className="relative max-w-[75%]">
                  {!isMine && (
                    <p className="text-[10px] mb-0.5 font-medium" style={{ color: "rgba(96,165,250,0.8)" }}>{msg.author_name}</p>
                  )}
                  <div className="px-3 py-2 rounded-xl text-sm" style={{ background: isMine ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)", color: "#fff" }}>
                    {renderContent(msg.content)}
                    <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setMsgMenuId(msgMenuId === msg.id ? null : msg.id)} className="p-1 rounded" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <MoreVertical className="w-3 h-3" style={{ color: "rgba(255,255,255,0.6)" }} />
                    </button>
                  </div>
                  {msgMenuId === msg.id && (
                    <div className="absolute top-6 right-0 z-20 rounded-lg py-1 min-w-[140px]" style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <button onClick={() => { setReplyTo({ id: msg.id, content: msg.content }); setMsgMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80 text-white">
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button onClick={() => { shareMessageExternal(msg.content); setMsgMenuId(null); toast.success("Shared"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80 text-white">
                        <Share2 className="w-3 h-3" /> Share
                      </button>
                      {isMine && (
                        <button onClick={() => handleDeleteMsg(msg.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:opacity-80" style={{ color: "#ef4444" }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileUpload(e, "video")} />

      {currentWord && myMembership && (
        <div className="px-4 pb-1">
          <EmojiSuggestions
            currentWord={currentWord}
            onSelect={(value, keyword) => replaceCurrentWord(value, keyword)}
          />
        </div>
      )}

      {showEmojiPicker && myMembership && (
        <div className="px-4 pb-1">
          <YanguEmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}

      {/* Input */}
      {myMembership ? (
        <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded hover:opacity-80 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Image className="w-4 h-4" />
            </button>
            <button onClick={() => videoInputRef.current?.click()} className="p-1 rounded hover:opacity-80 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Video className="w-4 h-4" />
            </button>
            <button onClick={() => setShowEmojiPicker((prev) => !prev)} className="p-1 rounded hover:opacity-80 shrink-0" style={{ color: showEmojiPicker ? "#facc15" : "rgba(255,255,255,0.4)" }}>
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={message}
              onChange={e => handleInputChange(e.target.value, e.target.selectionStart ?? undefined)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={replyTo ? "Type a reply..." : "Type a message..."}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
            />
            <button onClick={handleSend} disabled={!message.trim()} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: message.trim() ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: message.trim() ? "#fff" : "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>You are not a member of this group</p>
        </div>
      )}
    </div>
  );
}
