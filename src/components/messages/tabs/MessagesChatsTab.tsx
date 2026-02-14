export function MessagesChatsTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat card preview */}
      <div className="p-4">
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "rgba(96,165,250,0.2)", color: "rgba(96,165,250,0.9)" }}
          >
            FC
          </div>
          <div>
            <p className="text-sm font-medium text-white">Fresh & Wholesome Foods Co.</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Chat</p>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>No recent messages</p>
            <button className="text-xs mt-2 hover:underline" style={{ color: "rgba(255,255,255,0.5)" }}>
              Open →
            </button>
          </div>
          <span className="ml-auto text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
            12/3
          </span>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          className="rounded-2xl p-8 text-center max-w-xs"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-sm font-medium text-white">Select a message</p>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Choose from your existing conversations, start a new one, or just keep swimming.
          </p>
          <div className="mt-4 text-3xl">👀</div>
        </div>
      </div>
    </div>
  );
}
