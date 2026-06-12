/**
 * AdaBuilderPanel — Real active ADA chat UI for the builder left panel.
 * Replaces the "coming soon" placeholder.
 */
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X } from "lucide-react";
import type { AdaChatMessage } from "./useAdaBuilderChat";

interface AdaBuilderPanelProps {
  messages: AdaChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
  category?: string;
}

const STARTER_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  emenu: ["Add a new menu item with price", "Update my WhatsApp number", "Change the background color", "Edit the hero section text", "Help me configure ordering"],
  eshop: ["Add a new product with price", "Update my WhatsApp number", "Change the background color", "Edit the hero section text", "Help me configure checkout"],
  estore: ["Add a new catalog item", "Update my WhatsApp number", "Change the background color", "Edit the hero section text", "Help me configure quote requests"],
  esite: ["Add a new service", "Update my WhatsApp number", "Change the background color", "Edit the hero section text", "Help me update contact details"],
  influencer: ["Add a new link", "Update my WhatsApp number", "Change the background color", "Edit the bio section text", "Help me add social links"],
  community: ["Add a new event", "Update my WhatsApp number", "Change the background color", "Edit the hero section text", "Help me add membership details"],
};

export function AdaBuilderPanel({ messages, isLoading, onSend, onClose, category }: AdaBuilderPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const showStarters = messages.length === 0;
  const starterPrompts = STARTER_PROMPTS_BY_CATEGORY[category || ""] || STARTER_PROMPTS_BY_CATEGORY.esite;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Ada AI</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {showStarters ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium">Hi! I'm Ada, your builder assistant.</p>
              <p className="text-xs text-muted-foreground mt-1">
                I can help you edit your {category || "surface"} — try a suggestion or type your own.
              </p>
            </div>
            <div className="space-y-1.5">
              {starterPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-accent/10 hover:border-accent/30 text-sm text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-accent shrink-0" />
                    {p}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm rounded-lg px-3 py-2 max-w-[95%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent/20 text-foreground ml-auto"
                  : "bg-muted/40 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm text-muted-foreground max-w-[80%]">
            <span className="animate-pulse">Ada is thinking…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask Ada anything…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-full bg-accent text-accent-foreground disabled:opacity-40 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
