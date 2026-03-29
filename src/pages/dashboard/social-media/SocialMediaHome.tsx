import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Link2, Calendar, BarChart3, BookOpen, MessageCircle, Bot, Settings, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSocialOnboarding } from "@/hooks/useSocialOnboarding";
import { SocialOnboardingFlow } from "@/components/social-media/SocialOnboardingFlow";

const CHECKLIST = [
  { key: "business", label: "Create my business", path: "/dashboard/social-media/workspace" },
  { key: "social", label: "Connect a social", path: "/dashboard/social-media/workspace" },
  { key: "save_post", label: "Save a post", path: "/dashboard/social-media/posts" },
  { key: "schedule_post", label: "Schedule a post", path: "/dashboard/social-media/posts" },
  { key: "publish_post", label: "Publish a post", path: "/dashboard/social-media/posts" },
];

const QUICK_LINKS = [
  { icon: Plus, label: "New Post", desc: "Create a new post from scratch", path: "/dashboard/social-media/posts?create=true" },
  { icon: Sparkles, label: "Create Posts with AI", desc: "Generate posts with AI", path: "/dashboard/social-media/posts?ai=true" },
  { icon: Link2, label: "Connect Socials", desc: "Connect your social accounts", path: "/dashboard/social-media/workspace" },
  { icon: Calendar, label: "Calendar", desc: "View your content calendar", path: "/dashboard/social-media/calendar" },
  { icon: BarChart3, label: "Analytics", desc: "View your performance", path: "/dashboard/social-media/analytics" },
  { icon: BookOpen, label: "Library", desc: "Your content library", path: "/dashboard/social-media/library" },
  { icon: MessageCircle, label: "Topics", desc: "Manage content topics", path: "/dashboard/social-media/topics" },
  { icon: Bot, label: "AI Profile", desc: "Your AI brand profile", path: "/dashboard/social-media/ai-profile" },
  { icon: Settings, label: "Workspace", desc: "Manage workspace settings", path: "/dashboard/social-media/workspace" },
];

export default function SocialMediaHome() {
  const navigate = useNavigate();
  const { isOnboarded, completedSteps, showOnboarding, setShowOnboarding } = useSocialOnboarding();

  if (!isOnboarded || showOnboarding) {
    return <SocialOnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / CHECKLIST.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-xl font-bold text-foreground mb-6">Welcome to Social Media!</h1>

      {/* Progress Card */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Jumpstart Progress</h2>
          <span className="text-sm font-semibold text-accent">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 mb-4" />
        <div className="space-y-2">
          {CHECKLIST.map((item) => {
            const done = completedSteps.includes(item.key);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2.5 w-full text-left text-sm py-1 hover:text-accent transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-sm font-bold text-foreground mb-3">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/40 transition-all text-left"
            >
              <Icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground">{link.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{link.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
