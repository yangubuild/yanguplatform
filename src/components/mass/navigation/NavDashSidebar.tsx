import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Tag,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Clapperboard,
  Monitor,
  Package,
  Users,
} from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-full.png";
import adaIcon from "@/assets/ada-icon.png";

const navItems = [
  { icon: Compass, label: "Explore", chevron: true },
  {
    icon: Tag,
    label: "Offers",
    chevron: false,
    active: true,
    badge: "+120%",
    dot: true,
  },
  { icon: null, label: "Ada AI", chevron: true, customIcon: "ada" },
  { icon: ShoppingBag, label: "Seller", chevron: true },
  { icon: Sparkles, label: "Influencer", chevron: true },
  { icon: Clapperboard, label: "Yangu Studio", chevron: true },
  { icon: Monitor, label: "Visionaire", chevron: true },
  { icon: Package, label: "App Store", chevron: false, badge: "+120%" },
  { icon: Users, label: "Community", chevron: false },
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
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-[64px] h-[calc(100vh-64px)] w-[260px] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1a2025" }}
      >
        {/* Logo */}
        <div className="px-3 pt-3 pb-1">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: "#232a30" }}
          >
            <img src={yanguLogo} alt="Yangu" className="h-8 w-auto" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-2 flex-1 overflow-y-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItem === item.label;
            const isActive = item.active;

            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (item.chevron) {
                      setExpandedItem(isExpanded ? null : item.label);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5"
                  style={{
                    background: isActive
                      ? "linear-gradient(90deg, rgba(74,222,128,0.18) 0%, rgba(250,204,21,0.13) 100%)"
                      : "transparent",
                    color: isActive ? "#facc15" : "rgba(255,255,255,0.7)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {item.customIcon === "ada" ? (
                      <img
                        src={adaIcon}
                        alt="Ada"
                        className="w-[18px] h-[18px]"
                        style={{
                          filter:
                            "brightness(0) invert(1) opacity(0.65)",
                        }}
                      />
                    ) : Icon ? (
                      <Icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={1.8}
                        style={{
                          color: isActive ? "#facc15" : undefined,
                        }}
                      />
                    ) : null}
                    {item.dot && (
                      <span
                        className="w-2 h-2 rounded-full -ml-1.5"
                        style={{ background: "#facc15" }}
                      />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                        style={{
                          background: isActive
                            ? "rgba(250,204,21,0.2)"
                            : "rgba(74,222,128,0.15)",
                          color: isActive ? "#facc15" : "#4ade80",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.chevron && (
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="pl-10 pb-1">
                    <div
                      className="text-xs py-1.5 cursor-pointer hover:text-white transition-colors"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Coming soon
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Upgrade Card */}
        <div className="px-3 pb-2">
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#1a1a1a",
            }}
          >
            <p className="text-sm font-bold mb-0.5">Upgrade your plan</p>
            <p className="text-[11px] leading-snug mb-3" style={{ color: "#555" }}>
              40% fewer restrictions, better rates! Use code "SECRET" when you
              upgrade.
            </p>
            <button
              className="w-full py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: "#2a3038" }}
            >
              See Plans
            </button>
          </div>
        </div>

        {/* Profile Row */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full shrink-0 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white leading-tight truncate">
                Kafeero Azizi
              </p>
              <p
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                View Profile
              </p>
            </div>
            <ChevronDown
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "rgba(255,255,255,0.35)" }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
