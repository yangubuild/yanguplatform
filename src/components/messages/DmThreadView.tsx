import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversation, useSendMessage } from "@/hooks/useDirectMessages";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props {
  targetUserId: string;
}

export function DmThreadView({ targetUserId }: Props) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch target user profile (the other person)
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

  // Fetch own profile (for showing own avatar on sent messages)
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

  const targetName = targetProfile?.display_name || targetProfile?.username || "User";
  const targetAvatar = targetProfile ? resolveAvatarUrl(targetProfile) : null;
  const targetInitials = targetName.slice(0, 2).toUpperCase();

  const myName = myProfile?.display_name || myProfile?.username || "Me";
  const myAvatar = myProfile ? resolveAvatarUrl(myProfile) : null;
  const myInitials = myName.slice(0, 2).toUpperCase();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ receiverId: targetUserId, content: message.trim() });
    setMessage("");
  };

  // Parse accept_invite links in message content
  const renderContent = (content: string) => {
    const acceptMatch = content.match(/\[Accept Invite\]\(([^)]+)\)/);
    if (acceptMatch) {
      const link = acceptMatch[1];
      const textBefore = content.slice(0, acceptMatch.index);
      const textAfter = content.slice((acceptMatch.index ?? 0) + acceptMatch[0].length);
      return (
        <>
          {textBefore}
          <button
            onClick={() => navigate(link)}
            className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
          >
            ✅ Accept Invite
          </button>
          {textAfter}
        </>
      );
    }
    return content;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          {targetAvatar ? (
            <img src={targetAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="text-white/60">{targetInitials}</span>
          )}
        </div>
        <div>
          <span className="text-sm font-semibold text-white">{targetName}</span>
          {targetProfile?.username && (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              @{targetProfile.username}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-white mb-1">Start a conversation</p>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Send a message to {targetName}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            const avatar = isMine ? myAvatar : targetAvatar;
            const initials = isMine ? myInitials : targetInitials;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {/* Other person's avatar on left */}
                {!isMine && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mt-1"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {avatar ? (
                      <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-white/60">{initials}</span>
                    )}
                  </div>
                )}
                <div
                  className="max-w-[75%] px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: isMine ? "rgba(181,98,42,0.3)" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                  }}
                >
                  {renderContent(msg.content)}
                  <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {/* Own avatar on right */}
                {isMine && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 mt-1"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {avatar ? (
                      <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="text-white/60">{initials}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
