import { useRef, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CanvasEditableTextProps {
  value: string;
  placeholder?: string;
  className?: string;
  tag?: "h1" | "h3" | "p" | "span";
  onSave: (newValue: string) => void;
  onAiRewrite?: (instruction: string) => void;
}

const REWRITE_OPTIONS = [
  { label: "Shorter", instruction: "Make this shorter and punchier" },
  { label: "More professional", instruction: "Rewrite in a professional tone" },
  { label: "Friendly tone", instruction: "Rewrite in a warm, friendly tone" },
  { label: "Sales focused", instruction: "Rewrite to be more persuasive and sales-oriented" },
];

export function CanvasEditableText({
  value,
  placeholder = "Click to edit",
  className = "",
  tag: Tag = "p",
  onSave,
  onAiRewrite,
}: CanvasEditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const lastSaved = useRef(value);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const text = ref.current?.innerText?.trim() || "";
    if (text !== lastSaved.current) {
      lastSaved.current = text;
      onSave(text);
    }
  }, [onSave]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      ref.current?.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      if (ref.current && sel) {
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.innerText = lastSaved.current;
      ref.current?.blur();
    }
  }, []);

  const handleRewrite = (instruction: string) => {
    setShowAi(false);
    setCustomPrompt("");
    onAiRewrite?.(instruction);
  };

  return (
    <div className="group/edit relative inline-block w-full">
      <Tag
        ref={ref as any}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} outline-none transition-all ${
          editing
            ? "ring-1 ring-primary/50 rounded px-1 -mx-1 bg-primary/5"
            : "hover:ring-1 hover:ring-primary/30 hover:rounded hover:px-1 hover:-mx-1 cursor-text"
        }`}
      >
        {value || placeholder}
      </Tag>

      {/* AI rewrite button */}
      {onAiRewrite && !editing && (
        <Popover open={showAi} onOpenChange={setShowAi}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAi(true); }}
              className="absolute -right-6 top-0 opacity-0 group-hover/edit:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10"
              title="Rewrite with Ada"
            >
              <Sparkles className="h-3 w-3 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2"
            side="right"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5 px-1">✨ Rewrite with Ada</p>
            <div className="space-y-0.5">
              {REWRITE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleRewrite(opt.instruction)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-border">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customPrompt.trim()) {
                    handleRewrite(customPrompt.trim());
                  }
                }}
                placeholder="Custom instruction…"
                className="w-full text-xs px-2 py-1 rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary/50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
