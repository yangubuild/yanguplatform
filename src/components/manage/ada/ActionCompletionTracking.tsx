import { CheckSquare, FileImage, ListChecks, ShoppingCart } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";

export function ActionCompletionTracking() {
  return (
    <AdaGlassModule title="Action Completion Tracking" icon={CheckSquare}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Pages Created" value={186} icon={FileImage} trend="Via ADA this week" severity="success" />
        <KpiCard label="Images Generated" value="1,842" icon={FileImage} trend="Total outputs" />
        <KpiCard label="Tasks Completed" value={412} icon={ListChecks} trend="92% completion rate" severity="success" />
        <KpiCard label="Orders Started" value="64 / 48" icon={ShoppingCart} trend="Started vs Completed" severity="warning" />
      </div>
    </AdaGlassModule>
  );
}
