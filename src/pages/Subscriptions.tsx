import { AppShell, PageContainer, Card, PrimaryButton } from "@/components/primitives";
import { ArrowLeft, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Subscriptions() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageContainer size="md">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold">Subscriptions</h1>
            </div>
          </div>

          <Card className="p-8 text-center space-y-4">
            <Crown className="h-12 w-12 mx-auto text-accent" />
            <h2 className="text-xl font-semibold">Upgrade Your Plan</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You've reached your monthly generation limit. Upgrade your subscription to unlock more images, videos, and other AI-powered content.
            </p>
            <PrimaryButton size="lg" onClick={() => navigate("/billing")}>
              View Plans & Upgrade
            </PrimaryButton>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
