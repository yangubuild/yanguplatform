import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { PLATFORM_NAME } from "@/config/platform";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { YanguLogo, YANGU_SITE_URL } from "@/components/brand/YanguLogo";
import { YanguAmbientGlow } from "@/components/brand/YanguAmbientGlow";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkLabel?: string;
  /** Override the default max-w-md container width */
  maxWidth?: string;
}

export function AuthShell({
  children,
  title,
  subtitle,
  showBackLink = true,
  backLinkHref = YANGU_SITE_URL,
  backLinkLabel = "Back to home",
  maxWidth,
}: AuthShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <YanguAmbientGlow className="fixed h-[42vh]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <a href={YANGU_SITE_URL} className="flex items-center gap-2">
          <YanguLogo className="h-8" />
        </a>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        <div className={`w-full ${maxWidth || "max-w-md"} space-y-8`}>
          {/* Back link */}
          {showBackLink && (
            /^https?:\/\//.test(backLinkHref) ? (
              <a
                href={backLinkHref}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {backLinkLabel}
              </a>
            ) : (
              <Link
                to={backLinkHref}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {backLinkLabel}
              </Link>
            )
          )}

          {/* Title section */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Auth form container */}
          <div className="yangu-surface yangu-border-gradient yangu-glow rounded-2xl p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} yangu. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
