import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { MassTrendsBar } from "./MassTrendsBar";

const publicNavLinks = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Blog" },
  { to: "/community", label: "Community" },
  { to: "/ada-ai", label: "Ada AI" },
];

export function MassHeader({ hideTrends, showLogo }: { hideTrends?: boolean; showLogo?: boolean } = {}) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Logo left, buttons right when needed */}
      <div className={`flex items-center ${showLogo ? "justify-between" : "justify-end"} gap-3`}>
        {showLogo && (
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0"
            aria-label="Go to home page">
            <img src={yanguLogo} alt="yangu" className="h-12 w-auto" />
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="solid"
            size="default"
            onClick={() => navigate("/auth/login")}>
            Sign in
          </Button>
          <Button
            variant="accent"
            size="default"
            onClick={() => navigate("/auth/signup")}>
            Start selling
          </Button>
        </div>
      </div>

      {/* Trends bar - directly below buttons */}
      {!hideTrends && <MassTrendsBar />}

      {/* Mobile navigation drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[280px] bg-background p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Drawer header */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40">
              <img src={yanguLogo} alt="yangu" className="h-8 w-auto" />
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
              {publicNavLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-[15px] font-medium text-foreground/70 hover:bg-muted/40 hover:text-foreground transition-colors"
                  activeClassName="bg-muted/50 text-foreground">
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Drawer footer CTAs */}
            <div className="flex flex-col gap-2 px-4 pb-6 pt-2 border-t border-border/40">
              <Button
                variant="solid"
                size="default"
                className="w-full"
                onClick={() => { setDrawerOpen(false); navigate("/auth/login"); }}>
                Sign in
              </Button>
              <Button
                variant="accent"
                size="default"
                className="w-full"
                onClick={() => { setDrawerOpen(false); navigate("/auth/signup"); }}>
                Start selling
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
