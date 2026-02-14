import { useState } from "react";
import { ChevronDown, Info, Trophy, X, Smile, Plus, Image } from "lucide-react";

interface ChatMessage {
  id: string;
  username: string;
  level: string;
  text: string;
  time: string;
  avatarColor: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: "1", username: "MSHAN_011", level: "V15", text: "Wow big win 🥳👏", time: "15:17", avatarColor: "#e44d8a" },
  { id: "2", username: "MERA_BAHI_JAN", level: "V3", text: "Good morning my friend good luck", time: "15:17", avatarColor: "#8b5cf6" },
  { id: "3", username: "PLAY_BC_GOLD", level: "V4", text: "Sabko best luck! 🍀", time: "15:17", avatarColor: "#3b82f6" },
  { id: "4", username: "Gwendolen_01", level: "V22", text: "Love you", time: "15:17", avatarColor: "#ec4899" },
  { id: "5", username: "CHRISTMAS_LOVER", level: "V3", text: "@MustfaAlifighte1 keep winning", time: "15:17", avatarColor: "#f43f5e" },
  { id: "6", username: "DJ__MUSIC", level: "V3", text: "All is well 🌹 good luck 🤞", time: "15:17", avatarColor: "#6366f1" },
  { id: "7", username: "i_Crypto77", level: "V8", text: "Happy rolling", time: "15:17", avatarColor: "#14b8a6" },
];

export function MessagesGlobalChatTab() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button className="flex items-center gap-1.5 text-sm font-medium text-white">
          Global <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Info className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "#facc15" }}>
            <Trophy className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: msg.avatarColor }}
              >
                {msg.username.slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "#22c55e", color: "#fff" }}
              >
                {msg.level}
              </span>
            </div>
            {/* Content */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{msg.username}</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{msg.time}</span>
              </div>
              <div
                className="mt-1 inline-block rounded-xl px-3 py-2 text-sm"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2">
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
          <button className="p-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span className="text-xs font-bold">GIF</span>
          </button>
          <button className="p-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Smile className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
