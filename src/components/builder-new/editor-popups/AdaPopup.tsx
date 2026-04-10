import { useState } from "react";
import { X, Sparkles, Send } from "lucide-react";
import type { SelectedScope } from "./EditorPopupTypes";
import type { AdaChatMessage } from "../ada/useAdaBuilderChat";

interface AdaPopupProps {
  onClose: () => void;
  selectedScope: SelectedScope;
  onSendPrompt: (prompt: string) => void;
  /** Shared chat state from useAdaBuilderChat — if provided, renders inline chat */
  messages?: AdaChatMessage[];
  isLoading?: boolean;
}

const DEFAULT_PROMPTS = [
  "Connect a custom domain",
  "Redesign with my brand colors",
  "Suggest a page for this site",
];

const SCOPE_PROMPTS: Partial<Record<SelectedScope, string[]>> = {
  text: ["Rewrite this text to be more engaging", "Simplify language", "Make text shorter", "Make text longer", "Change tone to professional"],
  button: ["Make this button stand out more", "Suggest better CTA text", "Change button style"],
  image: ["Suggest a better image layout", "Replace with a relevant stock image"],
  section: ["Redesign this hero section", "Change section layout", "Improve visual hierarchy"],
  menu: ["Reorganize my menu items", "Improve menu readability"],
  form: ["Improve my newsletter signup", "Add more form fields"],
};

export function AdaPopup({ onClose, selectedScope, onSendPrompt, messages = [], isLoading = false }: AdaPopupProps) {
  const [input, setInput] = useState("");

  const prompts = selectedScope !== "none" && selectedScope !== "page"
    ? (SCOPE_PROMPTS[selectedScope] || DEFAULT_PROMPTS)
    : DEFAULT_PROMPTS;

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    onSendPrompt(text.trim());
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="w-[300px] bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden max-h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <span className="text-sm font-semibold text-foreground">Ada</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {!hasMessages ? (
          <>
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <p className="text-sm font-medium text-primary">What would you like to change?</p>
              <p className="text-xs text-muted-foreground mt-1">Pick a suggestion or type your own:</p>
            </div>

            <div className="space-y-1.5">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-muted/40 rounded-lg hover:bg-muted/70 transition-colors text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                  {p}
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.slice(-6).map((msg) => (
            <div
              key={msg.id}
              className={`text-sm rounded-lg px-3 py-2 max-w-[95%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent/20 text-foreground ml-auto"
                  : "bg-muted/30 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <span className="animate-pulse">Ada is thinking…</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border px-3 py-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend(input)}
            placeholder="Ask me anything..."
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
