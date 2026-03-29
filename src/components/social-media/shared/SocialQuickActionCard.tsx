import { type LucideIcon } from "lucide-react";

interface SocialQuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
}

export function SocialQuickActionCard({
  icon: Icon,
  label,
  description,
  onClick,
}: SocialQuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors text-left w-full"
    >
      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-accent" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}
