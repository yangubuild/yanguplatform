import { useState } from "react";
import { Download, Link2, RefreshCw, ImageIcon, Film, AlertTriangle } from "lucide-react";

export type MediaGenStatus = "queued" | "generating" | "uploading" | "done" | "error";

interface MediaGenerationCardProps {
  kind: "image" | "video";
  status: MediaGenStatus;
  progressStep?: string;
  previewUrl?: string;
  caption?: string;
  error?: string;
  onRetry?: () => void;
}

export function MediaGenerationCard({
  kind,
  status,
  progressStep,
  previewUrl,
  caption,
  error,
  onRetry,
}: MediaGenerationCardProps) {
  const [copied, setCopied] = useState(false);
  const isLoading = status === "queued" || status === "generating" || status === "uploading";
  const isDone = status === "done" && previewUrl;
  const isError = status === "error";

  const statusLabels: Record<string, string> = {
    queued: "Queued…",
    generating: "Generating…",
    uploading: "Finalizing…",
  };

  const handleCopyLink = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden max-w-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Media area */}
      <div className="relative aspect-square max-h-[400px] overflow-hidden">
        {isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            {/* Skeleton shimmer */}
            <div className="w-full h-full absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background: "linear-gradient(110deg, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              {kind === "image" ? (
                <ImageIcon className="w-8 h-8 text-white/20 animate-pulse" />
              ) : (
                <Film className="w-8 h-8 text-white/20 animate-pulse" />
              )}
              <span className="text-xs text-white/40">
                {progressStep || statusLabels[status] || "Processing…"}
              </span>
              {/* Progress dots */}
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4A83D] animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4A83D]/60 animate-pulse" style={{ animationDelay: "300ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4A83D]/30 animate-pulse" style={{ animationDelay: "600ms" }} />
              </div>
            </div>
          </div>
        )}

        {isDone && kind === "image" && (
          <img src={previewUrl} alt={caption || "Generated image"} className="w-full h-full object-cover" />
        )}

        {isDone && kind === "video" && (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        )}

        {isError && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6" style={{ background: "rgba(255,255,255,0.02)" }}>
            <AlertTriangle className="w-8 h-8 text-red-400/70" />
            <p className="text-sm text-red-400/80 text-center">{error || "Failed to generate — try again"}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metadata + actions */}
      {isDone && (
        <div className="px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs text-white/40">
            {kind === "image" ? "Image created" : "Video created"}
            {caption && <> • {caption}</>}
          </span>
          <div className="flex items-center gap-1">
            <a
              href={previewUrl}
              download={`ada-${kind}-${Date.now()}.${kind === "image" ? "png" : "mp4"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              title={copied ? "Copied!" : "Copy link"}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
