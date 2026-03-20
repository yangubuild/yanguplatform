import { MessagesChatsTab } from "@/components/messages/tabs/MessagesChatsTab";

/**
 * Reuses the existing Chats tab from Messages.
 */
export function ChatPanel() {
  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Chat</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessagesChatsTab />
      </div>
    </div>
  );
}
