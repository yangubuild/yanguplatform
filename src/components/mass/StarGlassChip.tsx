interface StarGlassChipProps {
  className?: string;
}

export function StarGlassChip({ className = "" }: StarGlassChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full transition-all duration-150 hover:brightness-110 ${className}`}
      style={{
        height: "22px",
        paddingLeft: "8px",
        paddingRight: "10px",
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
          0 6px 18px rgba(0,0,0,0.35)
        `,
      }}
    >
      <span
        style={{
          fontSize: "12px",
          lineHeight: 1,
          color: "rgba(255,255,255,0.80)",
        }}
      >
        ★
      </span>
    </span>
  );
}
