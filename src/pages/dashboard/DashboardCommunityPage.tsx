import { useState, useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";
import { BuilderAiOnboarding } from "@/components/builder/BuilderAiOnboarding";
import { SpeakToBuild } from "@/components/builder/speak-to-build/SpeakToBuild";
import { Store, Users } from "lucide-react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import BuilderNewPage from "@/pages/BuilderNewPage";

/**
 * Community page: lets user choose between creating a listing or a community group,
 * then shows the engine-driven entry screen with the shared start flow.
 */
export default function DashboardCommunityPage() {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFlow, setSelectedFlow] = useState<"community" | "listing" | null>(null);
  const mode = searchParams.get("mode");

  const communityEngine = getEngine("community")!;

  const handleCommunityComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    const name = String(answers.community_name || "My Community");
    const slug = String(answers.slug || "my-community");

    const seedSections = communityEngine.defaultSections.map((s) => {
      const schema = { ...s.schema };
      if (s.type === "hero") schema.headline = name;
      if (s.type === "about" && schema.heading === "About Us" && answers.description) {
        schema.body = answers.description;
      }
      return { type: s.type, schema, core_slot: s.core_slot };
    });

    const metadata: Record<string, unknown> = {
      community_type: answers.community_type || "open",
    };
    if (answers.primary_color) metadata.brand = { primary_color: answers.primary_color };
    if (answers._ai_setup) metadata.ai_setup = true;

    await initAndNavigate({
      surfaceType: "community_group",
      slug,
      title: name,
      seedSections,
      metadata,
    });
  }, [user, communityEngine, initAndNavigate]);

  const handleListingCreate = useCallback(async () => {
    if (!user?.id) { toast.error("You must be logged in"); return; }
    await initAndNavigate({
      surfaceType: "community_listing",
      slug: "my-listing",
      title: "My Listing",
      seedSections: [
        { type: "header", schema: { logo_url: "", logo_position: "left", logo_size: "medium", show_name: true, name_next_to_logo: true }, core_slot: "header" },
        { type: "hero", schema: { headline: "Welcome", subheadline: "Discover what we offer" }, core_slot: "hero" },
        { type: "text", schema: { heading: "Our Offer", body: "" }, core_slot: "main_content" },
        { type: "offer", schema: { heading: "What We Offer", description: "", items: [] }, core_slot: "offer" },
        { type: "footer", schema: { heading: "Footer", email: "", phone: "", address: "", hours: [], social: {} }, core_slot: "footer" },
      ],
    });
  }, [user, initAndNavigate]);

  const handleChatPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "ai");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const handleAiPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "ai_onboarding");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const handleSpeakPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "speak");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  // Chat flow embedded
  if (mode === "ai" && selectedFlow === "community") {
    return <BuilderNewPage embedded initialCategory="community" onBack={() => { const next = new URLSearchParams(searchParams); next.delete("mode"); setSearchParams(next, { replace: true }); }} />;
  }

  if (mode === "ai_onboarding" && selectedFlow === "community") {
    return (
      <div className="min-h-screen bg-background">
        <BuilderAiOnboarding
          engine={communityEngine}
          onComplete={handleCommunityComplete}
          onBack={() => { const next = new URLSearchParams(searchParams); next.delete("mode"); setSearchParams(next, { replace: true }); }}
          onChatPath={handleChatPath}
        />
      </div>
    );
  }

  if (mode === "speak" && selectedFlow === "community") {
    return (
      <div className="min-h-screen bg-background">
        <SpeakToBuild
          initialCategory="community"
          onComplete={handleCommunityComplete}
          onBack={() => { const next = new URLSearchParams(searchParams); next.delete("mode"); setSearchParams(next, { replace: true }); }}
        />
      </div>
    );
  }

  if (selectedFlow === "community") {
    return (
      <div>
        <button
          onClick={() => setSelectedFlow(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground ml-4 mt-4 transition-colors"
        >
          ← Back
        </button>
        <BuilderEntryScreen
          engine={communityEngine}
          onComplete={handleCommunityComplete}
          onChatPath={handleChatPath}
          onAiPath={handleAiPath}
          onSpeakPath={handleSpeakPath}
        />
      </div>
    );
  }

  // Default: show type picker
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8 min-h-screen bg-background">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="text-muted-foreground mt-1">
          Create listings or launch your own branded community — both powered by the Builder.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        <Card className="p-5 sm:p-6 flex flex-col gap-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={handleListingCreate}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">List on Community</h2>
          </div>
          <p className="text-sm text-muted-foreground flex-1">
            Create a listing surface for your courses, services, or products.
          </p>
          <Button className="w-full">Create Listing</Button>
        </Card>

        <Card className="p-5 sm:p-6 flex flex-col gap-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedFlow("community")}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Create a Community</h2>
          </div>
          <p className="text-sm text-muted-foreground flex-1">
            Launch a branded community space for your organisation or audience.
          </p>
          <Button variant="outline" className="w-full">Get Started</Button>
        </Card>
      </div>
    </div>
  );
}
