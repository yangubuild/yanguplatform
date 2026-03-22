import { useDomain, type DomainType } from "@/contexts/DomainContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Type-safe icon lookup
const getIcon = (name: string): LucideIcon | null => {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? null;
};

// Color mapping for domain types
const DOMAIN_COLORS: Record<DomainType, string> = {
  io: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  shop: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  store: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  site: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  studio: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  live: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  community: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

interface DomainBadgeProps {
  /** Override the domain type to display */
  domainType?: DomainType;
  /** Show the icon */
  showIcon?: boolean;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: "sm" | "default";
}

/**
 * DomainBadge displays a badge indicating the current domain type
 * with appropriate styling and icon.
 */
export function DomainBadge({ 
  domainType: overrideDomainType,
  showIcon = true,
  className,
  size = "default"
}: DomainBadgeProps) {
  const { domainType: contextDomainType, routeConfig, isLoading } = useDomain();
  
  const domainType = overrideDomainType ?? contextDomainType;
  
  if (isLoading && !overrideDomainType) {
    return null;
  }

  const colorClass = DOMAIN_COLORS[domainType];
  const IconComponent = routeConfig.icon
    ? getIcon(routeConfig.icon)
    : null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        colorClass,
        size === "sm" && "text-xs px-2 py-0",
        className
      )}>
      {showIcon && IconComponent && (
        <IconComponent className={cn(
          "mr-1",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
        )} />
      )}
      {routeConfig.label}
    </Badge>
  );
}
