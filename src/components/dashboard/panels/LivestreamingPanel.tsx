import { Radio, Video, Users, Settings, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export function LivestreamingPanel() {
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-semibold text-foreground">Livestreaming</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Stream settings */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}>
              <Radio className="w-4 h-4" style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Stream Tools</p>
              <p className="text-xs text-muted-foreground">
                Configure your stream before going live
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors text-muted-foreground">
              <Video className="w-4 h-4 text-muted-foreground" />
              Camera & Audio settings
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors text-muted-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              Audience settings
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5 transition-colors text-muted-foreground">
              <Settings className="w-4 h-4 text-muted-foreground" />
              Stream quality
            </button>
          </div>
        </div>

        {/* Recent streams */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold text-foreground mb-2">Recent Streams</p>
          <p className="text-xs text-muted-foreground">
            No streams yet. Use Go Live on your profile to start.
          </p>
        </div>

        {/* Live Chat — real empty state, no mock data */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}>
              <MessageCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Live Chat</p>
              <p className="text-xs text-muted-foreground">
                Chat with your audience in real time
              </p>
            </div>
          </div>

          {/* Empty state — no messages until stream is live */}
          <div className="flex flex-col items-center justify-center py-6">
            <MessageCircle className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No messages yet
            </p>
            <p className="text-[10px] mt-1 text-muted-foreground">
              Messages will appear here when you go live
            </p>
          </div>

          {/* Chat input */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: chatInput.trim() ? "#ef4444" : "rgba(255,255,255,0.25)" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
