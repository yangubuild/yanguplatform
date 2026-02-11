import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Tag,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Palette,
  LayoutDashboard,
  BookOpen,
  Package,
  Users,
  TrendingUp,
  Globe,
  Link,
  UtensilsCrossed,
  Store,
} from "lucide-react";

import adaIcon from "@/assets/ada-icon.png";

const navItems = [
  { icon: Compass, label: "Explore", chevron: true },
  { icon: Tag, label: "Offers", chevron: false, badge: "+120%", dot: true },
  { icon: LayoutDashboard, label: "Dashboard", chevron: true },
  { icon: null, label: "Ada AI", chevron: true, customIcon: "ada" },
  {
    icon: ShoppingBag,
    label: "Seller",
    chevron: true,
    subItems: [
      { icon: ShoppingBag, label: "Eshop" },
      { icon: Store, label: "Estore" },
      { icon: UtensilsCrossed, label: "Emenu" },
      { icon: Globe, label: "Esite" },
      { icon: Link, label: "Eshop Connect" },
    ],
  },
  { icon: Sparkles, label: "Influencer", chevron: true },
  { icon: Palette, label: "Yangu Studio", chevron: true },
  { icon: BookOpen, label: "Visionaire", chevron: true },
  { icon: Package, label: "App Store", chevron: false, badge: "+120%" },
  { icon: Users, label: "Community", chevron: false },
];

interface NavDashSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function NavDashSidebar({ isOpen = true, onClose }: NavDashSidebarProps) {
  const [activeItem, setActiveItem] = useState("Offers");
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
        {/* Daily Sales Metric */}
        <div className="px-3 pt-3 pb-1">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: "#232a30" }}
          >
            <TrendingUp
              className="w-5 h-5 shrink-0"
              style={{ color: "#6dbb8a" }}
            />
            <div className="min-w-0">
              <span
                className="text-lg font-semibold block leading-tight"
                style={{ color: "#6dbb8a" }}
              >
                $1,532,492.32
              </span>
              <span className="text-xs" style={{ color: "#6dbb8a" }}>
                + 22.6%
              </span>
              <span className="text-[10px] block mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Daily platform sales
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-2 flex-1 overflow-y-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItem === item.label;
            const isActive = activeItem === item.label;

            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    setActiveItem(item.label);
                    if (item.chevron) {
                      setExpandedItem(isExpanded ? null : item.label);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 mb-0.5 group ${
                    isActive ? "nav-offers-active" : "hover:bg-white/[0.06]"
                  }`}
                  style={{
                    color: isActive ? "#4ade80" : "rgba(255,255,255,0.7)",
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
                          color: isActive ? "#4ade80" : undefined,
                        }}
                      />
                    ) : null}
                    {item.dot && (
                      <span
                        className="w-2 h-2 rounded-full -ml-1.5"
                        style={{ background: "#4ade80" }}
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
                            ? "rgba(74,222,128,0.2)"
                            : "rgba(74,222,128,0.15)",
                          color: "#4ade80",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.chevron && item.subItems ? (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      />
                    ) : item.chevron ? (
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      />
                    ) : null}
                  </div>
                </button>
                {isExpanded && item.subItems ? (
                  <div className="pl-8 pb-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeItem === sub.label;
                      return (
                        <button
                          key={sub.label}
                          onClick={() => setActiveItem(sub.label)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 mb-0.5 ${
                            isSubActive ? "nav-offers-active" : "hover:bg-white/[0.06]"
                          }`}
                          style={{
                            color: isSubActive ? "#4ade80" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          <SubIcon className="w-[16px] h-[16px]" strokeWidth={1.8} />
                          <span className="font-medium">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : isExpanded ? (
                  <div className="pl-10 pb-1">
                    <div
                      className="text-xs py-1.5 cursor-pointer hover:text-white transition-colors"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Coming soon
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Upgrade Card */}
        <div className="px-3 pb-2">
          <div
            className="rounded-xl p-4 backdrop-blur-md border border-white/10"
            style={{
              background: "rgba(74, 222, 128, 0.08)",
              color: "#fff",
            }}
          >
            <p className="text-sm font-bold mb-0.5 text-white">Upgrade your plan</p>
            <p className="text-[11px] leading-snug mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
              40% fewer restrictions, better rates! Use code "SECRET" when you
              upgrade.
            </p>
            <button
              className="w-full py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
            >
              See Plans
            </button>
          </div>
        </div>

        {/* Profile Row */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
              style={{ background: "#2a3038" }}
            >
              <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
            </div>
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
