import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { manageLink } from "@/lib/routing/managePathUtils";

export default function ManageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        This management section doesn't exist.
      </p>
      <Link to={manageLink("")}>
        <Button variant="outline" size="sm">
          Back to Management
        </Button>
      </Link>
    </div>
  );
}
