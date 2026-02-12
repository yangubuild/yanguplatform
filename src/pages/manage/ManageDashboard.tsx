import { LayoutDashboard } from "lucide-react";

export default function ManageDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Dashboard — Coming soon</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        This module will be enabled in the next step.
      </p>
    </div>
  );
}
