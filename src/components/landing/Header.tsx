import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useDomain } from "@/contexts/DomainContext";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { DomainBadge } from "@/components/domain/DomainBadge";
import { DomainCta } from "@/components/domain/DomainCta";
import { Menu, X, Sun, Moon, Settings } from "lucide-react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { routeConfig, domainType, isLoading: isDomainLoading } = useDomain();
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useRoles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-lg font-bold text-accent-foreground">Y</span>
          </div>
          <span className="text-xl font-bold tracking-tight">{routeConfig.label}</span>
          {domainType !== "io" && !isDomainLoading && (
            <DomainBadge size="sm" className="ml-2 hidden sm:flex" />
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#surfaces" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Surfaces
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              {isAdmin && (
                <Link to="/manage">
                  <Button variant="ghost" size="sm">
                    <Settings className="mr-1.5 h-4 w-4" />
                    Management
                  </Button>
                </Link>
              )}
              <Link to={routeConfig.defaultRoute}>
                <Button variant="accent" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Sign In
                </Button>
              </Link>
              
              <DomainCta 
                variant="primary" 
                size="sm" 
                className="hidden sm:flex" 
                isAuthenticated={isAuthenticated}
              />
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-4 py-6">
            <a href="#surfaces" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Surfaces
            </a>
            <a href="#features" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </a>
            <div className="flex flex-col gap-2 pt-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/manage" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <Settings className="mr-1.5 h-4 w-4" />
                        Management
                      </Button>
                    </Link>
                  )}
                  <Link to={routeConfig.defaultRoute}>
                    <Button variant="accent" className="w-full">Go to Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <DomainCta 
                    variant="primary" 
                    className="w-full" 
                    isAuthenticated={isAuthenticated}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
