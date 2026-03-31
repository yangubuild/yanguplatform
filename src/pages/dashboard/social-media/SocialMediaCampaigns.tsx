import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Rocket, Calendar, Target, LayoutGrid, Pause, Play, RefreshCw } from "lucide-react";
import { useCampaigns, useCampaignDetail } from "@/hooks/social/useCampaigns";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { campaignEngine, type CampaignInput, type CampaignGoal, type CampaignDuration } from "@/services/socialMedia/campaignEngine";
import { toast } from "sonner";

const GOAL_OPTIONS: { value: CampaignGoal; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "awareness", label: "Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "education", label: "Education" },
  { value: "launch", label: "Launch" },
  { value: "community", label: "Community" },
];

const DURATION_OPTIONS: { value: CampaignDuration; label: string }[] = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "instagram_story", label: "Instagram Story" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin_company", label: "LinkedIn" },
  { value: "x", label: "X" },
  { value: "tiktok", label: "TikTok" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-yellow-500/20 text-yellow-600",
  scheduled: "bg-blue-500/20 text-blue-600",
  active: "bg-green-500/20 text-green-600",
  paused: "bg-orange-500/20 text-orange-600",
  completed: "bg-accent/20 text-accent",
};

export default function SocialMediaCampaigns() {
  const { workspace } = useSocialWorkspace();
  const { campaigns, isLoading, create, isCreating, generate, isGenerating, togglePause } = useCampaigns(workspace?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Plan and auto-generate structured content campaigns</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <CreateCampaignForm
              workspaceId={workspace?.id || ""}
              onCreate={async (input) => {
                try {
                  await create(input);
                  setShowCreate(false);
                  toast.success("Campaign created! Review the plan and generate.");
                } catch (e: any) {
                  toast.error(e.message || "Failed to create campaign");
                }
              }}
              isCreating={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No campaigns yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create a campaign to auto-generate weeks of content</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              isGenerating={isGenerating}
              generationProgress={selectedCampaignId === c.id ? generationProgress : null}
              onGenerate={async () => {
                setSelectedCampaignId(c.id);
                setGenerationProgress({ current: 0, total: c.total_posts });
                try {
                  const result = await generate({
                    campaignId: c.id,
                    onProgress: (current, total) => setGenerationProgress({ current, total }),
                  });
                  toast.success(`Generated ${result.generated} posts (${result.failed} failed)`);
                } catch (e: any) {
                  toast.error(e.message || "Generation failed");
                } finally {
                  setGenerationProgress(null);
                  setSelectedCampaignId(null);
                }
              }}
              onTogglePause={async (paused) => {
                await togglePause({ campaignId: c.id, paused });
              }}
              onViewDetail={() => setSelectedCampaignId(selectedCampaignId === c.id ? null : c.id)}
              isExpanded={selectedCampaignId === c.id}
            />
          ))}
        </div>
      )}

      {/* Campaign Detail */}
      {selectedCampaignId && !generationProgress && (
        <CampaignDetailPanel campaignId={selectedCampaignId} />
      )}
    </div>
  );
}

// ── Create Campaign Form ─────────────────────────────────

