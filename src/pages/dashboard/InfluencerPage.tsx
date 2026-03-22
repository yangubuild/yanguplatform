import { useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";

/**
 * Influencer entry page.
 * Now shows the unified BuilderEntryScreen with "Build with AI" / "Build Manually"
 * instead of auto-redirecting.
 */
export default function InfluencerPage() {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const engine = getEngine("influencer")!;

  const handleComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    const displayName = String(answers.display_name || "My Influencer Page");
    const slug = String(answers.slug || "profile");

    const seedSections = engine.defaultSections.map((s) => {
      const schema = { ...s.schema };
      if (s.type === "hero") schema.headline = displayName;
      return { type: s.type, schema, core_slot: s.core_slot };
    });

    // Build links from answers
    const linkItems: { label: string; url: string }[] = [];
    const linkKeys = ["link_instagram", "link_tiktok", "link_youtube", "link_twitter", "link_facebook", "link_website"];
    const linkLabels = ["Instagram", "TikTok", "YouTube", "Twitter / X", "Facebook", "Website"];
    linkKeys.forEach((key, i) => {
      if (answers[key]) linkItems.push({ label: linkLabels[i], url: String(answers[key]) });
    });

    // Inject links into the links section
    const linksSection = seedSections.find((s) => s.type === "links");
    if (linksSection && linkItems.length > 0) {
      linksSection.schema.items = linkItems;
    }

    const metadata: Record<string, unknown> = {};
    if (answers.primary_color) metadata.brand = { primary_color: answers.primary_color };
    if (answers.niche) metadata.niche = answers.niche;
    if (answers._ai_setup) metadata.ai_setup = true;

    await initAndNavigate({
      surfaceType: engine.surfaceType,
      slug,
      title: displayName,
      seedSections,
      metadata,
    });
  }, [user, engine, initAndNavigate]);

  return <div className="min-h-screen bg-background" ><BuilderEntryScreen engine={engine} onComplete={handleComplete} /></div>;
}
