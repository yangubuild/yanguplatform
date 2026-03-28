import type { ChatMessage, SelectionButton } from "./types/builder.types";

interface MessageBubbleProps {
  message: ChatMessage;
  onButtonClick?: (button: SelectionButton) => void;
  isLatest?: boolean;
  clickedButtons?: Set<string>;
}

export function MessageBubble({ message, onButtonClick, isLatest: _isLatest, clickedButtons }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasButtons = message.buttons && message.buttons.length > 0;

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-2`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-foreground text-background rounded-br-md"
            : "bg-transparent text-foreground"
        }`}
      >
        {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.includes("\n")) {
            return part.split("\n").map((line, j) => {
              const trimmed = line.trim();
              if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                return (
                  <div key={`${i}-${j}`} className="flex gap-2 ml-1">
                    <span>•</span>
                    <span>{trimmed.slice(2)}</span>
                  </div>
                );
              }
              if (trimmed.startsWith("✅") || trimmed.startsWith("❌")) {
                return <div key={`${i}-${j}`}>{trimmed}</div>;
              }
              return j > 0 ? <span key={`${i}-${j}`}><br />{line}</span> : <span key={`${i}-${j}`}>{line}</span>;
            });
          }
          return <span key={i}>{part}</span>;
        })}
      </div>

      {/* Buttons stay visible on ALL assistant messages, not just latest */}
      {hasButtons && (
        <div className="flex flex-wrap gap-2 max-w-[85%]">
          {message.buttons!.map((btn) => {
            const isClicked = clickedButtons?.has(`${btn.type}:${btn.value}`);
            return (
              <button
                key={btn.id}
                onClick={() => onButtonClick?.(btn)}
                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                  isClicked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
