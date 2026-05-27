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
import { OrderDetailView } from "@/components/commerce/OrderDetailView";
import { WhatsAppFloatingButton } from "@/components/commerce/WhatsAppFloatingButton";
import { LiveShopAppShell, type LiveShopTab } from "@/components/commerce/LiveShopAppShell";
import { MyOrdersView } from "@/components/commerce/MyOrdersView";
import { PublicWishlistDrawer } from "@/components/commerce/PublicWishlistDrawer";
import { PublicProductDetailDialog } from "@/components/commerce/PublicProductDetailDialog";
import { recordBuyerOrder } from "@/lib/cart/buyerOrders";
import { ShoppingCart } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { CartItem } from "@/lib/cart/cartStore";

interface PublicCommerceShellProps {
  surfaceId: string;
  ownerId: string;
  businessName?: string;
  surfaceType?: string;
  children: React.ReactNode;
}

type CommerceView = "none" | "cart" | "checkout" | "success" | "tracking" | "orders";

export function PublicCommerceShell({
  surfaceId,
  ownerId,
  businessName,
  surfaceType,
  children,
}: PublicCommerceShellProps) {
  const [view, setView] = useState<CommerceView>("none");
  const [trackingCode, setTrackingCode] = useState("");
  const [lastOrderInfo, setLastOrderInfo] = useState<{
    paymentMethod: string;
    orderId: string;
    buyerUserId: string | null;
  } | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<import("./PublicProductDetailDialog").ProductDetailPayload | null>(null);
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
    (code: string, info?: { paymentMethod: string; orderId: string; buyerUserId: string | null }) => {
      // Persist a buyer-side reference so My Orders can show this order.
      try {
        recordBuyerOrder({
          tracking_code: code,
          surface_id: surfaceId,
          business_name: businessName ?? null,
          total_cents: cart.total,
          currency,
          item_count: cart.count,
          placed_at: new Date().toISOString(),
        });
      } catch {
        // non-fatal
      }
      setTrackingCode(code);
      if (info) setLastOrderInfo(info);
      cart.clear();
      setView("success");
    },
    [cart, surfaceId, businessName, currency]
  );

  const handleViewTracking = useCallback((code?: string) => {
    if (code) setTrackingCode(code);
    setView("tracking");
  }, []);

  // Expose addToCart globally for iframe postMessage bridge
  if (typeof window !== "undefined") {
    (window as any).__yangu_add_to_cart = handleAddToCart;
    (window as any).__yangu_open_cart = () => setView("cart");
    (window as any).__yangu_open_wishlist = () => setWishlistOpen(true);
    (window as any).__yangu_open_product_detail = (p: any) => setDetailProduct(p);
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
    else if (tab === "orders") setView("orders");
    else if (tab === "account") setView("orders"); // Phase 4 will add account view
  }, []);

  const activeTab: LiveShopTab =
    view === "cart" || view === "checkout"
      ? "cart"
      : view === "tracking" || view === "success" || view === "orders"
      ? "orders"
      : "menu";

  // Wishlist count from localStorage (visitor-side, surface-scoped)
  const [wishlistCount, setWishlistCount] = useState(0);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(`yangu_wishlist_${surfaceId}`);
        const arr = raw ? JSON.parse(raw) : [];
        setWishlistCount(Array.isArray(arr) ? arr.length : 0);
      } catch { setWishlistCount(0); }
    };
    read();
    const handler = () => read();
    window.addEventListener("yangu_wishlist_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("yangu_wishlist_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [surfaceId]);

  return (
    <LiveShopAppShell
      businessName={businessName || surface?.title}
      logoUrl={logoUrl}
      cartCount={cart.count}
      wishlistCount={wishlistCount}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onOpenWishlist={() => setWishlistOpen(true)}
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
        onViewMyOrders={() => setView("orders")}
        onBackToShop={() => setView("none")}
        paymentMethod={lastOrderInfo?.paymentMethod}
        mobileMoney={{
          phone: config?.mobile_money_phone,
          name: (config as any)?.mobile_money_account_name,
          provider: config?.mobile_money_provider,
        }}
        sellerId={ownerId}
        buyerUserId={lastOrderInfo?.buyerUserId ?? null}
      />

      {/* My Orders (buyer-side history) */}
      {view === "orders" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">My Orders</h2>
            <button onClick={() => setView("none")} className="text-sm underline">Close</button>
          </div>
          <div className="flex-1 overflow-auto">
            <MyOrdersView
              surfaceId={surfaceId}
              onTrackOrder={(code) => handleViewTracking(code)}
              onBackToShop={() => setView("none")}
            />
          </div>
        </div>
      )}

      {/* Order Detail (buyer-side) */}
      {view === "tracking" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={() => setView("orders")} className="text-sm font-medium text-primary">← My Orders</button>
            <button onClick={() => setView("none")} className="text-sm text-muted-foreground">Close</button>
          </div>
          <div className="flex-1 overflow-auto">
            <OrderDetailView
              trackingCode={trackingCode}
              businessName={businessName || surface?.title || undefined}
              supportPhone={config?.support_phone}
              supportEmail={config?.support_email}
              supportWhatsapp={config?.support_whatsapp}
            />
          </div>
        </div>
      )}

      {/* Wishlist drawer (visitor-side) */}
      <PublicWishlistDrawer
        surfaceId={surfaceId}
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onMoveToBag={(item) => {
          handleAddToCart({
            id: item.id,
            name: item.name,
            price_cents: item.price_cents,
            currency: item.currency,
            image_url: item.image_url,
            variant: null,
          });
        }}
      />

      {/* Product detail dialog (visitor-side) */}
      <PublicProductDetailDialog
        surfaceId={surfaceId}
        surfaceType={surfaceType}
        product={detailProduct}
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(p, opts) => {
          const variantParts = [opts.size, opts.color].filter(Boolean).join(" / ");
          for (let i = 0; i < opts.quantity; i++) {
            handleAddToCart({
              id: p.id + (variantParts ? "_" + variantParts : ""),
              name: p.name,
              price_cents: p.price_cents,
              currency: p.currency,
              image_url: p.image_urls[0] || null,
              variant: variantParts || null,
            });
          }
        }}
      />
    </LiveShopAppShell>
  );
}
