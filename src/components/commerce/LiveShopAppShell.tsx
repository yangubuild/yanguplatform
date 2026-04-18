/**
 * LiveShopAppShell — Phase 1 of live-shop web-app runtime.
 *
 * Wraps every live shop with:
 *  - A clean top app bar (logo / business name + cart count)
 *  - A persistent bottom tab bar on mobile (Menu / Cart / Orders / Account)
 *  - Safe-area padding so iframe content never sits under the bars
 *
 * The shell is purely presentational — it does NOT change cart, checkout,
 * auth, or order logic. Phase 2+ will wire those flows.
 */

import { ReactNode } from "react";
import { ShoppingBag, ShoppingCart, ListOrdered, User, Heart, Search } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { PublicAccountDropdown } from "@/components/commerce/PublicAccountDropdown";

export type LiveShopTab = "menu" | "cart" | "orders" | "account";

interface LiveShopAppShellProps {
  businessName?: string;
  logoUrl?: string;
  cartCount: number;
  wishlistCount?: number;
  activeTab: LiveShopTab;
  onTabChange: (tab: LiveShopTab) => void;
  onOpenWishlist?: () => void;
  children: ReactNode;
}

export function LiveShopAppShell({
  businessName,
  logoUrl,
  cartCount,
  activeTab,
  onTabChange,
  children,
}: LiveShopAppShellProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Desktop: render children only — desktop keeps the template's own nav.
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Top app bar */}
      <header className="flex-none h-14 flex items-center justify-between gap-3 px-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 object-contain rounded"
            />
          )}
          <span className="font-semibold text-sm truncate text-foreground">
            {businessName || "Shop"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Wishlist"
            onClick={() => onOpenWishlist?.()}
            className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <Heart className="h-5 w-5 text-foreground" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange("cart")}
            className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Iframe / page content area */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom tab bar */}
      <nav
        className="flex-none h-16 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <TabButton
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Menu"
          active={activeTab === "menu"}
          onClick={() => onTabChange("menu")}
        />
        <TabButton
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Cart"
          badge={cartCount > 0 ? cartCount : undefined}
          active={activeTab === "cart"}
          onClick={() => onTabChange("cart")}
        />
        <TabButton
          icon={<ListOrdered className="h-5 w-5" />}
          label="Orders"
          active={activeTab === "orders"}
          onClick={() => onTabChange("orders")}
        />
        <TabButton
          icon={<User className="h-5 w-5" />}
          label="Account"
          active={activeTab === "account"}
          onClick={() => onTabChange("account")}
        />
      </nav>
    </div>
  );
}

interface TabButtonProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}

function TabButton({ icon, label, active, badge, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
