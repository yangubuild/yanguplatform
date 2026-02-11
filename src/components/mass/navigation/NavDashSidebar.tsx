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
  Home,
  Lightbulb,
  Bookmark,
  GraduationCap,
  TrendingUp as TrendUp,
  Layers,
  Image,
  TagIcon,
  FileText,
  Settings,
  Zap,
  Star,
} from "lucide-react";

import adaIcon from "@/assets/ada-icon.png";

/* ─── NAV CONFIG ─── */
const navItems = [
  { icon: Compass, label: "Explore", id: "explore" },
  { icon: Tag, label: "Offers", id: "offers", badge: "+120%", dot: true },
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: null, label: "Ada AI", id: "ada-ai", customIcon: "ada" },
  {
    icon: ShoppingBag,
    label: "Seller",
    id: "seller",
    subItems: [
      { icon: ShoppingBag, label: "Eshop" },
      { icon: Store, label: "Estore" },
      { icon: UtensilsCrossed, label: "Emenu" },
      { icon: Globe, label: "Esite" },
      { icon: Link, label: "Eshop Connect" },
    ],
  },
  { icon: Sparkles, label: "Influencer", id: "influencer" },
  { icon: Palette, label: "Yangu Studio", id: "yangu-studio" },
  { icon: BookOpen, label: "Visionaire", id: "visionaire", hasSecondary: true },
  { icon: Package, label: "App Store", id: "app-store", badge: "+120%" },
  { icon: Users, label: "Community", id: "community" },
];

/* ─── VISIONAIRE SECONDARY PANEL CONTENT ─── */
const visionaireSections = [
  {
    title: "MASTER LIBRARY",
    items: [
      { icon: Home, label: "Home", isActive: true },
      { icon: Lightbulb, label: "Product Requests" },
      { icon: Bookmark, label: "Saved" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { icon: GraduationCap, label: "Digital Product University" },
      { icon: TrendUp, label: "Evergreen Problems", badge: "NEW" },
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
      { icon: Star, label: "Book Title Generator" },
    ],
  },
];

/* ─── WIDTHS ─── */
const PRIMARY_FULL_W = 200;
const PRIMARY_ICON_W = 60;
const SECONDARY_W = 240;

interface NavDashSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onWidthChange?: (totalWidth: number) => void;
}

export function NavDashSidebar({ isOpen = true, onClose, onWidthChange }: NavDashSidebarProps) {
  const [activeItem, setActiveItem] = useState("offers");
  const [expandedSeller, setExpandedSeller] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [secondaryActiveItem, setSecondaryActiveItem] = useState("Home");

  // Derived: is the active item one that has a secondary panel?
  const hasSecondary = secondaryOpen;
  const primaryW = hasSecondary ? PRIMARY_ICON_W : PRIMARY_FULL_W;
  const totalWidth = primaryW + (hasSecondary ? SECONDARY_W : 0);

  const handleItemClick = (id: string) => {
    setActiveItem(id);

    if (id === "seller") {
      setExpandedSeller((p) => !p);
      return;
    }

    const item = navItems.find((n) => n.id === id);
    if (item?.hasSecondary) {
      // Toggle secondary open
      const willOpen = !secondaryOpen || activeItem !== id;
      setSecondaryOpen(willOpen);
      const newPrimary = willOpen ? PRIMARY_ICON_W : PRIMARY_FULL_W;
      const newSecondary = willOpen ? SECONDARY_W : 0;
      onWidthChange?.(newPrimary + newSecondary);
    } else {
      // Close secondary, restore full sidebar
      if (secondaryOpen) {
        setSecondaryOpen(false);
        onWidthChange?.(PRIMARY_FULL_W);
      }
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

      {/* Two-stage sidebar container */}
      <div
        className={`fixed left-0 top-[64px] h-[calc(100vh-64px)] z-50 flex transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: totalWidth }}
      >
        {/* ═══ PRIMARY SIDEBAR ═══ */}
        <div
          className="h-full flex flex-col py-3 shrink-0 transition-all duration-300 overflow-hidden"
          style={{ width: primaryW, background: "#1a2025" }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center rounded-xl mb-1 transition-all duration-200 relative group ${
                  hasSecondary ? "w-10 h-10 justify-center mx-auto" : "w-full h-10 px-3 gap-3"
                }`}
                style={{
                  background: isActive ? "rgba(74,222,128,0.15)" : "transparent",
                  color: isActive ? "#4ade80" : "rgba(255,255,255,0.55)",
                }}
                title={item.label}
              >
                {item.customIcon === "ada" ? (
                  <img
                    src={adaIcon}
                    alt="Ada"
                    className="w-[18px] h-[18px]"
                    style={{
                      filter: isActive
                        ? "brightness(0) invert(0.7) sepia(1) saturate(3) hue-rotate(90deg)"
                        : "brightness(0) invert(1) opacity(0.55)",
                    }}
                  />
                ) : Icon ? (
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                ) : null}

                {/* Text label — only in full mode */}
                {!hasSecondary && (
                  <span className="text-sm font-medium truncate whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge — only in full mode */}
                {!hasSecondary && item.badge && (
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0"
                    style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
                  >
                    {item.badge}
                  </span>
                )}

                {item.dot && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#4ade80" }}
                  />
                )}

                {/* Tooltip — only in icon-only mode */}
                {hasSecondary && (
                  <span
                    className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[60]"
                    style={{ background: "#2a3038", color: "rgba(255,255,255,0.85)" }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══ SECONDARY: Expanded Panel ═══ */}
        <div
          className="h-full flex flex-col overflow-hidden transition-all duration-300"
          style={{
            width: secondaryOpen ? SECONDARY_W : 0,
            background: "#1a2025",
            borderLeft: secondaryOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
            opacity: secondaryOpen ? 1 : 0,
          }}
        >
          {/* Panel Header */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-2.5 shrink-0">
            <BookOpen className="w-5 h-5" style={{ color: "rgba(255,255,255,0.7)" }} strokeWidth={1.8} />
            <span className="text-sm font-bold text-white whitespace-nowrap">Visionaire Library</span>
          </div>

          {/* Panel Content (scrollable) */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {visionaireSections.map((section) => (
              <div key={section.title} className="mb-4">
                <p
                  className="text-[10px] font-bold tracking-widest px-2 mb-2"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {section.title}
                </p>
                {section.items.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = secondaryActiveItem === sub.label;
                  return (
                    <button
                      key={sub.label}
                      onClick={() => setSecondaryActiveItem(sub.label)}
                      className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5"
                      style={{
                        background: isSubActive
                          ? "linear-gradient(90deg, #b5622a 0%, #c0522a 100%)"
                          : "transparent",
                        color: isSubActive ? "#fff" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <SubIcon className="w-[16px] h-[16px] shrink-0" strokeWidth={1.8} />
                        <span className="font-medium truncate">{sub.label}</span>
                      </div>
                      {sub.badge && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0"
                          style={{ background: "rgba(239,68,68,0.9)", color: "#fff" }}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export { PRIMARY_FULL_W, PRIMARY_ICON_W, SECONDARY_W };
