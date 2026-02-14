import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X, Smile, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  username: string;
  level: string;
  text: string;
  time: string;
  avatarColor: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: "1", username: "SKY2KING", level: "V40", text: "Good luck", time: "16:59", avatarColor: "#8b5cf6" },
  { id: "2", username: "Enjoy_BC367", level: "V4", text: "Every win pushes you closer to winning even more, the journey cannot be stopped. Keep winning..", time: "16:59", avatarColor: "#ec4899" },
  { id: "3", username: "Berger_", level: "V9", text: "Spin & win", time: "16:59", avatarColor: "#f43f5e" },
  { id: "4", username: "Wvjxqexsbtcc", level: "V22", text: "@Barki_BCGAME that's good", time: "16:59", avatarColor: "#14b8a6" },
  { id: "5", username: "Ayza_naz", level: "V7", text: "Everyone", time: "16:59", avatarColor: "#f97316" },
  { id: "6", username: "MSHAN_011", level: "V15", text: "Wow big win 🥳👏", time: "16:59", avatarColor: "#e44d8a" },
  { id: "7", username: "PLAY_BC_GOLD", level: "V4", text: "Sabko best luck! 🍀", time: "16:59", avatarColor: "#3b82f6" },
  { id: "8", username: "DJ__MUSIC", level: "V3", text: "All is well 🌹 good luck 🤞", time: "16:59", avatarColor: "#6366f1" },
];

interface GlobalChatPopupProps {
  onClose: () => void;
}

export function GlobalChatPopup({ onClose }: GlobalChatPopupProps) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  return (
    <div
      className="fixed z-50 flex flex-col"
      style={{
        top: 64,
        right: 16,
        width: 380,
        height: "calc(100vh - 80px)",
        maxHeight: 600,
        background: "#1a2026",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button className="flex items-center gap-1.5 text-sm font-semibold text-white">
          Global <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              navigate("/dashboard/messages?tab=global");
            }}
            className="text-[10px] font-medium px-2 py-1 rounded"
            style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}
          >
            Open in Messages
          </button>
          <button onClick={onClose} className="p-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: msg.avatarColor }}
              >
                {msg.username.slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 py-0.5 rounded"
                style={{ background: "#22c55e", color: "#fff" }}
              >
                {msg.level}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate">{msg.username}</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{msg.time}</span>
              </div>
              <div
                className="mt-1 inline-block rounded-xl px-3 py-2 text-xs"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message..."
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
          <button className="p-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span className="text-[10px] font-bold">GIF</span>
          </button>
          <button className="p-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Smile className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg"
            style={{ background: "#22c55e" }}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
