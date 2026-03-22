import { MessagesGlobalChatTab } from "@/components/messages/tabs/MessagesGlobalChatTab";
import { Trophy } from "lucide-react";

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
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span>Global Chat</span>
          <Trophy className="w-4 h-4" style={{ color: "#facc15" }} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessagesGlobalChatTab />
      </div>
    </div>
  );
}
