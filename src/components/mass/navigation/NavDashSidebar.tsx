import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarUrl } from "@/lib/avatarUtils";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  LayoutDashboard,
  BookOpen,
  LogOut,
  HelpCircle,
  Languages,
  Moon,
  Settings,
  CreditCard as CreditCardIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import adaIcon from "@/assets/ada-icon.png";
import { useRoles } from "@/hooks/useRoles";
import { useDailySalesCounter } from "@/hooks/useDailySalesCounter";
import {
  PRIMARY_NAV_ITEMS,
  EXTENDED_SIDEBAR_ITEMS,
  VISIONAIRE_SECTIONS,
  DASHBOARD_SECTIONS,
  resolveAccountType,
  isNavItemVisible,
  type NavItem,
  type NavSection,
} from "@/config/dashboardNav";

interface NavDashSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onActiveChange?: (label: string) => void;
}

const RAIL_WIDTH = 60;
const FULL_WIDTH = 260;
const EXTENDED_WIDTH = 260;

export function NavDashSidebar({ isOpen = true, onClose, onActiveChange }: NavDashSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dailySales = useDailySalesCounter();
  const { isAdmin } = useRoles();
  const { user, profile, signOut } = useAuth();
  const { data: activeOrg } = useActiveOrg();

  // Owner = the org's owner_user_id matches current user
  const isOrgOwner = !!(activeOrg && user && activeOrg.role === "owner");

  const [activeItem, setActiveItem] = useState("Offers");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [extendedActiveItem, setExtendedActiveItem] = useState("Home");

  const hasExtendedPanel = EXTENDED_SIDEBAR_ITEMS.includes(activeItem);

  // Total sidebar width for layout offset
  const totalWidth = hasExtendedPanel ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;

  // Resolve account type once
  const accountType = useMemo(
    () => resolveAccountType({ isAdmin, creatorType: profile?.creator_type }),
    [isAdmin, profile?.creator_type]
  );

  // Alias for template usage
  const userType = accountType;

  // Dev diagnostics
  useMemo(() => {
    if (!import.meta.env.DEV) return;
    const allowedRoutes = DASHBOARD_SECTIONS
      .flatMap((s) => s.items)
      .filter((i) => isNavItemVisible(i, accountType, isOrgOwner)).length;
    console.debug("[ACCOUNT_TYPE]", accountType, "isOrgOwner:", isOrgOwner, "visibleAccountItems:", allowedRoutes);
  }, [accountType]);

  // Check if a path matches current location
  const isPathActive = (path?: string) => {
    if (!path) return false;
    if (path === "/dashboard/home") return location.pathname === "/dashboard/home" || location.pathname === "/dashboard";
    if (path === "/dashboard/dashboard") return location.pathname === "/dashboard/dashboard" || location.pathname.startsWith("/dashboard/dashboard/");
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (item: NavItem) => {
    const label = item.label;
    setActiveItem(label);
    onActiveChange?.(label);

    if (item.subItems && item.chevron) {
      setExpandedItem(expandedItem === label ? null : label);
    } else {
      setExpandedItem(null);
      if (item.to) {
        navigate(item.to);
        // Auto-close sidebar on mobile after navigation
        onClose?.();
      }
    }
  };

  const handleSubItemClick = (sub: { label: string; to?: string }) => {
    setActiveItem(sub.label);
    if (sub.to) {
      navigate(sub.to);
      // Auto-close sidebar on mobile after navigation
      onClose?.();
    }
  };

  const visibleNavItems = PRIMARY_NAV_ITEMS.filter((item) => isNavItemVisible(item, userType, isOrgOwner));

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
            borderRight: "1px solid rgba(255,255,255,0.06)",
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
                    ${dailySales}
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
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItem === item.label;
              const isActive = activeItem === item.label || isPathActive(item.to);

              if (hasExtendedPanel) {
                // ICON-ONLY (collapsed) mode
                return (
                  <div key={item.label} className="flex justify-center mb-0.5">
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive ? "nav-offers-active" : "nav-item-hover"
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
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 mb-0.5 group ${
                      isActive ? "nav-offers-active" : "nav-item-hover"
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
                        const isSubActive = isPathActive(sub.to);
                        return (
                          <button
                            key={sub.label}
                            onClick={() => handleSubItemClick(sub)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 mb-0.5 ${
                              isSubActive ? "nav-offers-active" : "nav-item-hover"
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
                    40% fewer restrictions, better rates!
                  </p>
                  <button
                    onClick={() => navigate("/dashboard/profile/subscription")}
                    className="w-full py-2 rounded-lg text-xs font-bold text-white"
                    style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
                  >
                    See Plans
                  </button>
                </div>
              </div>
              <div className="px-3 pb-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-full flex items-center gap-2.5 px-2 py-2 outline-none border-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none">
                      <div
                        className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                        style={profile && resolveAvatarUrl(profile)
                          ? { background: "transparent" }
                          : { background: "#2a3038" }
                        }
                      >
                        {profile && resolveAvatarUrl(profile) ? (
                          <img src={resolveAvatarUrl(profile)!} alt="Avatar" className="w-8 h-8 rounded-full object-cover" style={{ clipPath: "circle(50%)" }} />
                        ) : (
                          <Users className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-white leading-tight truncate">
                          {profile?.display_name || profile?.username || "User"}
                        </p>
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>View Profile</p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/profile/subscription")}>
                      <CreditCardIcon className="w-4 h-4 mr-2" /> Manage subscription
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                      <Settings className="w-4 h-4 mr-2" /> Account settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <HelpCircle className="w-4 h-4 mr-2" /> Help and support
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Languages className="w-4 h-4 mr-2" /> Language
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.35)" }} />
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Moon className="w-4 h-4 mr-2" /> Theme
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.35)" }} />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* === EXTENDED SIDEBAR === */}
        {hasExtendedPanel && (() => {
          const panelConfig = activeItem === "Visionaire"
            ? { icon: BookOpen, title: "Visionaire Library", sections: VISIONAIRE_SECTIONS, defaultActive: "Home" }
            : { icon: LayoutDashboard, title: "Dashboard", sections: DASHBOARD_SECTIONS, defaultActive: "Dashboard" };
          const PanelIcon = panelConfig.icon;

          return (
            <div
              className="h-full flex flex-col overflow-hidden"
              style={{
                width: EXTENDED_WIDTH,
                background: "#1a2025",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Panel header */}
              <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
                <PanelIcon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.8)" }} />
                <span className="text-sm font-semibold text-white">{panelConfig.title}</span>
              </div>

              {/* Panel content */}
              <nav className="flex-1 overflow-y-auto px-3 pb-4">
                {panelConfig.sections.map((section) => {
                  const visibleItems = section.items.filter((subItem: any) =>
                    isNavItemVisible(subItem, userType, isOrgOwner)
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={section.title} className="mb-4">
                      <p
                        className="text-[10px] font-bold tracking-wider px-2 mb-2"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {section.title}
                      </p>
                      {visibleItems.map((subItem: any) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = extendedActiveItem === subItem.label || isPathActive(subItem.to);
                        return (
                          <button
                            key={subItem.label}
                            onClick={() => {
                              setExtendedActiveItem(subItem.label);
                              if (subItem.to) navigate(subItem.to);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5 ${
                              isSubActive ? "nav-offers-active" : "nav-item-hover"
                            }`}
                            style={{
                              color: isSubActive ? "#4ade80" : "rgba(255,255,255,0.6)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <SubIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                              <span className="font-medium">{subItem.label}</span>
                            </div>
                            {"badge" in subItem && subItem.badge && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                                style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)", color: "#fff" }}
                              >
                                {subItem.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>
          );
        })()}
      </div>
    </>
  );
}

// Export total width for parent layout
export function useSidebarWidth(activeItem: string) {
  const hasExtended = EXTENDED_SIDEBAR_ITEMS.includes(activeItem);
  return hasExtended ? RAIL_WIDTH + EXTENDED_WIDTH : FULL_WIDTH;
}
