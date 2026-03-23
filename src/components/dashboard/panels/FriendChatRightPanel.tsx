import { useState, useRef, useEffect } from "react";
import { Send, Circle, Reply, ChevronDown, SmilePlus } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import type { FriendUser } from "../FriendProfileView";
import { useConversation, useSendMessage } from "@/hooks/useDirectMessages";
import { QuickReactionBar } from "@/components/messages/QuickReactionBar";
import { MessageReactions } from "@/components/messages/MessageReactions";
import { useLongPress } from "@/hooks/useLongPress";

interface Props {
  friend: FriendUser;
}

export function FriendChatRightPanel({ friend }: Props) {
  const [message, setMessage] = useState("");
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const name = friend.display_name || friend.username || "Unnamed";
  const resolvedAvatar = resolveAvatarUrl(friend);
  const initials = name.slice(0, 2).toUpperCase();
  const isOnline = false;
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useConversation(friend.id);
  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    const prefix = replyTo ? `↩️ Re: "${replyTo.content.slice(0, 40)}"\n\n` : "";
    sendMessage.mutate({ receiverId: friend.id, content: prefix + message.trim() });
    setMessage("");
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            {resolvedAvatar ? <img src={resolvedAvatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="text-muted-foreground">{initials}</span>}
          </div>
          <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3" style={{ color: isOnline ? "#22c55e" : "#6b7280", fill: isOnline ? "#22c55e" : "#6b7280", stroke: "#111820", strokeWidth: 2 }} />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <p className="text-[10px]" style={{ color: isOnline ? "#22c55e" : "rgba(255,255,255,0.35)" }}>{isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Reply className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs truncate flex-1 text-muted-foreground">Replying to: {replyTo.content.slice(0, 60)}</span>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground">✕</button>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" onClick={() => setReactionMsgId(null)}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-foreground mb-1">Start a conversation</p>
            <p className="text-xs text-center text-muted-foreground">Send a message to {name}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id !== friend.id;
            return <FriendChatBubble key={msg.id} msg={msg} isMine={isMine} reactionMsgId={reactionMsgId} setReactionMsgId={setReactionMsgId} setReplyTo={setReplyTo} />;
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={replyTo ? "Type a reply..." : "Type a message..."}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={handleSend} disabled={!message.trim()} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: message.trim() ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)" }}>
            <Send className="w-3.5 h-3.5" style={{ color: message.trim() ? "#fff" : "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendChatBubble({ msg, isMine, reactionMsgId, setReactionMsgId, setReplyTo }: {
  msg: any; isMine: boolean; reactionMsgId: string | null;
  setReactionMsgId: (id: string | null) => void;
  setReplyTo: (v: { id: string; content: string }) => void;
}) {
  const longPress = useLongPress(() => setReactionMsgId(msg.id), 400);

  return (
    <div className={`flex gap-2 items-end ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[75%]">
        <div
          className="px-3 py-2 rounded-xl text-sm select-none cursor-pointer"
          style={{
            background: isMine ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: isMine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
          }}
          {...longPress}
          onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}>
          {msg.content}
          <p className="text-[9px] mt-1 text-muted-foreground">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <MessageReactions messageId={msg.id} type="dm" />
        {/* Reaction bar below bubble */}
        {reactionMsgId === msg.id && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-30">
            <QuickReactionBar messageId={msg.id} type="dm" onClose={() => setReactionMsgId(null)} />
          </div>
        )}
      </div>

      {/* Side icons — always visible */}
      <div className="flex items-center gap-0.5 mb-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <SmilePlus className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setReactionMsgId(reactionMsgId === msg.id ? null : msg.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
      </div>
    </div>
  );
}
