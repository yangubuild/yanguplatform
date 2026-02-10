import { Search } from "lucide-react";

export function NavDashPromoCards() {
  return (
    <div className="p-4 md:p-5">
      {/* Hero Banner - Empty placeholder */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          height: 180,
          background: "linear-gradient(135deg, #1a2530 0%, #232a30 40%, #1a3028 100%)",
        }}
      />

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
