interface StarGlassChipProps {
  className?: string;
}

export function StarGlassChip({ className = "" }: StarGlassChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full relative overflow-hidden ${className}`}
      style={{
        height: "16px",
        width: "16px",
        background: `linear-gradient(180deg, 
          rgba(255,255,255,0.14) 0%, 
          rgba(255,255,255,0.08) 45%, 
          rgba(0,0,0,0.22) 100%
        )`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 0 -1px 0 rgba(0,0,0,0.35),
          0 4px 12px rgba(0,0,0,0.25)
        `,
      }}
    >
      {/* Animated shimmer effect */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            105deg,
            transparent 20%,
            rgba(255,255,255,0.12) 40%,
            rgba(255,255,255,0.20) 50%,
            rgba(255,255,255,0.12) 60%,
            transparent 80%
          )`,
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
      <span
        className="relative z-10"
        style={{
          fontSize: "9px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        ★
      </span>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </span>
  );
}