function CreateCampaignForm({
  workspaceId,
  onCreate,
  isCreating,
}: {
  workspaceId: string;
  onCreate: (input: CampaignInput) => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<CampaignDuration>(7);
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [goal, setGoal] = useState<CampaignGoal>("engagement");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [topicFocus, setTopicFocus] = useState("");

  const totalPosts = duration * postsPerDay;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const startDate = tomorrow.toISOString();

  // Preview the plan
  const planPreview = campaignEngine.previewPlan({
    workspace_id: workspaceId,
    name,
    duration_days: duration,
    posts_per_day: postsPerDay,
    campaign_goal: goal,
    selected_template_ids: ["default"],
    selected_platforms: platforms,
    start_date: startDate,
    topic_focus: topicFocus,
  });

  const uniqueBuckets = [...new Set(planPreview.map((p) => p.content_bucket))];

  return (
    <div className="space-y-4">
      <div>
        <Label>Campaign Name</Label>
        <Input placeholder="e.g. March Sales Push" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Duration</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as CampaignDuration)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Posts / Day</Label>
          <Select value={String(postsPerDay)} onValueChange={(v) => setPostsPerDay(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Campaign Goal</Label>
        <Select value={goal} onValueChange={(v) => setGoal(v as CampaignGoal)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {GOAL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Topic Focus (optional)</Label>
        <Input placeholder="e.g. new arrivals, summer sale" value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)} />
      </div>

      <div>
        <Label>Platforms</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() =>
                setPlatforms((prev) =>
                  prev.includes(p.value) ? prev.filter((x) => x !== p.value) : [...prev, p.value]
                )
              }
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                platforms.includes(p.value)
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-muted/50 border-border text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total posts</span>
          <span className="font-semibold text-foreground">{totalPosts}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Content types</span>
          <span className="font-medium text-foreground">{uniqueBuckets.length} buckets</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {uniqueBuckets.map((b) => (
            <Badge key={b} variant="secondary" className="text-[10px]">
              {b.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!name || isCreating || platforms.length === 0}
        onClick={() =>
          onCreate({
            workspace_id: workspaceId,
            name,
            duration_days: duration,
            posts_per_day: postsPerDay,
            campaign_goal: goal,
            selected_template_ids: ["default"],
            selected_platforms: platforms,
            start_date: startDate,
            topic_focus: topicFocus,
          })
        }
      >
        {isCreating ? "Creating..." : `Create Campaign (${totalPosts} posts)`}
      </Button>
    </div>
  );
}

// ── Campaign Card ────────────────────────────────────────

function CampaignCard({
  campaign,
  isGenerating,
  generationProgress,
  onGenerate,
  onTogglePause,
  onViewDetail,
  isExpanded,
}: {
  campaign: any;
  isGenerating: boolean;
  generationProgress: { current: number; total: number } | null;
  onGenerate: () => void;
  onTogglePause: (paused: boolean) => void;
  onViewDetail: () => void;
  isExpanded: boolean;
}) {
  const statusClass = STATUS_COLORS[campaign.status] || STATUS_COLORS.draft;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground truncate">{campaign.name}</h3>
              <Badge className={`text-[10px] ${statusClass}`}>{campaign.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {campaign.duration_days}d
              </span>
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" />
                {campaign.posts_per_day}/day
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {campaign.total_posts} posts
              </span>
              <span className="capitalize">{campaign.campaign_goal}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === "draft" && (
              <Button size="sm" variant="default" onClick={onGenerate} disabled={isGenerating} className="gap-1">
                <Rocket className="h-3.5 w-3.5" />
                Generate
              </Button>
            )}
            {(campaign.status === "scheduled" || campaign.status === "active") && (
              <Button size="sm" variant="outline" onClick={() => onTogglePause(true)} className="gap-1">
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button size="sm" variant="outline" onClick={() => onTogglePause(false)} className="gap-1">
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onViewDetail}>
              {isExpanded ? "Hide" : "Details"}
            </Button>
          </div>
        </div>

        {/* Generation Progress */}
        {generationProgress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Generating posts...</span>
              <span>{generationProgress.current}/{generationProgress.total}</span>
            </div>
            <Progress value={(generationProgress.current / generationProgress.total) * 100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Campaign Detail Panel ────────────────────────────────

function CampaignDetailPanel({ campaignId }: { campaignId: string }) {
  const { data: detail, isLoading } = useCampaignDetail(campaignId);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading details...</div>;
  if (!detail) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Campaign Plan — {detail.name}</CardTitle>
        <CardDescription className="text-xs">
          {detail.stats.generated} generated · {detail.stats.scheduled} scheduled · {detail.stats.published} published · {detail.stats.failed} failed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="plan">
          <TabsList className="h-8">
            <TabsTrigger value="plan" className="text-xs">Content Plan</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-3">
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {detail.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-14 shrink-0">Day {item.day_number}</span>
                    <span className="text-muted-foreground w-10 shrink-0">#{item.slot_number}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.content_bucket.replace(/_/g, " ")}
                    </Badge>
                    {item.topic_angle && (
                      <span className="text-muted-foreground truncate max-w-[200px]">{item.topic_angle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        item.status === "generated"
                          ? "text-green-600 border-green-600/30"
                          : item.status === "failed"
                          ? "text-red-600 border-red-600/30"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-3">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(detail.stats).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-border p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{value}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{key}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
