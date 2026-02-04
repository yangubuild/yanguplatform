import { Coins, Loader2 } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditBadge({ className, showLabel = true }: CreditBadgeProps) {
  const { data: credits, isLoading } = useCredits();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-sm",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Coins className="h-4 w-4" />
          <span>{credits?.balance ?? 0}</span>
          {showLabel && <span className="text-muted-foreground">credits</span>}
        </>
      )}
    </div>
  );
}
