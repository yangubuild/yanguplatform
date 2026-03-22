import { useState } from "react";
import { X, Plus, Zap, Mic } from "lucide-react";

const SUGGESTIONS = [
  "Make a landing page",
  "I want to buy something sick",
  "Go live to the public",
  "Forecast the next 30 days of revenue",
];

export function ClientChatPanel() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-foreground">New chat</span>
        <button className="p-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Suggestions label */}
        <div className="flex items-center gap-1.5 mb-4">
          <span
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            🏷️ Click a suggestion to send
          </span>
        </div>

        {/* Suggestion cards */}
        <div className="w-full space-y-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-150 hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
              }}
              onClick={() => setMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input — pinned to bottom */}
      <div
        className="px-3 py-3 shrink-0 flex items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          className="p-1.5"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <Plus className="w-4 h-4" />
        </button>
        <div
          className="flex-1 flex items-center rounded-xl px-3 h-9"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type what you want done..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1">
          <span
            className="flex items-center gap-0.5 text-xs"
            style={{ color: "#f97316" }}
          >
            <Zap className="w-3 h-3" /> 313K
          </span>
          <button
            className="p-1.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
