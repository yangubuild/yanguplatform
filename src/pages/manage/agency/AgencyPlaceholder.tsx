import { useLocation, Link } from "react-router-dom";
import { Construction } from "lucide-react";

export default function AgencyPlaceholder() {
  const location = useLocation();
  const section = location.pathname.replace(/^\/agency\/?/, "").replace(/-/g, " ") || "section";

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Construction className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground capitalize">{section}</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        This section is under development and will be available soon.
      </p>
      <Link to="/agency" className="text-sm text-accent hover:underline mt-2">
        ← Back to Agency Dashboard
      </Link>
    </div>
  );
}
