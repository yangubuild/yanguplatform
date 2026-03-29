import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { SocialProvider } from "@/types/socialMedia";

// Real icons from platform registry assets
import facebookIcon from "@/assets/icons/facebook.png";
import instagramIcon from "@/assets/icons/instagram.png";
import xIcon from "@/assets/icons/x.png";
import linkedinIcon from "@/assets/icons/linkedin.png";
import tiktokIcon from "@/assets/icons/tiktok.png";
import { Button } from "@/components/ui/button";

interface ProviderRow {
  name: string;
  icon: string;
  provider: SocialProvider;
  supported: boolean;
}

const SOCIAL_PROVIDERS: ProviderRow[] = [
  { name: "Facebook Page", icon: facebookIcon, provider: "facebook", supported: true },
  { name: "Instagram", icon: instagramIcon, provider: "instagram", supported: true },
  { name: "Instagram Story", icon: instagramIcon, provider: "instagram_story", supported: true },
  { name: "X", icon: xIcon, provider: "x", supported: true },
  { name: "LinkedIn Company Page", icon: linkedinIcon, provider: "linkedin_company", supported: true },
  { name: "LinkedIn Personal Profile", icon: linkedinIcon, provider: "linkedin_personal", supported: true },
  { name: "TikTok", icon: tiktokIcon, provider: "tiktok", supported: true },
];

export default function SocialMediaWorkspace() {
  const { user } = useAuth();
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
      <h1 className="text-lg font-semibold text-foreground mb-6">Workspace</h1>

      {/* Connected Accounts */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Connected Socials</h2>
        <div className="space-y-3">
          {SOCIAL_PROVIDERS.map((p) => {
            const connectedAccount = accounts.find(
              (a) => a.provider === p.provider && a.status !== "disconnected"
            );
            const isConnected = connectedAccount?.status === "active";
            const needsReconnect = connectedAccount?.status === "expired" || connectedAccount?.status === "error";

            return (
              <div key={p.provider} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <img src={p.icon} alt={p.name} className="w-6 h-6 rounded object-contain" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {isConnected && connectedAccount?.provider_account_name && (
                      <span className="text-xs text-muted-foreground">
                        @{connectedAccount.provider_account_name}
                      </span>
                    )}
                    {isConnected && (
                      <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                    )}
                    {needsReconnect && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Reconnect needed</span>
                    )}
                  </div>
                </div>

                {!p.supported ? (
                  <span className="text-xs text-muted-foreground italic">Coming soon</span>
                ) : isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(connectedAccount!.id)}
                    disabled={isConnecting}
                  >
                    Disconnect
                  </Button>
                ) : needsReconnect ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(p.provider)}
                    disabled={isConnecting}
                  >
                    Reconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(p.provider)}
                    disabled={isConnecting}
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace Settings Shell */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your posting schedule, team members, and workspace preferences here.
        </p>
      </div>
    </div>
  );
}
