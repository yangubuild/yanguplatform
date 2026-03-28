import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Plus } from "lucide-react";
import type { ChatMessage, SelectionButton } from "./types/builder.types";
import type { Selection } from "./types/builder.types";
import { MessageBubble } from "./MessageBubble";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onButtonClick: (button: SelectionButton) => void;
  selections: Selection[];
}

export function ChatInterface({ messages, isLoading, onSend, onButtonClick, selections }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build a set of clicked button keys for visual feedback
  const clickedButtons = useMemo(() => {
    const set = new Set<string>();
    for (const s of selections) {
      set.add(`${s.type}:${s.value}`);
    }
    return set;
  }, [selections]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onButtonClick={onButtonClick}
            clickedButtons={clickedButtons}
          />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="flex gap-1.5 px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Plus className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-2 max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-foreground text-background disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
