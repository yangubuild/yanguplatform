import {
  Menu,
  Search,
  Gift,
  MessageSquare,
  Bell,
  ChevronDown,
} from "lucide-react";

interface NavDashHeaderProps {
  onMenuToggle?: () => void;
}

export function NavDashHeader({ onMenuToggle }: NavDashHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-14"
      style={{ background: "#1A1D26", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 lg:hidden"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-bold text-lg tracking-tight">
          BC<span style={{ color: "#27AE60" }}>.</span>GAME
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg hover:bg-white/5 transition-colors hidden sm:block"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Currency selector */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "#22262F", color: "rgba(255,255,255,0.7)" }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ background: "#E74C3C", color: "#fff" }}
          >
            $
          </div>
          <span>AED 0.00</span>
          <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.35)" }} />
        </button>

        {/* Deposit button */}
        <button
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hidden sm:block"
          style={{ background: "#27AE60" }}
        >
          Deposit
        </button>

        {/* Icon buttons */}
        {[Gift, MessageSquare, Bell].map((Icon, i) => (
          <button
            key={i}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full"
          style={{ background: "#2A2D36", border: "2px solid rgba(255,255,255,0.1)" }}
        />
      </div>
    </header>
  );
}
