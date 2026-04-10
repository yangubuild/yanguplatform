import { useState } from "react";
import { X, Sparkles, Send, Mic } from "lucide-react";
import type { SelectedScope } from "./EditorPopupTypes";

interface AdaPopupProps {
  onClose: () => void;
  selectedScope: SelectedScope;
  onSendPrompt: (prompt: string) => void;
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

export function AdaPopup({ onClose, selectedScope, onSendPrompt }: AdaPopupProps) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);

  const prompts = selectedScope !== "none" && selectedScope !== "page"
    ? (SCOPE_PROMPTS[selectedScope] || DEFAULT_PROMPTS)
    : DEFAULT_PROMPTS;

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setResponse("Processing...");
    onSendPrompt(text.trim());
    setInput("");
  };

  return (
    <div className="w-[300px] bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-sm font-semibold text-foreground">Ada</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {!response ? (
          <>
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center mb-2">
                <Sparkles className="h-4 w-4 text-background" />
              </div>
              <p className="text-sm font-medium text-primary">Hi yangu, let's work together to build your site.</p>
              <p className="text-xs text-muted-foreground mt-1">Here are some things you can ask me:</p>
            </div>

            <div className="space-y-1.5">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-muted/40 rounded-lg hover:bg-muted/70 transition-colors text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  {p}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3 min-h-[60px]">
            {response}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg border border-border px-3 py-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend(input)}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => handleSend(input)} className="p-1 rounded hover:bg-muted transition-colors">
            <Send className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
