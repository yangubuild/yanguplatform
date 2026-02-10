import { Menu, Search, Gift, Bell, ChevronDown, User } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-full.png";

interface NavDashHeaderProps {
  onMenuToggle?: () => void;
}

export function NavDashHeader({ onMenuToggle }: NavDashHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-16"
      style={{
        background: "linear-gradient(90deg, #1f262b 0%, #232a30 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
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
        <img src={yanguLogo} alt="Yangu" className="h-7 w-auto" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{
            background: "#2a3038",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Balance pill */}
        <button
          className="flex items-center gap-2 h-9 px-3 rounded-lg"
          style={{
            background: "#2a3038",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "linear-gradient(135deg, #b5622a 0%, #5c2a12 100%)", color: "#fff" }}
          >
            $
          </div>
          <span className="text-xs font-medium whitespace-nowrap">AED 0.00</span>
          <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.35)" }} />
        </button>

        {/* Deposit button */}
        <button
          className="h-9 px-5 rounded-lg text-xs font-bold text-white"
          style={{
            background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)",
          }}
        >
          Deposit
        </button>

        {/* Gift icon */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ background: "#2a3038", color: "rgba(255,255,255,0.5)" }}
        >
          <Gift className="w-4 h-4" />
        </button>

        {/* Notification */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "#2a3038",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <User className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>
    </header>
  );
}
