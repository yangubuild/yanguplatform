interface Props {
  names: string[];
}

export function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-1.5 px-4 py-1" style={{ minHeight: 24 }}>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.4)",
              animation: `typingDot 1.4s infinite ${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {text}
      </span>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
