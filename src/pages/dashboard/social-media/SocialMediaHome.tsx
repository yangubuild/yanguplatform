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
  const targetPosts = 7;
  const tankPercent = Math.min(100, Math.round((scheduled / targetPosts) * 100));

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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent font-bold text-base sm:text-lg shrink-0">
          {businessName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-foreground truncate">{businessName}</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Logged in as {userName}</p>
        </div>
      </div>

      {/* ── Welcome ── */}
      <h2 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">
        Welcome to YANGU!
      </h2>

      {/* ── CTA Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        <button
          onClick={() => navigate("/dashboard/settings/billing")}
          className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors text-left min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">View Plans</div>
            <div className="text-[11px] text-muted-foreground truncate">Free trial · Unlock more features</div>
          </div>
        </button>
        <button
          onClick={() => navigate("/dashboard/social-media/workspace")}
          className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors text-left min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">Manage Workspace</div>
            <div className="text-[11px] text-muted-foreground truncate">Configure your social engine</div>
          </div>
        </button>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {/* Posting Streak */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Posting Streak</span>
            <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
            <span className="text-xl sm:text-2xl font-bold text-foreground">{published}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">posts</span>
          </div>
        </div>

        {/* Post Tank */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Post Tank</span>
              <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            </div>
            <button
              onClick={() => navigate("/dashboard/social-media/workspace")}
              className="text-muted-foreground/50 hover:text-foreground shrink-0"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-1 mb-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{scheduled}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">/{targetPosts} scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={tankPercent} className="h-1.5 flex-1 min-w-0" />
            <span className="text-[11px] text-muted-foreground shrink-0">{tankPercent}%</span>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Consistency Score</span>
            <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <div className="flex items-baseline gap-1 shrink-0">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">{consistencyScore}</span>
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{consistencyText}</span>
          </div>
          <div className="h-1.5 sm:h-2 rounded-full overflow-hidden bg-muted/30 relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${consistencyScore}%`,
                background: "linear-gradient(90deg, hsl(0 80% 55%), hsl(35 90% 55%), hsl(50 90% 55%), hsl(120 60% 45%))",
              }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground"
              style={{ left: `${consistencyScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <h3 className="text-sm font-bold text-foreground mb-2.5 sm:mb-3">Quick Links</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 mb-6 sm:mb-8">
        {[
          {
            icon: Plus,
            label: "New Post",
            desc: "Create from scratch",
            path: "/dashboard/social-media/posts/create",
          },
          {
            icon: Sparkles,
            label: "Create with AI",
            desc: "AI-generated posts",
            path: "/dashboard/social-media/posts/create?mode=auto",
          },
          {
            icon: Link2,
            label: "Connect Socials",
            desc: "Link your accounts",
            path: "/dashboard/social-media/workspace",
          },
          {
            icon: Users,
            label: "Invite Team",
            desc: "Add team members",
            path: "/dashboard/social-media/workspace",
          },
        ].map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className="flex flex-col items-start gap-2 p-3 sm:p-4 rounded-xl border border-border bg-card hover:border-accent/30 transition-all text-left min-w-0 min-h-[72px]"
          >
            <link.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0 w-full">
              <div className="text-xs sm:text-sm font-semibold text-foreground truncate">{link.label}</div>
              <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">{link.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Recently Published ── */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-2">
        <h3 className="text-sm font-bold text-foreground shrink-0">Recently published</h3>
        <button
          onClick={() => navigate("/dashboard/social-media/analytics")}
          className="text-[11px] sm:text-xs text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <BarChart3 className="h-3 w-3" /> View stats
        </button>
      </div>

      {recentPosts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
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
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:overflow-x-visible">
          {recentPosts.slice(0, 6).map((post) => {
            const img = post.primary_media_url || post.media_urls?.[0];
            return (
              <button
                key={post.id}
                onClick={() => navigate("/dashboard/social-media/posts")}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-accent/30 transition-colors text-left snap-start shrink-0 w-[70vw] sm:w-auto min-w-0"
              >
                {img ? (
                  <div className="w-full aspect-[16/10] overflow-hidden bg-muted/20">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] bg-muted/20 flex items-center justify-center">
                    <span className="text-[11px] text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="p-2.5 sm:p-3 min-w-0">
                  <p className="text-[11px] sm:text-xs text-foreground line-clamp-2 mb-1">
                    {post.caption?.slice(0, 80) || "Post"}
                    {(post.caption?.length || 0) > 80 ? "…" : ""}
                  </p>
                  {post.published_at && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {format(new Date(post.published_at), "MMM d 'at' h:mm a")}
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
        <div className="mt-6 sm:mt-8 rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4 sm:p-5 text-center">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-accent mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Your content engine is ready
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
            Set up your AI Profile, add topics, and let AI generate your first batch of posts automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/social-media/ai-profile")}
              className="text-xs w-full sm:w-auto"
            >
              Set up AI Profile
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate("/dashboard/social-media/posts/create?mode=auto")}
              className="text-xs w-full sm:w-auto"
            >
              Create with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
