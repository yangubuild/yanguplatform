import type { ChatMessage } from "./types/builder.types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
              return j > 0 ? <span key={`${i}-${j}`}><br />{line}</span> : <span key={`${i}-${j}`}>{line}</span>;
            });
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    </div>
  );
}
