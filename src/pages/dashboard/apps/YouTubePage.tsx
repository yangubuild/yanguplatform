import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Users, Eye, Video, Youtube } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";
import { Button } from "@/components/ui/button";

type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnails?: {
    default?: { url?: string };
    medium?: { url?: string };
    high?: { url?: string };
  };
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  country: string | null;
  publishedAt: string | null;
};

export default function YouTubePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callApi, loading, error } = useGoogleApi();
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchChannel = useCallback(async () => {
    const result = await callApi<{ channel: YouTubeChannel | null; message?: string }>("youtube/channel");
    if (result) {
      setChannel(result.channel || null);
      setHasLoaded(true);
    }
  }, [callApi]);

  useEffect(() => {
    if (user?.id) fetchChannel();
  }, [user?.id, fetchChannel]);

  const formatNumber = (value: string) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  };

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-background">
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">YouTube</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your channel connection inside YANGU</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChannel}
            disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="rounded-lg p-4 mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {loading && !hasLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : !channel && hasLoaded ? (
          <div className="rounded-xl p-6 text-center bg-card border border-border">
            <Youtube className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No YouTube channel was found for this connected Google account.</p>
            <p className="text-muted-foreground text-xs mt-2">Reconnect YouTube with the correct Google account if needed.</p>
          </div>
        ) : channel ? (
          <div className="rounded-xl p-5 bg-card border border-border">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={channel.thumbnails?.high?.url || channel.thumbnails?.medium?.url || channel.thumbnails?.default?.url || ""}
                alt={channel.title || "YouTube channel"}
                className="w-14 h-14 rounded-full object-cover bg-muted"
              />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">{channel.title}</h2>
                {channel.customUrl ? <p className="text-xs text-muted-foreground mt-1">@{channel.customUrl}</p> : null}
                {channel.country ? <p className="text-xs text-muted-foreground mt-1">Country: {channel.country}</p> : null}
              </div>
            </div>

            {channel.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{channel.description}</p>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" /> Subscribers
                </div>
                <p className="text-foreground font-medium">{formatNumber(channel.subscriberCount)}</p>
              </div>
              <div className="rounded-lg p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Video className="w-3.5 h-3.5" /> Videos
                </div>
                <p className="text-foreground font-medium">{formatNumber(channel.videoCount)}</p>
              </div>
              <div className="rounded-lg p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Eye className="w-3.5 h-3.5" /> Views
                </div>
                <p className="text-foreground font-medium">{formatNumber(channel.viewCount)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
