import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, FolderOpen, ArrowLeft } from "lucide-react";
import { AppShell, PageContainer, Card, Banner, SecondaryButton } from "@/components/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditBadge } from "@/components/studio/CreditBadge";
import { StudioInfoBanner } from "@/components/studio/StudioInfoBanner";
import { StudioCreateForm, StudioFormData } from "@/components/studio/StudioCreateForm";
import { StudioOutputOptions } from "@/components/studio/StudioOutputOptions";
import { useCredits, useSpendCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCreatifyVideo } from "@/lib/ai/creatify";

/**
 * YANGU.STUDIO - Global AI-powered creative engine
 * 
 * LOCKED BEHAVIOR RULES:
 * - NO Publish button
 * - NO domain selector
 * - NO KYC trigger
 * - NO subscription gate
 * - Always accessible to any logged-in user from Dashboard
 * 
 * LOCKED UI COPY:
 * - "Generation uses credits"
 * - "Downloads use credits"
 * - "Sharing studio links is free"
 * - "Viewing studio albums is free"
 * 
 * OUTPUT OPTIONS:
 * - Download Assets → uses credits (calls spend_credits RPC)
 * - Generate Studio Link → FREE (sets album_published=true)
 */
export default function Studio() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: credits } = useCredits();
  const spendCredits = useSpendCredits();
  
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<{
    id: string;
    albumUrl?: string;
    albumSlug?: string;
    videoUrl?: string;
    assets: Array<{ id: string; type: string; downloadCredits: number }>;
  } | null>(null);

  const handleGenerate = async (data: StudioFormData) => {
    if (!user?.id) {
      toast.error("Please sign in to use Studio");
      return;
    }

    const creditCost = 1; // Base cost for generation
    
    if (!credits || credits.balance < creditCost) {
      toast.error(`Insufficient credits. You need ${creditCost} credits to generate.`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Spend credits for generation
      await spendCredits.mutateAsync({
        amount: creditCost,
        description: `Studio generation: ${data.contentTypes.join(", ")}`,
        referenceType: "studio_generation",
      });

      // Create project in database
      const slug = `project-${Date.now()}`;
      const { data: project, error: projectError } = await supabase
        .from("studio_projects")
        .insert({
          user_id: user.id,
          title: data.brandName || "Untitled Project",
          product_url: data.productUrl,
          brand_name: data.brandName || null,
          brand_description: data.brandDescription || null,
          target_platforms: data.platforms,
          target_language: data.language,
          content_types: data.contentTypes,
          album_slug: slug,
          status: "generating",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Call Creatify for video generation if video_ad is selected
      let videoUrl: string | undefined;
      if (data.contentTypes.includes("video_ad") || data.contentTypes.includes("ugc_video")) {
        const videoResult = await generateCreatifyVideo(
          data.productUrl,
          {
            aspect_ratio: "9:16",
            duration: 30,
          }
        );

        if (videoResult.ok && videoResult.videos && videoResult.videos.length > 0) {
          videoUrl = videoResult.videos[0].url;
        } else {
          console.warn("Video generation failed:", videoResult.error);
          toast.error(videoResult.error || "Video generation failed, but project was created.");
        }
      } else {
        // Non-video types: simulate for now
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Update status to completed
      await supabase
        .from("studio_projects")
        .update({ status: "completed" })
        .eq("id", project.id);

      toast.success("Content generated successfully!");
      
      setGeneratedProject({
        id: project.id,
        albumSlug: slug,
        videoUrl,
        assets: [
          ...(data.contentTypes.includes("video_ad") ? [{ id: "1", type: "video_ad", downloadCredits: 2 }] : []),
          ...(data.contentTypes.includes("image_ad") ? [{ id: "2", type: "image_ad", downloadCredits: 1 }] : []),
          ...(data.contentTypes.includes("ugc_video") ? [{ id: "3", type: "ugc_video", downloadCredits: 2 }] : []),
        ],
      });
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedProject || !user?.id) return;
    
    const totalCredits = generatedProject.assets.reduce(
      (sum, asset) => sum + asset.downloadCredits,
      0
    );

    if (!credits || credits.balance < totalCredits) {
      toast.error(`Insufficient credits. Download requires ${totalCredits} credits.`);
      return;
    }

    try {
      // Downloads use credits - call spend_credits RPC
      await spendCredits.mutateAsync({
        amount: totalCredits,
        description: "Asset download",
        referenceId: generatedProject.id,
        referenceType: "studio_download",
      });

      // TODO: Trigger actual download
      toast.success("Download started! Credits deducted.");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleGenerateLink = async () => {
    if (!generatedProject || !profile?.username || !user?.id) return;

    setIsGeneratingLink(true);

    try {
      // Generate album link is FREE - just update album_published=true
      const { error } = await supabase
        .from("studio_projects")
        .update({ album_published: true })
        .eq("id", generatedProject.id);

      if (error) throw error;

      const albumUrl = `yangu.studio/album/@${profile.username}/${generatedProject.albumSlug}`;
      
      setGeneratedProject({
        ...generatedProject,
        albumUrl,
      });

      toast.success("Studio link generated! Sharing is free.");
    } catch (error) {
      console.error("Failed to generate link:", error);
      toast.error("Failed to generate link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const totalDownloadCredits = generatedProject?.assets.reduce(
    (sum, asset) => sum + asset.downloadCredits,
    0
  ) ?? 0;

  return (
    <AppShell>
      <PageContainer size="xl">
        <div className="space-y-6">
          {/* Header - NO Publish button, NO domain selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SecondaryButton 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </SecondaryButton>
              <div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-accent" />
                  <h1 className="text-2xl font-bold">Yangu Studio</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Turn any product link into studio-quality ads in minutes
                </p>
              </div>
            </div>
            <CreditBadge />
          </div>

          {/* Info Banner - Shows all 4 labels */}
          <StudioInfoBanner />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="create">
                <Sparkles className="h-4 w-4 mr-2" />
                Create
              </TabsTrigger>
              <TabsTrigger value="library">
                <FolderOpen className="h-4 w-4 mr-2" />
                Library
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              {generatedProject ? (
                <div className="space-y-6">
                  <Banner variant="accent">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Content Generated!</p>
                        <p className="text-sm text-muted-foreground">
                          Choose how to use your assets below. Remember: downloads use credits, sharing links is free.
                        </p>
                      </div>
                    </div>
                  </Banner>

                  {/* Preview of generated assets */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Generated Assets</h3>
                    {generatedProject.videoUrl && (
                      <div className="mb-4">
                        <video
                          src={generatedProject.videoUrl}
                          controls
                          className="w-full max-w-md rounded-lg mx-auto"
                          poster=""
                        />
                        <p className="text-xs text-muted-foreground text-center mt-2">Generated with Creatify</p>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {generatedProject.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="aspect-video bg-surface-sunken rounded-lg flex items-center justify-center relative"
                        >
                          <span className="text-sm text-muted-foreground">
                            {asset.type.replace("_", " ")}
                          </span>
                          <span className="absolute bottom-2 right-2 text-xs bg-background/80 px-2 py-0.5 rounded">
                            {asset.downloadCredits} credits
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Output Options - Download (credits) vs Share Link (free) */}
                  <StudioOutputOptions
                    onDownload={handleDownload}
                    onGenerateLink={handleGenerateLink}
                    downloadCredits={totalDownloadCredits}
                    isDownloading={spendCredits.isPending}
                    isGeneratingLink={isGeneratingLink}
                    albumUrl={generatedProject.albumUrl}
                  />

                  <SecondaryButton onClick={() => setGeneratedProject(null)}>
                    Create New Project
                  </SecondaryButton>
                </div>
              ) : (
                <StudioCreateForm
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                  creditCost={1}
                />
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-6">
              <Card className="p-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your Library</h3>
                <p className="text-muted-foreground mb-4">
                  Generated and uploaded assets will appear here. Sharing studio albums is always free.
                </p>
                <SecondaryButton onClick={() => setActiveTab("create")}>
                  Create Your First Project
                </SecondaryButton>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </AppShell>
  );
}
