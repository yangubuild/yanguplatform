import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active:    "bg-success/15 text-success border-success/20",
  published: "bg-success/15 text-success border-success/20",
  approved:  "bg-success/15 text-success border-success/20",
  paused:    "bg-warning/15 text-warning border-warning/20",
  verifying: "bg-warning/15 text-warning border-warning/20",
  pending:   "bg-warning/15 text-warning border-warning/20",
  draft:     "bg-muted text-muted-foreground border-border",
  archived:  "bg-muted text-muted-foreground border-border",
  removed:   "bg-destructive/15 text-destructive border-destructive/20",
  error:     "bg-destructive/15 text-destructive border-destructive/20",
  rejected:  "bg-destructive/15 text-destructive border-destructive/20",
};

interface AdminStatusBadgeProps {
  status: string;
  className?: string;
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const key = status.toLowerCase();
  const styles = statusStyles[key] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        styles,
        className,
      )}
    >
      {status}
    </span>
  );
}
