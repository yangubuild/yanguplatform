import { MessagesGlobalChatTab } from "@/components/messages/tabs/MessagesGlobalChatTab";

/**
 * Reuses the existing Global Chat component from Messages.
 * Wraps it in the standard right-panel shell.
 */
export function GlobalChatPanel() {
  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Global Chat</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessagesGlobalChatTab />
      </div>
    </div>
  );
}
