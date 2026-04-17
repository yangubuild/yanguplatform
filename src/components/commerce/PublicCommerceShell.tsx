/**
 * PublicCommerceShell — Wraps any public surface page with commerce overlays.
 * Provides: CartDrawer, CheckoutDialog, OrderSuccessDialog, OrderTrackingView,
 * WhatsApp floating button, and a floating cart FAB.
 *
 * Works for both emenu (iframe) and non-emenu (React) surfaces.
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { CheckoutDialog } from "@/components/commerce/CheckoutDialog";
import { OrderSuccessDialog } from "@/components/commerce/OrderSuccessDialog";
import { OrderTrackingView } from "@/components/commerce/OrderTrackingView";
import { WhatsAppFloatingButton } from "@/components/commerce/WhatsAppFloatingButton";
import { LiveShopAppShell, type LiveShopTab } from "@/components/commerce/LiveShopAppShell";
import { ShoppingCart } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { CartItem } from "@/lib/cart/cartStore";

interface PublicCommerceShellProps {
  surfaceId: string;
  ownerId: string;
  businessName?: string;
  children: React.ReactNode;
}

type CommerceView = "none" | "cart" | "checkout" | "success" | "tracking";

export function PublicCommerceShell({
  surfaceId,
  ownerId,
  businessName,
  children,
}: PublicCommerceShellProps) {
  const [view, setView] = useState<CommerceView>("none");
  const [trackingCode, setTrackingCode] = useState("");
  const cart = useCart(surfaceId);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Load commerce config
  const { data: config } = useQuery({
    queryKey: ["public_commerce_config", surfaceId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surface_commerce_config")
        .select("*")
        .eq("surface_id", surfaceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Load surface (for logo / branding in app shell)
  const { data: surface } = useQuery({
    queryKey: ["public_surface_brand", surfaceId],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_surfaces")
        .select("id,title,metadata")
        .eq("id", surfaceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const logoUrl =
    (surface?.metadata as any)?.logo_url ||
    (surface?.metadata as any)?.brand?.logo_url ||
    undefined;

  const orderingEnabled = config?.ordering_enabled ?? false;
  const whatsappEnabled = config?.whatsapp_enabled ?? false;
  const currency = config?.currency ?? "USD";

  const handleAddToCart = useCallback(
    (item: Omit<CartItem, "quantity" | "surface_id">) => {
      cart.add(item);
      // Brief flash of cart
      setView("cart");
    },
    [cart]
  );

  const handleCheckout = useCallback(() => {
    setView("checkout");
  }, []);

  const handleOrderPlaced = useCallback(
    (code: string) => {
      setTrackingCode(code);
      cart.clear();
      setView("success");
    },
    [cart]
  );

  const handleViewTracking = useCallback(() => {
    setView("tracking");
  }, []);

  // Expose addToCart globally for iframe postMessage bridge
  if (typeof window !== "undefined") {
    (window as any).__yangu_add_to_cart = handleAddToCart;
    (window as any).__yangu_open_cart = () => setView("cart");
  }

  // Broadcast cart count to iframe
  useEffect(() => {
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "yangu_cart_count", count: cart.count }, "*");
    }
  }, [cart.count]);

  // Map app-shell tab clicks → existing views
  const handleTabChange = useCallback((tab: LiveShopTab) => {
    if (tab === "menu") setView("none");
    else if (tab === "cart") setView("cart");
    else if (tab === "orders") setView("tracking");
    else if (tab === "account") setView("tracking"); // Phase 4 will add account view
  }, []);

  const activeTab: LiveShopTab =
    view === "cart" || view === "checkout"
      ? "cart"
      : view === "tracking" || view === "success"
      ? "orders"
      : "menu";

  return (
    <LiveShopAppShell
      businessName={businessName || surface?.title}
      logoUrl={logoUrl}
      cartCount={cart.count}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {children}

      {/* Floating cart FAB — desktop only (mobile uses bottom tab bar) */}
      {orderingEnabled && cart.count > 0 && view === "none" && !isMobile && (
        <button
          onClick={() => setView("cart")}
          className="fixed bottom-6 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 shadow-lg hover:opacity-90 transition-transform hover:scale-105"
          style={{ left: whatsappEnabled ? "24px" : undefined, right: whatsappEnabled ? undefined : "24px" }}
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold text-sm">{cart.count}</span>
        </button>
      )}

      {/* WhatsApp float */}
      {whatsappEnabled && config?.support_whatsapp && (
        <WhatsAppFloatingButton
          phoneNumber={config.support_whatsapp}
          defaultMessage={config.whatsapp_default_message || undefined}
        />
      )}

      {/* Cart Drawer */}
      {orderingEnabled && (
        <CartDrawer
          open={view === "cart"}
          onClose={() => setView("none")}
          items={cart.items}
          currency={currency}
          totalCents={cart.total}
          onUpdateQty={cart.updateQty}
          onRemove={cart.remove}
          onCheckout={handleCheckout}
          deliveryFeeCents={config?.delivery_fee_cents ?? 0}
        />
      )}

      {/* Checkout */}
      {orderingEnabled && (
        <CheckoutDialog
          open={view === "checkout"}
          onClose={() => setView("cart")}
          items={cart.items}
          currency={currency}
          totalCents={cart.total}
          surfaceId={surfaceId}
          ownerId={ownerId}
          orderTypes={config?.order_types ?? ["delivery"]}
          paymentMethods={config?.payment_methods ?? ["cash"]}
          deliveryFeeCents={config?.delivery_fee_cents ?? 0}
          supportPhone={config?.support_phone}
          supportEmail={config?.support_email}
          supportWhatsapp={config?.support_whatsapp}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* Order Success */}
      <OrderSuccessDialog
        open={view === "success"}
        onClose={() => setView("none")}
        trackingCode={trackingCode}
        supportPhone={config?.support_phone}
        supportEmail={config?.support_email}
        supportWhatsapp={config?.support_whatsapp}
        businessName={businessName}
      />

      {/* Order Tracking */}
      {view === "tracking" && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
          <div className="flex justify-end p-4">
            <button onClick={() => setView("none")} className="text-sm underline">Close</button>
          </div>
          <div className="flex-1 overflow-auto">
            <OrderTrackingView initialTrackingCode={trackingCode} />
          </div>
        </div>
      )}
    </>
  );
}
