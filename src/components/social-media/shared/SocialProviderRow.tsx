import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AccountConnectionStatus } from "@/types/socialMedia";

interface SocialProviderRowProps {
  name: string;
  icon: string;
  status?: AccountConnectionStatus;
  providerReady?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isLoading?: boolean;
}

export function SocialProviderRow({
  name,
  icon,
  status,
  providerReady = false,
  onConnect,
  onDisconnect,
  isLoading,
}: SocialProviderRowProps) {
  const isConnected = status === "active";
  const isPendingActivation = status === ("pending_activation" as AccountConnectionStatus);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{name}</span>
          {isConnected && (
            <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
          )}
          {isPendingActivation && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Pending Activation
            </Badge>
          )}
          {!providerReady && !isConnected && !isPendingActivation && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
              Coming Soon
            </Badge>
          )}
        </div>
      </div>
      {isConnected ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={isLoading}
        >
          Disconnect
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={providerReady ? onConnect : undefined}
          disabled={isLoading || !providerReady}
        >
          {providerReady ? "Connect" : "Connect"}
        </Button>
      )}
    </div>
  );
}
