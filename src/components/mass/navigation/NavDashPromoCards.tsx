import { Search } from "lucide-react";
import navHeroBanner from "@/assets/nav-hero-banner.png";

export function NavDashPromoCards() {
  return (
    <div className="p-4 md:p-5">
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: 180,
          background: "linear-gradient(135deg, #1a2530 0%, #232a30 40%, #1a3028 100%)",
        }}
      >
        <img
          src={navHeroBanner}
          alt="Stay Untamed"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          style={{ objectPosition: "center" }}
        />
        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(26,32,37,0.85) 0%, rgba(26,32,37,0.4) 40%, transparent 65%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center h-full px-8">
          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            Stay Untamed
          </h2>
          <p className="text-sm text-white/70 mb-0.5">Sign Up & Get</p>
          <p className="text-base font-bold mb-0.5">
            <span className="text-white">UP TO </span>
            <span style={{ color: "#4ade80" }}>$20,000.00</span>
          </p>
          <p className="text-sm text-white/60 mb-3">in Casino or Sports</p>
          <button
            className="w-fit px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{
              background: "linear-gradient(90deg, #4ade80 0%, #f59e0b 100%)",
            }}
          >
            Join Now
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="mt-4 flex items-center gap-3 rounded-xl px-4 h-11"
        style={{
          background: "#232a30",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Search games
        </span>
      </div>
    </div>
  );
}
