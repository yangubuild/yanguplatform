import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ConsoleApps from "@/pages/developers/console/ConsoleApps";

export default function PortalApps() {
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  // If ?new=1, we could auto-open the create form — ConsoleApps handles this via its own state
  // For now, just render the existing ConsoleApps which already has full CRUD
  return <ConsoleApps />;
}
