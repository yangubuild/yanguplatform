import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ImagePlus, Video, Sparkles, Send } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatarUtils";

export function PostsPanel() {
  const { profile } = useAuth();
  const [text, setText] = useState("");

  const avatarUrl = profile ? resolveAvatarUrl(profile) : null;
  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full" style={{ background: "#111820" }}>
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-sm font-semibold text-white">Posts</span>
      </div>

      {/* Composer */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-white/60">{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a product, service, or update..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none min-h-[60px]"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-white/5" style={{ color: "#E67E22" }} title="AI Generate">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <button
                disabled={!text.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                style={{
                  background: text.trim() ? "linear-gradient(135deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.08)",
                  color: text.trim() ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts list — empty state */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-xl p-5 mb-4"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="h-2 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
        <p className="text-sm font-semibold text-white">No posts yet</p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Share your first product, service, or update!
        </p>
      </div>
    </div>
  );
}
