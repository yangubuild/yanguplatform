import { LayoutDashboard } from "lucide-react";

export default function ManageDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">Admin Dashboard</h2>
      <p className="text-muted-foreground">Overview and analytics coming soon.</p>
    </div>
  );
}
