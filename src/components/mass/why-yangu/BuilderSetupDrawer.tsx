import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BUILDER_FEATURES } from "./WhyYanguContent";
import { useAuth } from "@/hooks/useAuth";
import { Check, ArrowRight, Bookmark } from "lucide-react";

interface BuilderSetupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedKeys: Set<string>;
}

export function BuilderSetupDrawer({ open, onOpenChange, selectedKeys }: BuilderSetupDrawerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const selectedFeatures = BUILDER_FEATURES.filter((f) => selectedKeys.has(f.key));

  const handleContinue = () => {
    // Persist selections
    localStorage.setItem("builder_selected_features", JSON.stringify(Array.from(selectedKeys)));

    if (isAuthenticated) {
      navigate("/dashboard/onboarding?builderSetup=1");
    } else {
      navigate("/auth/signup?returnTo=" + encodeURIComponent("/dashboard/onboarding?builderSetup=1"));
    }
    onOpenChange(false);
  };

  const handleSaveForLater = () => {
    localStorage.setItem("builder_selected_features", JSON.stringify(Array.from(selectedKeys)));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l"
        style={{
          background: "#0a170f",
          borderColor: "rgba(255,255,255,0.1)" }}
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-foreground text-xl">Your yangu setup</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            You'll finish setup inside your yangu account.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mb-8">
          {selectedFeatures.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#F46D2A" }}
              >
                <Check className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button variant="accent" className="w-full gap-2" onClick={handleContinue}>
            Continue to setup <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-muted-foreground border border-white/10 hover:bg-white/5"
            onClick={handleSaveForLater}
          >
            <Bookmark className="w-4 h-4" /> Save for later
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
