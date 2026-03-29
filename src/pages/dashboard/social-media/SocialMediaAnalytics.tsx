import { BarChart3, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SocialMediaAnalytics() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-lg font-semibold text-foreground mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground mb-6">View your social media performance</p>

      {/* Filters shell */}
      <div className="flex items-center gap-3 mb-8">
        <div className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">No socials connected</div>
        <div className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">Past 30 Days</div>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
          <BarChart3 className="w-10 h-10 text-accent/60" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          Let's get those numbers rolling! Connect your social accounts to track your growth.
        </p>
        <Button variant="accent" onClick={() => navigate("/dashboard/social-media/workspace")}>
          <Link2 className="w-4 h-4 mr-2" />
          Connect Socials
        </Button>
      </div>
    </div>
  );
}
