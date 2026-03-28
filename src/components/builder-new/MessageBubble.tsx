import type { ChatMessage, SelectionButton } from "./types/builder.types";

interface MessageBubbleProps {
  message: ChatMessage;
  onButtonClick?: (button: SelectionButton) => void;
  isLatest?: boolean;
}

export function MessageBubble({ message, onButtonClick, isLatest }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-2`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-foreground text-background rounded-br-md"
            : "bg-transparent text-foreground"
        }`}
      >
        {/* Render markdown-like bold */}
        {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          // Handle bullet points
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
              if (trimmed.startsWith("✅")) {
                return <div key={`${i}-${j}`}>{trimmed}</div>;
              }
              if (trimmed.startsWith("❌")) {
                return <div key={`${i}-${j}`}>{trimmed}</div>;
              }
              return j > 0 ? <span key={`${i}-${j}`}><br />{line}</span> : <span key={`${i}-${j}`}>{line}</span>;
            });
          }
          return <span key={i}>{part}</span>;
        })}
      </div>

      {/* Selection buttons */}
      {isLatest && message.buttons && message.buttons.length > 0 && (
        <div className="flex flex-wrap gap-2 max-w-[85%]">
          {message.buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onButtonClick?.(btn)}
              className="px-4 py-2 text-sm rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
