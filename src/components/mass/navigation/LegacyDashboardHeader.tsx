import { Search, MessageCircle, Sparkles, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LegacyDashboardHeader() {
  const { profile } = useAuth();
  const workspaceName = profile?.business_name || profile?.display_name || "Fresh & Wholesome Foods";
  const avatarInitials = (profile?.display_name || workspaceName).slice(0, 2).toUpperCase();

  return (
    <header
      className="h-[52px] px-4 flex items-center justify-between"
      style={{
        background: "hsl(220 24% 6%)",
        borderBottom: "1px solid hsl(220 18% 16%)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg, hsl(28 94% 56%) 0%, hsl(12 86% 46%) 100%)" }} />
        <div className="w-px h-4" style={{ background: "hsl(220 14% 24%)" }} />
        <button className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 88%)" }}>{workspaceName}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(220 10% 45%)" }} />
        </button>
        <div
          className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-xl min-w-[420px]"
          style={{ background: "hsl(220 18% 12%)", border: "1px solid hsl(220 18% 17%)" }}
        >
          <Search className="w-4 h-4" style={{ color: "hsl(220 10% 45%)" }} />
          <span className="text-sm" style={{ color: "hsl(220 10% 45%)" }}>Search {workspaceName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {[MessageCircle, Sparkles, Bell].map((Icon, index) => (
          <button
            key={index}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(220 18% 12%)", border: "1px solid hsl(220 18% 18%)" }}
          >
            <Icon className="w-4 h-4" style={{ color: "hsl(0 0% 72%)" }} />
          </button>
        ))}
        <button
          className="h-8 px-3 rounded-full text-sm font-semibold"
          style={{ background: "hsl(220 18% 12%)", border: "1px solid hsl(220 18% 18%)", color: "hsl(0 0% 86%)" }}
        >
          $0.00
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "hsl(220 18% 14%)" }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 90%)" }}>{avatarInitials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
