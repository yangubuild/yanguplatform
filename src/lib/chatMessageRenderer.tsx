import React from "react";
import { detectLinkType, getLinkDisplayInfo, safeHostname } from "@/lib/commerceLinkDetector";
import { EmojiRenderer } from "@/components/emoji/EmojiRenderer";

/**
 * Canonical message content renderer shared across all chat types.
 * Handles: plain text, URLs/links, payment links, media embeds, [buynow]/[sellnow] tags,
 * product/service/payment link cards, offer CTAs.
 */

export function renderChatContent(content: string, navigate?: (path: string) => void): React.ReactNode {
  if (!content) return null;

  // Accept invite links (DM system messages)
  const acceptMatch = content.match(/\[Accept Invite\]\(([^)]+)\)/);
  if (acceptMatch) {
    const link = acceptMatch[1];
    const textBefore = content.slice(0, acceptMatch.index);
    const textAfter = content.slice((acceptMatch.index ?? 0) + acceptMatch[0].length);
    return (
      <>
        {textBefore && <EmojiRenderer text={textBefore} className="whitespace-pre-wrap" />}
        <button
          onClick={() => navigate?.(link)}
          className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-lg text-xs font-semibold text-foreground"
          style={{ background: "linear-gradient(135deg, #c47a3a, #5c2a12)" }}
        >
          ✅ Accept Invite
        </button>
        {textAfter && <EmojiRenderer text={textAfter} className="whitespace-pre-wrap" />}
      </>
    );
  }

  // Inline media (📷 / 🎥 + URL)
  const mediaMatch = content.match(/^(📷|🎥)\s(https?:\/\/.+)$/);
  if (mediaMatch) {
    const isVideo = mediaMatch[1] === "🎥";
    const url = mediaMatch[2];
    if (isVideo) {
      return <video src={url} controls className="max-w-full rounded-lg mt-1" style={{ maxHeight: 200 }} />;
    }
    return <img src={url} alt="Shared" className="max-w-full rounded-lg mt-1" style={{ maxHeight: 200 }} />;
  }

  // [buynow] / [sellnow] CTA buttons
  const hasBuyNow = content.includes("[buynow]");
  const hasSellNow = content.includes("[sellnow]");
  if (hasBuyNow || hasSellNow) {
    const cleaned = content.replace(/\[buynow\]/g, "").replace(/\[sellnow\]/g, "").trim();
    return (
      <>
        {cleaned && <EmojiRenderer text={cleaned} className="whitespace-pre-wrap" />}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {hasBuyNow && (
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-foreground" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🛒 Buy Now
            </button>
          )}
          {hasSellNow && (
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-foreground" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              🏷️ Sell Now
            </button>
          )}
        </div>
      </>
    );
  }

  // Auto-link URLs with enhanced rendering for payment/product/service links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  if (parts.length > 1) {
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (!urlRegex.test(part)) {
            return <EmojiRenderer key={i} text={part} className="whitespace-pre-wrap" />;
          }
          // Reset regex
          urlRegex.lastIndex = 0;

          const linkType = detectLinkType(part);
          const hostname = safeHostname(part);

          if (linkType === "external" || linkType === "unknown") {
            return (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: "#60a5fa" }}>
                {part}
              </a>
            );
          }

          const info = getLinkDisplayInfo(linkType);

          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 mb-1 px-3 py-2.5 rounded-xl text-[11px] font-medium text-foreground no-underline break-all"
              style={{
                background: info.bgGradient,
                border: `1px solid ${info.borderColor}`,
              }}
            >
              <span className="text-base">{info.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold">{info.label}</span>
                {hostname && (
                  <span className="text-[10px] opacity-60 truncate max-w-[200px]">{hostname}</span>
                )}
              </div>
            </a>
          );
        })}
      </span>
    );
  }

  return <EmojiRenderer text={content} className="whitespace-pre-wrap" />;
}

/**
 * Share message content to external platforms via Web Share API or clipboard fallback.
 */
export async function shareMessageExternal(content: string, url?: string) {
  const shareData: ShareData = {
    text: content,
    ...(url ? { url } : {}),
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // User cancelled
    }
  } else {
    try {
      await navigator.clipboard.writeText(url || content);
    } catch {
      // Silent fail
    }
  }
}
