import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import adaMascot from "@/assets/ada-mascot-v3.png";

const DEFAULT_TEXT: Record<string, string> = {
  new: "Hello! I'm excited to help you build your website. What kind of website are you thinking of creating? Is it for a business, a personal project, or something else? Perhaps you're looking to create a website for a restaurant, a store, a community, or as an influencer?",
  edit: "I will update the website building plan in real-time based on our conversation, and you can let me know anytime to make adjustments.",
};

interface BuilderPinnedNoticeProps {
  mode: "new" | "edit";
  text?: string;
  isDismissible?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  mascotSrc?: string;
  onHeightChange?: (height: number) => void;
}

export function BuilderPinnedNotice({
  mode,
  text,
  isDismissible = true,
  showBadge,
  badgeText,
  mascotSrc,
  onHeightChange,
}: BuilderPinnedNoticeProps) {
  const [visible, setVisible] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const reportHeight = useCallback(() => {
    if (!wrapperRef.current) return;
    onHeightChange?.(visible ? wrapperRef.current.offsetHeight : 0);
  }, [visible, onHeightChange]);

  useEffect(() => {
    reportHeight();
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(reportHeight);
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [reportHeight]);

  useEffect(() => {
    if (!visible) onHeightChange?.(0);
  }, [visible, onHeightChange]);

  if (!visible) return null;

  const displayText = text || DEFAULT_TEXT[mode] || "";
  const shouldShowBadge = showBadge ?? mode === "edit";
  const badge = badgeText || "NEW";
  const mascot = mascotSrc || adaMascot;

  return (
    <div
      ref={wrapperRef}
      className="absolute top-[18px] right-[22px] z-20 max-md:left-4 max-md:right-4 max-md:top-3"
      style={{ width: "clamp(320px, 34vw, 520px)" }}
    >
      {/* Mascot peeking over the card */}
      <img
        src={mascot}
        alt="Ada"
        className="absolute -top-[30px] left-[28px] h-[48px] w-auto z-[21] pointer-events-none max-md:-top-[26px] max-md:left-[20px] max-md:h-[42px]"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
      />

      {/* Card */}
      <div
        className="relative rounded-[20px] max-md:rounded-[18px]"
        style={{
          background: "#000",
          color: "#fff",
          padding: "20px 22px 18px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
          lineHeight: 1.45,
        }}
      >
        {/* Close button */}
        {isDismissible && (
          <button
            onClick={() => setVisible(false)}
            className="absolute top-[14px] right-[14px] text-white/70 hover:text-white transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Text with optional badge */}
        <p className="text-[13px] font-medium pr-6 leading-[1.45]">
          {shouldShowBadge && (
            <span className="inline-block mr-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase align-middle"
              style={{ background: "#22c55e", color: "#fff" }}
            >
              {badge}
            </span>
          )}
          {displayText}
        </p>
      </div>
    </div>
  );
}
