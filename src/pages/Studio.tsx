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
import { toast } from "sonner";

/**
 * YANGU.STUDIO - Global AI-powered creative engine
 * 
 * IMPORTANT RULES:
 * - NO Publish button
 * - NO domain selector
 * - NO KYC trigger
 * - NO subscription gate
 * - Credits ONLY for generation/download
 * - Sharing studio links is FREE
 */
export default function Studio() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: credits } = useCredits();
  const spendCredits = useSpendCredits();
  
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<{
    id: string;
    albumUrl?: string;
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

      // TODO: Call AI generation edge function
      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("Content generated successfully!");
      
      // Mock generated project
      setGeneratedProject({
        id: "mock-project-id",
        assets: [
          { id: "1", type: "video_ad", downloadCredits: 2 },
          { id: "2", type: "image_ad", downloadCredits: 1 },
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
    if (!generatedProject) return;
    
    const totalCredits = generatedProject.assets.reduce(
      (sum, asset) => sum + asset.downloadCredits,
      0
    );

    if (!credits || credits.balance < totalCredits) {
      toast.error(`Insufficient credits. Download requires ${totalCredits} credits.`);
      return;
    }

    try {
      await spendCredits.mutateAsync({
        amount: totalCredits,
        description: "Asset download",
        referenceId: generatedProject.id,
        referenceType: "studio_download",
      });

      // TODO: Trigger actual download
      toast.success("Download started!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleGenerateLink = async () => {
    if (!generatedProject || !profile?.username) return;

    // Generate album link is FREE
    const slug = `project-${Date.now()}`;
    const albumUrl = `yangu.studio/album/@${profile.username}/${slug}`;
    
    setGeneratedProject({
      ...generatedProject,
      albumUrl,
    });

    toast.success("Studio link generated! Sharing is free.");
  };

  const totalDownloadCredits = generatedProject?.assets.reduce(
    (sum, asset) => sum + asset.downloadCredits,
    0
  ) ?? 0;

  return (
    <AppShell>
      <PageContainer size="xl">
        <div className="space-y-6">
          {/* Header */}
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

          {/* Info Banner - Always visible */}
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
                          Choose how to use your assets below.
                        </p>
                      </div>
                    </div>
                  </Banner>

                  {/* Preview of generated assets would go here */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Generated Assets</h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {generatedProject.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="aspect-video bg-surface-sunken rounded-lg flex items-center justify-center"
                        >
                          <span className="text-sm text-muted-foreground">
                            {asset.type.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Output Options */}
                  <StudioOutputOptions
                    onDownload={handleDownload}
                    onGenerateLink={handleGenerateLink}
                    downloadCredits={totalDownloadCredits}
                    isDownloading={spendCredits.isPending}
                    albumUrl={generatedProject.albumUrl}
                  />

                  <SecondaryButton onClick={() => setGeneratedProject(null)}>
                    Create New
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
                  Generated and uploaded assets will appear here.
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
