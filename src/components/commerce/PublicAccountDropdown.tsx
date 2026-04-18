/**
 * PublicAccountDropdown — Visitor-side account menu surfaced from the
 * top-right user icon. Auth-aware: shows sign-in CTA for guests, full menu
 * for signed-in users. Items route to existing dashboard pages; placeholders
 * for not-yet-built routes are hidden to honor the zero-dead-controls rule.
 */
import { useEffect, useRef, useState } from "react";
import { User, LogOut, Package, Heart, Wallet, Settings, MapPin, Globe, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface PublicAccountDropdownProps {
  onOpenWishlist?: () => void;
}

export function PublicAccountDropdown({ onOpenWishlist }: PublicAccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const userEmail = session?.user?.email || "";
  const userName = (session?.user?.user_metadata as any)?.full_name || userEmail.split("@")[0] || "Account";

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  const link = (href: string, icon: React.ReactNode, label: string) => (
    <a href={href} className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </a>
  );

  const button = (onClick: () => void, icon: React.ReactNode, label: string) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors text-left">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
      >
        <User className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            {session ? (
              <>
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <a href="/dashboard/settings" className="text-xs text-primary mt-1 inline-block hover:underline">Complete profile →</a>
              </>
            ) : (
              <a href="/auth" className="block text-sm font-semibold text-primary text-center py-1.5">
                Sign in / Create account
              </a>
            )}
          </div>

          {session && (
            <>
              <div className="py-1">
                {link("/dashboard/affiliates", <span aria-hidden>🎁</span>, "Share & Earn Credits")}
              </div>
              <div className="border-t border-border py-1">
                {link("/dashboard/orders", <Package className="h-4 w-4" />, "Orders")}
                {button(() => { onOpenWishlist?.(); setOpen(false); }, <Heart className="h-4 w-4" />, "Wishlist")}
              </div>
              <div className="border-t border-border py-1">
                {link("/dashboard/wallet", <Wallet className="h-4 w-4" />, "Wallet")}
                {link("/dashboard/settings", <MapPin className="h-4 w-4" />, "Delivery Addresses")}
              </div>
              <div className="border-t border-border py-1">
                <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Settings</p>
                {link("/dashboard/settings", <Globe className="h-4 w-4" />, "Country & Language")}
                {link("/dashboard/notifications", <Bell className="h-4 w-4" />, "Notifications")}
              </div>
              <div className="border-t border-border py-1">
                {button(signOut, <LogOut className="h-4 w-4" />, "Log Out")}
              </div>
            </>
          )}

          {!session && (
            <div className="py-1">
              {button(() => { onOpenWishlist?.(); setOpen(false); }, <Heart className="h-4 w-4" />, "Wishlist")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
