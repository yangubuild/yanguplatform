import { Link, useLocation } from "react-router-dom";
import { useDomain } from "@/contexts/DomainContext";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Type-safe icon lookup
const getIcon = (name: string): LucideIcon | null => {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? null;
};

interface DomainNavProps {
  /** Additional class names */
  className?: string;
  /** Orientation of nav items */
  orientation?: "horizontal" | "vertical";
  /** Show icons */
  showIcons?: boolean;
  /** Callback when nav item clicked */
  onNavClick?: () => void;
}

/**
 * DomainNav renders navigation items based on the current domain type.
 * Navigation items are configured in domain-routes.ts.
 */
export function DomainNav({ 
  className, 
  orientation = "horizontal",
  showIcons = true,
  onNavClick
}: DomainNavProps) {
  const location = useLocation();
  const { routeConfig, isLoading } = useDomain();

  if (isLoading) {
    return null;
  }

  const navItems = routeConfig.navItems;

  return (
    <nav 
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row items-center",
        className
      )}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
          location.pathname.startsWith(`${item.path}/`);
        
        // Get icon component dynamically
        const IconComponent = item.icon 
          ? getIcon(item.icon)
          : null;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              orientation === "vertical" && "w-full",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            {showIcons && IconComponent && (
              <IconComponent className="h-4 w-4" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
