import { useDomain } from "@/contexts/DomainContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DomainCtaProps {
  /** Show primary or secondary CTA */
  variant?: "primary" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg";
  /** Additional class names */
  className?: string;
  /** Custom link destination (defaults to dashboard or signup) */
  to?: string;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
}

/**
 * DomainCta renders the appropriate call-to-action button
 * based on the current domain type.
 */
export function DomainCta({ 
  variant = "primary",
  size = "default",
  className,
  to,
  isAuthenticated = false
}: DomainCtaProps) {
  const { routeConfig, isLoading } = useDomain();

  if (isLoading) {
    return null;
  }

  const ctaText = variant === "primary" 
    ? routeConfig.primaryCta 
    : routeConfig.secondaryCta;

  if (!ctaText) {
    return null;
  }

  // Determine destination
  const destination = to ?? (isAuthenticated 
    ? routeConfig.defaultRoute 
    : "/auth/signup"
  );

  return (
    <Button
      asChild
      variant={variant === "primary" ? "accent" : "outline"}
      size={size}
      className={cn(className)}
    >
      <Link to={destination}>
        {ctaText}
      </Link>
    </Button>
  );
}

/**
 * DomainCtaGroup renders both primary and secondary CTAs
 */
export function DomainCtaGroup({ 
  className,
  isAuthenticated = false 
}: { 
  className?: string;
  isAuthenticated?: boolean;
}) {
  const { routeConfig } = useDomain();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <DomainCta variant="primary" isAuthenticated={isAuthenticated} />
      {routeConfig.secondaryCta && (
        <DomainCta variant="secondary" isAuthenticated={isAuthenticated} />
      )}
    </div>
  );
}
