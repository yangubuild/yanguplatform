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
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.15)
        ` }}
    >
      {/* Animated silver shimmer effect */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            110deg,
            transparent 0%,
            transparent 30%,
            rgba(255,255,255,0.25) 45%,
            rgba(255,255,255,0.40) 50%,
            rgba(255,255,255,0.25) 55%,
            transparent 70%,
            transparent 100%
          )`,
          backgroundSize: "250% 100%",
          animation: "silverShimmer 2.5s ease-in-out infinite" }}
      />
      <span
        className="relative z-10"
        style={{
          fontSize: "10px",
          lineHeight: 1 }}
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
