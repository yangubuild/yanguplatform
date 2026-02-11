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
  Store,
  Globe,
  Link,
  UtensilsCrossed,
  Home,
  Lightbulb,
  Bookmark,
  GraduationCap,
  TrendingUp as TrendIcon,
  Layers,
  Image,
  TagIcon,
  FileText,
  Settings,
  Zap,
  Sparkle,
} from "lucide-react";

import adaIcon from "@/assets/ada-icon.png";

// Items that have an extended sidebar panel
const EXTENDED_SIDEBAR_ITEMS = ["Visionaire"];

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

// Visionaire extended sidebar content
const visionaireSections = [
  {
    title: "MASTER LIBRARY",
    items: [
      { icon: Home, label: "Home", active: true },
      { icon: Lightbulb, label: "Product Requests" },
      { icon: Bookmark, label: "Saved" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { icon: GraduationCap, label: "Digital Product University" },
      { icon: TrendIcon, label: "Evergreen Problems", badge: "NEW" },
      { icon: Layers, label: "Product Mockups" },
      { icon: Image, label: "Book Covers" },
      { icon: TagIcon, label: "Special Deals" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { icon: FileText, label: "PDF Rebrander" },
      { icon: Settings, label: "Product Descriptions" },
      { icon: Zap, label: "Product Ideas" },
      { icon: Sparkle, label: "Book Title Generator" },
    ],
  },
];

interface NavDashSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onActiveChange?: (label: string) => void;
}

const RAIL_WIDTH = 60;
const FULL_WIDTH = 260;
const EXTENDED_WIDTH = 260;

export function NavDashSidebar({ isOpen = true, onClose, onActiveChange }: NavDashSidebarProps) {
  const [activeItem, setActiveItem] = useState("Offers");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [extendedActiveItem, setExtendedActiveItem] = useState("Home");

  const hasExtendedPanel = EXTENDED_SIDEBAR_ITEMS.includes(activeItem);

  // Total sidebar width for layout offset
  const totalWidth = hasExtendedPanel ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;

  const handleItemClick = (label: string, hasSubItems: boolean, hasChevron: boolean) => {
    setActiveItem(label);
    onActiveChange?.(label);
    if (hasSubItems && hasChevron) {
      setExpandedItem(expandedItem === label ? null : label);
    } else {
      setExpandedItem(null);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed left-0 top-[64px] h-[calc(100vh-64px)] z-50 flex transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: totalWidth }}
      >
        {/* === PRIMARY SIDEBAR === */}
        <div
          className="h-full flex flex-col shrink-0 overflow-hidden transition-all duration-300"
          style={{
            width: hasExtendedPanel ? RAIL_WIDTH : FULL_WIDTH,
            background: "#1a2025",
          }}
        >
          {/* Sales metric - only in full mode */}
          {!hasExtendedPanel && (
            <div className="px-3 pt-3 pb-1">
              <div
                className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{ background: "#232a30" }}
              >
                <TrendingUp className="w-5 h-5 shrink-0" style={{ color: "#6dbb8a" }} />
                <div className="min-w-0">
                  <span className="text-lg font-semibold block leading-tight" style={{ color: "#6dbb8a" }}>
                    $1,532,492.32
                  </span>
                  <span className="text-xs" style={{ color: "#6dbb8a" }}>+ 22.6%</span>
                  <span className="text-[10px] block mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Daily platform sales
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav items */}
          <nav className={`flex-1 overflow-y-auto pb-2 ${hasExtendedPanel ? "px-1 pt-2" : "px-2"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItem === item.label;
              const isActive = activeItem === item.label;

              if (hasExtendedPanel) {
                // ICON-ONLY (collapsed) mode
                return (
                  <div key={item.label} className="flex justify-center mb-0.5">
                    <button
                      onClick={() => handleItemClick(item.label, !!item.subItems, item.chevron)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive ? "nav-offers-active" : "hover:bg-white/[0.06]"
                      }`}
                      title={item.label}
                      style={{
                        color: isActive ? "#4ade80" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {item.customIcon === "ada" ? (
                        <img
                          src={adaIcon}
                          alt="Ada"
                          className="w-[18px] h-[18px]"
                          style={{ filter: "brightness(0) invert(1) opacity(0.65)" }}
                        />
                      ) : Icon ? (
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                      ) : null}
                    </button>
                  </div>
                );
              }

              // FULL mode (with labels)
              return (
                <div key={item.label}>
                  <button
                    onClick={() => handleItemClick(item.label, !!item.subItems, item.chevron)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 mb-0.5 group ${
                      isActive ? "nav-offers-active" : "hover:bg-white/[0.06]"
                    }`}
                    style={{ color: isActive ? "#4ade80" : "rgba(255,255,255,0.7)" }}
                  >
                    <div className="flex items-center gap-3">
                      {item.customIcon === "ada" ? (
                        <img
                          src={adaIcon}
                          alt="Ada"
                          className="w-[18px] h-[18px]"
                          style={{ filter: "brightness(0) invert(1) opacity(0.65)" }}
                        />
                      ) : Icon ? (
                        <Icon
                          className="w-[18px] h-[18px]"
                          strokeWidth={1.8}
                          style={{ color: isActive ? "#4ade80" : undefined }}
                        />
                      ) : null}
                      {item.dot && (
                        <span className="w-2 h-2 rounded-full -ml-1.5" style={{ background: "#4ade80" }} />
                      )}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                          style={{
                            background: isActive ? "rgba(74,222,128,0.2)" : "rgba(74,222,128,0.15)",
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
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                      ) : null}
                    </div>
                  </button>
                  {!hasExtendedPanel && isExpanded && item.subItems ? (
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
                            style={{ color: isSubActive ? "#4ade80" : "rgba(255,255,255,0.55)" }}
                          >
                            <SubIcon className="w-[16px] h-[16px]" strokeWidth={1.8} />
                            <span className="font-medium">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : !hasExtendedPanel && isExpanded ? (
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

          {/* Upgrade card + profile - only in full mode */}
          {!hasExtendedPanel && (
            <>
              <div className="px-3 pb-2">
                <div
                  className="rounded-xl p-4 backdrop-blur-md border border-white/10"
                  style={{ background: "rgba(74, 222, 128, 0.08)", color: "#fff" }}
                >
                  <p className="text-sm font-bold mb-0.5 text-white">Upgrade your plan</p>
                  <p className="text-[11px] leading-snug mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                    40% fewer restrictions, better rates! Use code "SECRET" when you upgrade.
                  </p>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-bold text-white"
                    style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
                  >
                    See Plans
                  </button>
                </div>
              </div>
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: "#2a3038" }}
                  >
                    <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white leading-tight truncate">Kafeero Azizi</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>View Profile</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* === EXTENDED SIDEBAR (Visionaire panel) === */}
        {hasExtendedPanel && (
          <div
            className="h-full flex flex-col overflow-hidden"
            style={{
              width: EXTENDED_WIDTH,
              background: "#111518",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Panel header */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5" style={{ color: "rgba(255,255,255,0.8)" }} />
              <span className="text-sm font-semibold text-white">Visionaire Library</span>
            </div>

            {/* Panel content */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {visionaireSections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p
                    className="text-[10px] font-bold tracking-wider px-2 mb-2"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {section.title}
                  </p>
                  {section.items.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = extendedActiveItem === subItem.label;
                    return (
                      <button
                        key={subItem.label}
                        onClick={() => setExtendedActiveItem(subItem.label)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5 ${
                          isSubActive ? "" : "hover:bg-white/[0.06]"
                        }`}
                        style={
                          isSubActive
                            ? {
                                background: "linear-gradient(90deg, #c0392b 0%, #a93226 100%)",
                                color: "#fff",
                              }
                            : { color: "rgba(255,255,255,0.6)" }
                        }
                      >
                        <div className="flex items-center gap-3">
                          <SubIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                          <span className="font-medium">{subItem.label}</span>
                        </div>
                        {subItem.badge && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                            style={{ background: "#c0392b", color: "#fff" }}
                          >
                            {subItem.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

// Export total width for parent layout
export function useSidebarWidth(activeItem: string) {
  const hasExtended = EXTENDED_SIDEBAR_ITEMS.includes(activeItem);
  return hasExtended ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;
}
