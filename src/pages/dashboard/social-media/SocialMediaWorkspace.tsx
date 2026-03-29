import { useState } from "react";
import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useSocialWorkspace } from "@/hooks/social/useSocialWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialProvider } from "@/types/socialMedia";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Clock,
  Users,
  Settings,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";

// Real icons from platform registry assets
import facebookIcon from "@/assets/icons/facebook.png";
import instagramIcon from "@/assets/icons/instagram.png";
import xIcon from "@/assets/icons/x.png";
import linkedinIcon from "@/assets/icons/linkedin.png";
import tiktokIcon from "@/assets/icons/tiktok.png";

interface ProviderRow {
  name: string;
  icon: string;
  provider: SocialProvider;
  supported: boolean;
  description: string;
}

const SOCIAL_PROVIDERS: ProviderRow[] = [
  { name: "Facebook Page", icon: facebookIcon, provider: "facebook", supported: true, description: "Post to your business page" },
  { name: "Instagram", icon: instagramIcon, provider: "instagram", supported: true, description: "Share photos and reels" },
  { name: "Instagram Story", icon: instagramIcon, provider: "instagram_story", supported: true, description: "Publish to stories" },
  { name: "X", icon: xIcon, provider: "x", supported: true, description: "Post tweets and threads" },
  { name: "LinkedIn Company", icon: linkedinIcon, provider: "linkedin_company", supported: true, description: "Post to company page" },
  { name: "LinkedIn Personal", icon: linkedinIcon, provider: "linkedin_personal", supported: true, description: "Post to your profile" },
  { name: "TikTok", icon: tiktokIcon, provider: "tiktok", supported: true, description: "Share short videos" },
];

type WorkspaceTab = "profile" | "schedule" | "team" | "settings";

