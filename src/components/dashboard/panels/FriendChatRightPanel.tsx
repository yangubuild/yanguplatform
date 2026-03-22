import { useState, useRef, useEffect } from "react";
import { Send, Circle } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import type { FriendUser } from "../FriendProfileView";
import { useConversation, useSendMessage } from "@/hooks/useDirectMessages";

interface Props {
  friend: FriendUser;
}

export function FriendChatRightPanel({ friend }: Props) {
  const [message, setMessage] = useState("");
  const name = friend.display_name || friend.username || "Unnamed";
  const resolvedAvatar = resolveAvatarUrl(friend);
  const initials = name.slice(0, 2).toUpperCase();
  const isOnline = false; // Presence deferred
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useConversation(friend.id);
  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ receiverId: friend.id, content: message.trim() });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      {/* Header with online status */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-white/60">{initials}</span>
            )}
          </div>
          <Circle
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3"
            style={{
              color: isOnline ? "#22c55e" : "#6b7280",
              fill: isOnline ? "#22c55e" : "#6b7280",
              stroke: "#111820",
              strokeWidth: 2,
            }}
          />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">{name}</span>
          <p className="text-[10px]" style={{ color: isOnline ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-white mb-1">Start a conversation</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Send a message to {name}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id !== friend.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: isMine ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: isMine ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
                    color: "#fff",
                  }}
                >
                  {msg.content}
                  <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: message.trim() ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
            }}
          >
            <Send className="w-3.5 h-3.5" style={{ color: message.trim() ? "#fff" : "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
