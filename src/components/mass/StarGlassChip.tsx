interface StarGlassChipProps {
  className?: string;
}

export function StarGlassChip({ className = "" }: StarGlassChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full relative overflow-hidden ${className}`}
      style={{
        height: "18px",
        width: "18px",
        background: `linear-gradient(180deg, 
          rgba(180,180,180,0.35) 0%, 
          rgba(120,120,120,0.25) 45%, 
          rgba(60,60,60,0.40) 100%
        )`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.20)",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.35),
          inset 0 -1px 0 rgba(0,0,0,0.30),
          0 2px 8px rgba(0,0,0,0.30)
        `,
      }}
    >
      {/* Animated silver shimmer effect */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            110deg,
            transparent 0%,
            transparent 30%,
            rgba(255,255,255,0.40) 45%,
            rgba(255,255,255,0.60) 50%,
            rgba(255,255,255,0.40) 55%,
            transparent 70%,
            transparent 100%
          )`,
          backgroundSize: "250% 100%",
          animation: "silverShimmer 2.5s ease-in-out infinite",
        }}
      />
      <span
        className="relative z-10"
        style={{
          fontSize: "10px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.90)",
          textShadow: "0 0 2px rgba(255,255,255,0.3)",
        }}
      >
        ★
      </span>
      <style>{`
        @keyframes silverShimmer {
          0% {
            background-position: 250% 0;
          }
          100% {
            background-position: -250% 0;
          }
        }
      `}</style>
    </span>
  );
}