const TABS: { key: WorkspaceTab; label: string; icon: typeof Globe }[] = [
  { key: "profile", label: "Profile", icon: Globe },
  { key: "schedule", label: "Schedule", icon: Clock },
  { key: "team", label: "Team", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SocialMediaWorkspace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("profile");
  const { workspace } = useSocialWorkspace();
  const {
    accounts,
    connect,
    disconnect,
    isConnecting,
  } = useConnectedAccounts();

  const handleConnect = async (provider: SocialProvider) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    try {
      await connect({
        provider,
        redirectUrl: `${window.location.origin}/dashboard/social-media/callback`,
        workspaceId: user.id,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to start connection");
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnect(accountId);
      toast.success("Account disconnected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to disconnect");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-foreground">Workspace</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your workspace profile and settings.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-border pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeTab === tab.key
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <ProfileTab
          workspace={workspace}
          accounts={accounts}
          isConnecting={isConnecting}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          user={user}
        />
      )}
      {activeTab === "schedule" && <ScheduleTab />}
      {activeTab === "team" && <TeamTab user={user} />}
      {activeTab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ─── PROFILE TAB ────────────────────────────── */
function ProfileTab({
  workspace,
  accounts,
  isConnecting,
  onConnect,
  onDisconnect,
  user,
}: {
  workspace: any;
  accounts: any[];
  isConnecting: boolean;
  onConnect: (p: SocialProvider) => void;
  onDisconnect: (id: string) => void;
  user: any;
}) {
  return (
    <div className="space-y-5">
      {/* Workspace Identity */}
      <div className="rounded-xl border border-border bg-card p-4">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">This workspace</span>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <Globe className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{workspace?.name || "My Workspace"}</p>
            {workspace?.business_website && (
              <p className="text-xs text-muted-foreground">{workspace.business_website}</p>
            )}
          </div>
        </div>
      </div>

      {/* Connect Socials */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">Connect Socials</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Connect your social media accounts to allow publishing on your behalf.</p>
        </div>

        <div className="divide-y divide-border">
          {SOCIAL_PROVIDERS.map((p) => {
            const connectedAccount = accounts.find(
              (a) => a.provider === p.provider && a.status !== "disconnected"
            );
            const isConnected = connectedAccount?.status === "active";
            const needsReconnect = connectedAccount?.status === "expired" || connectedAccount?.status === "error";

            return (
              <div key={p.provider} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.icon} alt={p.name} className="w-8 h-8 rounded-lg object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      )}
                      {needsReconnect && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                          <AlertTriangle className="h-3 w-3" />
                          Reconnect
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {isConnected && connectedAccount?.provider_account_name
                        ? `@${connectedAccount.provider_account_name}`
                        : p.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {!p.supported ? (
                    <span className="text-[10px] text-muted-foreground italic px-2 py-1">Coming soon</span>
                  ) : isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => onDisconnect(connectedAccount!.id)}
                      disabled={isConnecting}
                    >
                      Disconnect
                    </Button>
                  ) : needsReconnect ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                      onClick={() => onConnect(p.provider)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => onConnect(p.provider)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── SCHEDULE TAB ───────────────────────────── */
function ScheduleTab() {
  const [times] = useState(() => DAYS.map(() => "19:00"));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -(new Date().getTimezoneOffset() / 60);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Posting Schedule</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Timezone: {tz.split("/").pop()?.replace("_", " ")} (GMT{offset >= 0 ? "+" : ""}{offset})
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8">
            Edit Schedule
          </Button>
        </div>

        {/* Day/time grid */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, i) => (
            <div key={day} className="text-center">
              <span className="text-xs font-semibold text-foreground">{day}</span>
              <div className="mt-1.5 rounded-md bg-accent/10 border border-accent/20 px-2 py-1">
                <span className="text-[11px] font-medium text-accent">
                  {formatTime(times[i])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl border border-border bg-card/60 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-foreground">Your posts will be automatically scheduled based on the times above.</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">You have 0 posts in your queue that will be published according to this schedule.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── TEAM TAB ───────────────────────────────── */
function TeamTab({ user }: { user: any }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">Team Members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">View and manage your team. Invite new members to easily collaborate.</p>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-1 pb-2 border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">Role</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">Actions</span>
        </div>

        {/* Owner row */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-1 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-foreground">
                {(user?.user_metadata?.display_name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.display_name || "You"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="w-20 flex justify-center">
            <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Owner</span>
          </div>
          <div className="w-20" />
        </div>

        {/* Invite button */}
        <div className="pt-3 border-t border-border flex justify-end">
          <Button variant="outline" size="sm" className="text-xs h-8">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite Member
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── SETTINGS TAB ───────────────────────────── */
function SettingsTab() {
  const [showHolidays, setShowHolidays] = useState(true);
  const [postTankGoal, setPostTankGoal] = useState("7");

  return (
    <div className="space-y-5">
      {/* Workspace Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Workspace Settings</h2>
          <span className="text-[10px] font-medium text-accent">Saved</span>
        </div>

        {/* Calendar section */}
        <div className="mb-5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Calendar</span>
          <div className="mt-3 space-y-0 divide-y divide-border">
            <SettingsRow
              label="Timezone"
              description="Set the timezone for displaying post times throughout the app."
            >
              <span className="text-xs text-muted-foreground">
                Local timezone (GMT{-(new Date().getTimezoneOffset() / 60) >= 0 ? "+" : ""}{-(new Date().getTimezoneOffset() / 60)})
              </span>
            </SettingsRow>

            <SettingsRow
              label="Show holidays on calendar"
              description="Display holidays and observances on your post calendar."
            >
              <Switch checked={showHolidays} onCheckedChange={setShowHolidays} />
            </SettingsRow>

            <SettingsRow
              label="Holiday countries"
              description="Select which countries' holidays to display."
            >
              <span className="text-xs text-muted-foreground">United States of America</span>
            </SettingsRow>
          </div>
        </div>

        {/* Post Tank section */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Post Tank</span>
          <div className="mt-3 space-y-0 divide-y divide-border">
            <SettingsRow
              label="Post tank goal"
              description="The number of posts you need to have scheduled to meet your goal."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={postTankGoal}
                  onChange={(e) => setPostTankGoal(e.target.value)}
                  className="w-16 h-8 rounded-md border border-border bg-background text-foreground text-xs text-center px-2"
                />
                <span className="text-xs text-muted-foreground">posts</span>
              </div>
            </SettingsRow>

            <SettingsRow
              label="Celebration message"
              description="Choose how to get notified when you reach your goal."
            >
              <Select defaultValue="popup">
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popup">Popup</SelectItem>
                  <SelectItem value="toast">Toast</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">Admin Controls</h2>
        <div className="space-y-0 divide-y divide-border">
          <AdminAction
            label="Transfer Ownership"
            description="Transfer this workspace to another user."
            variant="warning"
          />
          <AdminAction
            label="Change Workspace"
            description="Use website or description to reset workspace profile."
            variant="warning"
          />
          <AdminAction
            label="Delete Workspace"
            description="Delete this workspace and all related data."
            variant="danger"
          />
          <AdminAction
            label="Add Affiliate Account"
            description="Create an affiliate workspace."
            variant="default"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── SHARED COMPONENTS ──────────────────────── */

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AdminAction({
  label,
  description,
  variant = "default",
}: {
  label: string;
  description: string;
  variant?: "default" | "warning" | "danger";
}) {
  const btnClass =
    variant === "danger"
      ? "text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
      : variant === "warning"
        ? "text-xs h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
        : "text-xs h-8";

  return (
    <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Button variant="outline" size="sm" className={btnClass}>
        {label}
      </Button>
    </div>
  );
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}
