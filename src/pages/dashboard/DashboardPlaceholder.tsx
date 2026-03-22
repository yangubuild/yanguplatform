import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function DashboardPlaceholder() {
  const location = useLocation();
  const segment = location.pathname.split("/").filter(Boolean).pop() || "Page";
  const title = segment.charAt(0).toUpperCase() + segment.slice(1);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center min-h-screen" style={{ background: "#08120D" }}>
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "#232a30" }}
      >
        <Construction className="h-8 w-8" style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        This section is coming soon.
      </p>
    </div>
  );
}
