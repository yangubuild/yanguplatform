import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function SocialEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: SocialEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-accent/60" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>
      <div className="flex gap-3">
        {actionLabel && onAction && (
          <Button variant="accent" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
