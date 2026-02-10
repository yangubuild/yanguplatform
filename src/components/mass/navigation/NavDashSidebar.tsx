import { useState } from "react";
import {
  ChevronDown,
  Gamepad2,
  Trophy,
  Ticket,
  TrendingUp,
  Megaphone,
  Crown,
  Gift,
  Compass,
  Smartphone,
} from "lucide-react";

const mainNavItems = [
  { icon: Gamepad2, label: "Casino" },
  { icon: Trophy, label: "Sports" },
  { icon: Ticket, label: "Lottery" },
  { icon: TrendingUp, label: "Crypto Futures" },
  { icon: Megaphone, label: "Promotions" },
];

const bottomNavItems = [
  { icon: Crown, label: "VIP Club", badge: null },
  { icon: Gift, label: "Bonus", badge: "+120%" },
  { icon: Compass, label: "Quest Hub", badge: null },
];

interface NavDashSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function NavDashSidebar({ isOpen = true, onClose }: NavDashSidebarProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1A1D26" }}
      >
        {/* App promo card */}
        <div className="p-3">
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "#22262F" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#2A2D36" }}
            >
              <Smartphone className="w-5 h-5 text-white/70" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Application</p>
              <p className="text-[10px] text-white/50 leading-tight">
                Unlock Fun with Exclusive Features
              </p>
            </div>
          </div>
        </div>

        {/* Token ticker */}
        <div className="px-3 pb-3">
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: "#22262F" }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{ background: "#F7931A" }}
            />
            <span className="text-xs text-white/70 font-medium">BC Token</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(231,76,60,0.15)", color: "#E74C3C" }}
            >
              -2.31%
            </span>
            <span className="text-xs text-white/50 ml-auto">$0.0842</span>
          </div>
        </div>

        {/* Main nav items */}
        <nav className="px-2 flex-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItem === item.label;
            return (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setExpandedItem(isExpanded ? null : item.label)
                  }
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 mb-0.5"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  />
                </button>
                {isExpanded && (
                  <div className="pl-10 pb-1">
                    <div
                      className="text-xs py-1.5 cursor-pointer hover:text-white transition-colors"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      Coming soon
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Separator */}
          <div
            className="my-3 mx-3 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {/* Bottom nav items */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 mb-0.5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold ml-auto"
                    style={{
                      background: "rgba(39,174,96,0.15)",
                      color: "#27AE60",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
