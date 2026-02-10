const promoCards = [
  {
    badge: "EXCLUSIVE",
    title: "120% BONUS",
    subtitle: "+ 100 FREE SPINS IN CASINO",
    cta: "DEPOSIT NOW",
    gradient: "linear-gradient(135deg, #1B3D2E 0%, #1A1D26 100%)",
    accentColor: "#27AE60",
    decorativeColor: "#27AE60",
  },
  {
    badge: "EXCLUSIVE",
    title: "80% BONUS",
    subtitle: "+ 5 FREE BET IN SPORTS",
    cta: "DEPOSIT NOW",
    gradient: "linear-gradient(135deg, #1B3D2E 0%, #1A2636 100%)",
    accentColor: "#27AE60",
    decorativeColor: "#3498DB",
    hasCheckButton: true,
  },
  {
    badge: "EXCLUSIVE",
    title: "DOUBLE THE SPINS",
    subtitle: "BET $10 GET 20 FREE SPINS",
    cta: "PLAY NOW",
    gradient: "linear-gradient(135deg, #2D1B3D 0%, #1A1D26 100%)",
    accentColor: "#9B59B6",
    decorativeColor: "#9B59B6",
  },
];

export function NavDashPromoCards() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promoCards.map((card, idx) => (
          <div
            key={idx}
            className="relative rounded-xl overflow-hidden min-h-[180px] flex flex-col justify-between p-5"
            style={{
              background: card.gradient,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Decorative circle */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-20 blur-sm"
              style={{ background: card.decorativeColor }}
            />

            <div className="relative z-10">
              {/* Badge */}
              <span
                className="inline-block text-[10px] font-bold tracking-wider px-2 py-1 rounded mb-3"
                style={{
                  background: "#2A2D36",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {card.badge}
              </span>

              {/* Title */}
              <h3
                className="text-2xl font-black text-white mb-1"
              >
                {card.title}
              </h3>

              {/* Subtitle */}
              <p
                className="text-xs mb-4"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {card.subtitle}
              </p>
            </div>

            {/* CTA */}
            <div className="relative z-10 flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.8)",
                  background: "transparent",
                }}
              >
                {card.cta}
              </button>
              {card.hasCheckButton && (
                <button
                  className="px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: "#27AE60", color: "#fff" }}
                >
                  Check &gt;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className="rounded-full"
            style={{
              width: dot === 0 ? 16 : 6,
              height: 6,
              background: dot === 0 ? "#27AE60" : "rgba(255,255,255,0.15)",
              borderRadius: 999,
            }}
          />
        ))}
      </div>
    </div>
  );
}
