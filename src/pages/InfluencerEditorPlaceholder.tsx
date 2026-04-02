import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";

export default function InfluencerEditorPlaceholder() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">Influencer Bio Editor</h1>
          <p className="text-sm text-muted-foreground">
            The mobile-first bio link editor is coming soon. You'll be able to manage your links, media, and live content here.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>Surface: {surfaceId?.slice(0, 8)}…</span>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </Card>
    </div>
  );
}
