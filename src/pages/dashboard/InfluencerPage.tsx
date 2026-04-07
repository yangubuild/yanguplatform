import { useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";
import BuilderNewPage from "@/pages/BuilderNewPage";

/**
 * Influencer entry page.
 * Uses the shared start flow: "Build with AI" / "Build with Chat".
 */
export default function InfluencerPage() {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const [searchParams, setSearchParams] = useSearchParams();
  const engine = getEngine("influencer")!;
  const mode = searchParams.get("mode");

  const handleComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    const displayName = String(answers.display_name || "My Influencer Page");
    const slug = String(answers.slug || "profile");

    const seedSections = engine.defaultSections.map((s) => {
      const schema = { ...s.schema };
      if (s.type === "hero") schema.headline = displayName;
      return { type: s.type, schema, core_slot: s.core_slot };
    });

    const linkItems: { label: string; url: string }[] = [];
    const linkKeys = ["link_instagram", "link_tiktok", "link_youtube", "link_twitter", "link_facebook", "link_website"];
    const linkLabels = ["Instagram", "TikTok", "YouTube", "Twitter / X", "Facebook", "Website"];
    linkKeys.forEach((key, i) => {
      if (answers[key]) linkItems.push({ label: linkLabels[i], url: String(answers[key]) });
    });

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

  const handleChatPath = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", "ai");
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const handleAiImportSource = useCallback((source: string) => {
    toast.info(`${source} import coming soon`);
  }, []);

  if (mode === "ai") {
    return <BuilderNewPage embedded initialCategory="influencer" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <BuilderEntryScreen
        engine={engine}
        onComplete={handleComplete}
        onChatPath={handleChatPath}
        onAiImportSource={handleAiImportSource}
      />
    </div>
  );
}
