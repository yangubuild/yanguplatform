import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { PLATFORM_NAME } from "@/config/platform";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import authLogo from "@/assets/yangu-logo-auth.png";

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
  backLinkHref = "/",
  backLinkLabel = "Back to home",
  maxWidth,
}: AuthShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={authLogo} alt="yangu" className="h-8" />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className={`w-full ${maxWidth || "max-w-md"} space-y-8`}>
          {/* Back link */}
          {showBackLink && (
            <Link
              to={backLinkHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {backLinkLabel}
            </Link>
          )}

          {/* Title section */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Auth form container */}
          <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-lg">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} yangu. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
