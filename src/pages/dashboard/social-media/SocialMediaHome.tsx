import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  Link2,
  Users,
  Flame,
  Settings,
  Zap,
  Info,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSocialOnboarding } from "@/hooks/useSocialOnboarding";
import { useSocialHomeSummary } from "@/hooks/social/useSocialHomeSummary";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { SocialOnboardingFlow } from "@/components/social-media/SocialOnboardingFlow";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SocialMediaHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnboarded, showOnboarding, setShowOnboarding } = useSocialOnboarding();
  const { summary, recentPosts, isLoading } = useSocialHomeSummary();
  const { workspace } = useSocialWorkspace();

  if (!isOnboarded || showOnboarding) {
    return <SocialOnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  const published = summary?.published_count || 0;
  const scheduled = summary?.scheduled_count || 0;
  const drafts = summary?.drafts_count || 0;
  const targetPosts = 7; // weekly target
  const tankPercent = Math.min(100, Math.round((scheduled / targetPosts) * 100));

  // Consistency score: simple heuristic based on published, scheduled, connected accounts
  const consistencyScore = Math.min(
    100,
    Math.round(
      (published > 0 ? 30 : 0) +
        (scheduled > 0 ? 20 : 0) +
        (summary?.connected_accounts_count ? 15 : 0) +
        (summary?.ai_profile_complete ? 10 : 0) +
        (summary?.topics_count ? 10 : 0) +
        Math.min(15, published * 0.5)
    )
  );

  const consistencyText =
    consistencyScore >= 80
      ? "Your social game is on fire!"
      : consistencyScore >= 50
      ? "Good momentum — keep going!"
      : consistencyScore >= 25
      ? "Building up — post more to improve"
      : "Just getting started";

  const businessName = workspace?.name || "Your Business";
  const userName = user?.email?.split("@")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent font-bold text-lg">
          {businessName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{businessName}</h1>
          <p className="text-xs text-muted-foreground">Logged in as {userName}</p>
        </div>
      </div>

      {/* ── Welcome ── */}
      <h2 className="text-base font-semibold text-foreground mb-4">
        Welcome to YANGU!
      </h2>

      {/* ── CTA Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate("/dashboard/settings/billing")}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">View Plans</div>
            <div className="text-xs text-muted-foreground">Free trial · Unlock more features</div>
          </div>
        </button>
        <button
          onClick={() => navigate("/dashboard/social-media/workspace")}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Manage Workspace</div>
            <div className="text-xs text-muted-foreground">Configure your social engine</div>
          </div>
        </button>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Posting Streak */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Posting Streak</span>
            <Info className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold text-foreground">{published}</span>
            <span className="text-sm text-muted-foreground">posts</span>
          </div>
        </div>

        {/* Post Tank */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Post Tank</span>
              <Info className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <button
              onClick={() => navigate("/dashboard/social-media/workspace")}
              className="text-muted-foreground/50 hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-foreground">{scheduled}</span>
            <span className="text-sm text-muted-foreground">/{targetPosts} scheduled posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={tankPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{tankPercent}%</span>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Consistency Score</span>
            <Info className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-baseline gap-1">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-foreground">{consistencyScore}</span>
            </div>
            <span className="text-xs text-muted-foreground">{consistencyText}</span>
          </div>
          {/* Gradient bar */}
          <div className="h-2 rounded-full overflow-hidden bg-muted/30 relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${consistencyScore}%`,
                background: "linear-gradient(90deg, hsl(0 80% 55%), hsl(35 90% 55%), hsl(50 90% 55%), hsl(120 60% 45%))",
              }}
            />
            {/* Marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground"
              style={{ left: `${consistencyScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <h3 className="text-sm font-bold text-foreground mb-3">Quick Links</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            icon: Plus,
            label: "New Post",
            desc: "Create a new post from scratch",
            path: "/dashboard/social-media/posts/create",
          },
          {
            icon: Sparkles,
            label: "Create Posts with AI",
            desc: "Create new posts with AI",
            path: "/dashboard/social-media/posts/create?mode=auto",
          },
          {
            icon: Link2,
            label: "Connect Socials",
            desc: "Connect your social media accounts",
            path: "/dashboard/social-media/workspace",
          },
          {
            icon: Users,
            label: "Invite to Business",
            desc: "Invite someone to your business",
            path: "/dashboard/social-media/workspace",
          },
        ].map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-all text-left"
          >
            <link.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">{link.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{link.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Recently Published ── */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Recently published</h3>
        <button
          onClick={() => navigate("/dashboard/social-media/analytics")}
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          <BarChart3 className="h-3 w-3" /> View stats
        </button>
      </div>

      {recentPosts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No published posts yet. Start creating to see them here.
          </p>
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate("/dashboard/social-media/posts/create?mode=auto")}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate your first post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentPosts.slice(0, 6).map((post) => {
            const img = post.primary_media_url || post.media_urls?.[0];
            return (
              <button
                key={post.id}
                onClick={() => navigate("/dashboard/social-media/posts")}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-accent/30 transition-colors text-left"
              >
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="w-full h-36 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-36 bg-muted/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-foreground line-clamp-2 mb-1">
                    {post.caption?.slice(0, 80) || "Post"}
                    {(post.caption?.length || 0) > 80 ? "…" : ""}
                  </p>
                  {post.published_at && (
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(post.published_at), "MMMM d 'at' h:mm a")}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Suggestions for inactive users ── */}
      {published === 0 && scheduled === 0 && drafts === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-accent/30 bg-accent/5 p-5 text-center">
          <Sparkles className="h-6 w-6 text-accent mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Your content engine is ready
          </h3>
          <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
            Set up your AI Profile, add topics, and let AI generate your first batch of posts automatically.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/social-media/ai-profile")}
              className="text-xs"
            >
              Set up AI Profile
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate("/dashboard/social-media/posts/create?mode=auto")}
              className="text-xs"
            >
              Create with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
