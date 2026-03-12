import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Users, Eye, Video, Youtube } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";

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
    <div className="w-full min-h-screen px-6 py-6" style={{ background: "#08120D" }}>
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">YouTube</h1>
            <p className="text-sm text-white/40 mt-1">Manage your channel connection inside YANGU</p>
          </div>
          <button
            onClick={fetchChannel}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-4 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {loading && !hasLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : !channel && hasLoaded ? (
          <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Youtube className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/70 text-sm">No YouTube channel was found for this connected Google account.</p>
            <p className="text-white/35 text-xs mt-2">Reconnect YouTube with the correct Google account if needed.</p>
          </div>
        ) : channel ? (
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-4 mb-4">
              <img
                src={channel.thumbnails?.high?.url || channel.thumbnails?.medium?.url || channel.thumbnails?.default?.url || ""}
                alt={channel.title || "YouTube channel"}
                className="w-14 h-14 rounded-full object-cover bg-white/10"
              />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">{channel.title}</h2>
                {channel.customUrl ? <p className="text-xs text-white/45 mt-1">@{channel.customUrl}</p> : null}
                {channel.country ? <p className="text-xs text-white/35 mt-1">Country: {channel.country}</p> : null}
              </div>
            </div>

            {channel.description ? (
              <p className="text-sm text-white/65 leading-relaxed mb-4">{channel.description}</p>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Users className="w-3.5 h-3.5" /> Subscribers
                </div>
                <p className="text-white font-medium">{formatNumber(channel.subscriberCount)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Video className="w-3.5 h-3.5" /> Videos
                </div>
                <p className="text-white font-medium">{formatNumber(channel.videoCount)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Eye className="w-3.5 h-3.5" /> Views
                </div>
                <p className="text-white font-medium">{formatNumber(channel.viewCount)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
