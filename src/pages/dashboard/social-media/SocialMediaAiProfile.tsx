import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSocialBrandProfile } from "@/hooks/social/useSocialBrandProfile";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { AIProfileWritingTab } from "@/components/social-media/ai-profile/AIProfileWritingTab";
import { AIProfileVisualsTab } from "@/components/social-media/ai-profile/AIProfileVisualsTab";
import { AIProfileUrlAnalyzer } from "@/components/social-media/ai-profile/AIProfileUrlAnalyzer";
import { useAIProfileAnalyzer, type AnalyzedProfile } from "@/hooks/social/useAIProfileAnalyzer";

export default function SocialMediaAiProfile() {
  const [tab, setTab] = useState("writing");
  const { profile, isLoading, updateProfile, isSaving } = useSocialBrandProfile();
  const { workspace } = useSocialWorkspace();
  const { analyzeUrl, isAnalyzing } = useAIProfileAnalyzer();

  const [localProfile, setLocalProfile] = useState<Record<string, unknown>>({});

  // Merge DB profile + local edits
  const merged = { ...profileToFlat(profile), ...localProfile };

  const handleAnalyzed = (analyzed: AnalyzedProfile) => {
    setLocalProfile({
      business_name: analyzed.business_name,
      industry: analyzed.industry,
      business_description: analyzed.business_description,
      target_audience: analyzed.target_audience,
      tone_of_voice: analyzed.tone_of_voice,
      brand_voice: analyzed.brand_voice,
      caption_rules: analyzed.caption_rules || [],
      preferred_ctas: analyzed.preferred_ctas || [],
      brand_keywords: analyzed.brand_keywords || [],
      hashtag_rules: analyzed.hashtag_rules,
      emoji_policy: analyzed.emoji_policy,
      language: analyzed.language || "English",
      positioning: analyzed.positioning,
      website: analyzed.website,
      visual_style: analyzed.visual_style,
    });
  };

  const handleSave = async () => {
    await updateProfile({
      tone_of_voice: (merged.tone_of_voice as string) || undefined,
      brand_voice: (merged.brand_voice as string) || undefined,
      caption_rules: (merged.caption_rules as string[]) || [],
      preferred_ctas: (merged.preferred_ctas as string[]) || [],
      brand_keywords: (merged.brand_keywords as string[]) || [],
      hashtag_rules: (merged.hashtag_rules as string) || undefined,
      emoji_policy: (merged.emoji_policy as string) || undefined,
      language: (merged.language as string) || undefined,
      positioning: (merged.positioning as string) || undefined,
      visual_style: (merged.visual_style as string) || undefined,
      audience_notes: (merged.target_audience as string) || undefined,
      banned_terms: (merged.banned_terms as string[]) || [],
      negative_keywords: (merged.negative_keywords as string[]) || [],
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground">AI Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust how AI generates captions and designs for your content. Changes made will only affect future generated posts.
        </p>
      </div>

      {/* URL Analyzer */}
      <AIProfileUrlAnalyzer
        onAnalyzed={handleAnalyzed}
        analyzeUrl={analyzeUrl}
        isAnalyzing={isAnalyzing}
        defaultUrl={(merged.website as string) || workspace?.business_website || ""}
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 px-0 h-auto pb-0">
          <TabsTrigger
            value="writing"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent bg-transparent px-1 pb-2.5 text-sm font-medium"
          >
            Writing
          </TabsTrigger>
          <TabsTrigger
            value="visuals"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent bg-transparent px-1 pb-2.5 text-sm font-medium"
          >
            Visuals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="writing" className="mt-6">
          <AIProfileWritingTab
            profile={merged}
            onUpdate={(key, val) => setLocalProfile((p) => ({ ...p, [key]: val }))}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="visuals" className="mt-6">
          <AIProfileVisualsTab
            profile={merged}
            onUpdate={(key, val) => setLocalProfile((p) => ({ ...p, [key]: val }))}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function profileToFlat(profile: ReturnType<typeof useSocialBrandProfile>["profile"]): Record<string, unknown> {
  if (!profile) return {};
  return {
    tone_of_voice: profile.tone_of_voice || "",
    brand_voice: profile.brand_voice || "",
    caption_rules: profile.caption_rules || [],
    preferred_ctas: profile.preferred_ctas || [],
    brand_keywords: profile.brand_keywords || [],
    banned_terms: profile.banned_terms || [],
    negative_keywords: profile.negative_keywords || [],
    hashtag_rules: profile.hashtag_rules || "",
    emoji_policy: profile.emoji_policy || "light",
    language: profile.language || "English",
    positioning: profile.positioning || "",
    visual_style: profile.visual_style || "",
    target_audience: profile.target_audience || profile.audience_notes || "",
    business_name: (profile.metadata as Record<string, unknown>)?.business_name || "",
    industry: (profile.metadata as Record<string, unknown>)?.industry || "",
    business_description: (profile.metadata as Record<string, unknown>)?.business_description || "",
    website: (profile.metadata as Record<string, unknown>)?.website || "",
    email: (profile.metadata as Record<string, unknown>)?.email || "",
    phone: (profile.metadata as Record<string, unknown>)?.phone || "",
  };
}
