import { Button } from "@/components/ui/button";
import type { AccountConnectionStatus } from "@/types/socialMedia";

interface SocialProviderRowProps {
  name: string;
  icon: string;
  status?: AccountConnectionStatus;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isLoading?: boolean;
}

export function SocialProviderRow({
  name,
  icon,
  status,
  onConnect,
  onDisconnect,
  isLoading,
}: SocialProviderRowProps) {
  const isConnected = status === "active";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <span className="text-sm font-medium text-foreground">{name}</span>
          {isConnected && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">Connected</span>
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
          onClick={onConnect}
          disabled={isLoading}
        >
          Connect
        </Button>
      )}
    </div>
  );
}
