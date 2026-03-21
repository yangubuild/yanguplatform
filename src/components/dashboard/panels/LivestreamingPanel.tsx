import { Radio, Video, Users, Settings, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

const MOCK_MESSAGES = [
  { id: "1", username: "viewer_anna", text: "Love this stream! 🔥", time: "2m ago" },
  { id: "2", username: "shop_fan_23", text: "How much is the red one?", time: "1m ago" },
  { id: "3", username: "daily_deals", text: "Just joined, what did I miss?", time: "30s ago" },
];

export function LivestreamingPanel() {
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Livestreaming</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Stream settings */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <Radio className="w-4 h-4" style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Stream Tools</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Configure your stream before going live
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <Video className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              Camera & Audio settings
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              Audience settings
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <Settings className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              Stream quality
            </button>
          </div>
        </div>

        {/* Recent streams */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs font-semibold text-white mb-2">Recent Streams</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            No streams yet. Use Go Live on your profile to start.
          </p>
        </div>

        {/* Live Chat */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Chat</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Chat with your audience in real time
              </p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="space-y-2.5 mb-3 max-h-48 overflow-y-auto">
            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                >
                  {msg.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {msg.username}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {msg.time}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
            />
            <button
              className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: chatInput.trim() ? "#ef4444" : "rgba(255,255,255,0.25)" }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
