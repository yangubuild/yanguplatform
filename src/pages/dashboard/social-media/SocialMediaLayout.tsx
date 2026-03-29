import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Home, FileText, Calendar, BarChart3, BookOpen, MessageCircle, Bot, Settings } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/dashboard/social-media" },
];

const CONTENT_ITEMS = [
  { icon: FileText, label: "Posts", path: "/dashboard/social-media/posts" },
  { icon: Calendar, label: "Calendar", path: "/dashboard/social-media/calendar" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/social-media/analytics" },
];

const STRATEGY_ITEMS = [
  { icon: BookOpen, label: "Library", path: "/dashboard/social-media/library" },
  { icon: MessageCircle, label: "Topics", path: "/dashboard/social-media/topics" },
  { icon: Bot, label: "AI Profile", path: "/dashboard/social-media/ai-profile" },
  { icon: Settings, label: "Workspace", path: "/dashboard/social-media/workspace" },
];

export default function SocialMediaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard/social-media") return currentPath === path;
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Internal top navigator */}
      <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 h-12 overflow-x-auto scrollbar-none">
            {/* Back to Dashboard */}
            <button
              onClick={() => navigate("/dashboard/home")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </button>

            <span className="w-px h-5 bg-border mx-1 shrink-0" />

            {/* Create Post */}
            <button
              onClick={() => navigate("/dashboard/social-media/posts/create")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent/15 text-accent rounded-lg hover:bg-accent/25 transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Post
            </button>

            <span className="w-px h-5 bg-border mx-1 shrink-0" />

            {/* Home */}
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />
            ))}

            <span className="w-px h-5 bg-border mx-1 shrink-0" />

            {/* CONTENT group */}
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-2 shrink-0">Content</span>
            {CONTENT_ITEMS.map((item) => (
              <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />
            ))}

            <span className="w-px h-5 bg-border mx-1 shrink-0" />

            {/* STRATEGY group */}
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-2 shrink-0">Strategy</span>
            {STRATEGY_ITEMS.map((item) => (
              <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: { icon: any; label: string }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
        active
          ? "bg-accent/15 text-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </button>
  );
}
