import { BarChart3, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalyticsEmptyStateProps {
  hasAccounts: boolean;
}

export function AnalyticsEmptyState({ hasAccounts }: AnalyticsEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <BarChart3 className="w-10 h-10 text-accent/60" />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {hasAccounts
          ? "No analytics data yet. Publish some posts and check back soon to track your growth."
          : "Let's get those numbers rolling! Connect your social accounts to track your growth."}
      </p>
      {!hasAccounts && (
        <Button
          variant="accent"
          onClick={() => navigate("/dashboard/social-media/workspace")}
        >
          <Link2 className="w-4 h-4 mr-2" />
          Connect Socials
        </Button>
      )}
    </div>
  );
}
