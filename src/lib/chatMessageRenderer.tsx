import React from "react";

/**
 * Canonical message content renderer shared across all chat types.
 * Handles: plain text, URLs/links, payment links, media embeds, [buynow]/[sellnow] tags,
 * product/service/payment link cards, offer CTAs.
 */

// Payment platform patterns
const PAYMENT_LINK_PATTERNS = [
  /paypal\.me/i, /stripe\.com\/pay/i, /buy\.stripe\.com/i,
  /cash\.app/i, /venmo\.com/i, /pay\.google\.com/i,
  /mpesa/i, /flutterwave/i, /paystack/i, /mtn.*momo/i,
  /checkout\.link/i, /invoice\.link/i,
];

function isPaymentLink(url: string): boolean {
  return PAYMENT_LINK_PATTERNS.some(p => p.test(url));
}

function isProductLink(url: string): boolean {
  return /\/(product|item|listing|shop|store|service)/i.test(url);
}

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
        {textBefore && <span className="whitespace-pre-wrap">{textBefore}</span>}
        <button
          onClick={() => navigate?.(link)}
          className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
        >
          ✅ Accept Invite
        </button>
        {textAfter && <span className="whitespace-pre-wrap">{textAfter}</span>}
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
        {cleaned && <span className="whitespace-pre-wrap">{cleaned}</span>}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {hasBuyNow && (
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🛒 Buy Now
            </button>
          )}
          {hasSellNow && (
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              🏷️ Sell Now
            </button>
          )}
        </div>
      </>
    );
  }

  // Auto-link URLs with enhanced rendering for payment/product links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  if (parts.length > 1) {
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (!urlRegex.test(part)) {
            return <React.Fragment key={i}>{part}</React.Fragment>;
          }
          // Reset regex
          urlRegex.lastIndex = 0;

          if (isPaymentLink(part)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1 mb-1 px-3 py-2 rounded-lg text-[11px] font-medium text-white no-underline break-all"
                style={{ background: "linear-gradient(135deg, #10b981, #047857)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                💳 Payment Link
                <span className="text-[10px] opacity-70 truncate max-w-[180px]">{new URL(part).hostname}</span>
              </a>
            );
          }

          if (isProductLink(part)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1 mb-1 px-3 py-2 rounded-lg text-[11px] font-medium text-white no-underline break-all"
                style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.25)" }}
              >
                🛍️ View Product
                <span className="text-[10px] opacity-70 truncate max-w-[180px]">{new URL(part).hostname}</span>
              </a>
            );
          }

          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: "#60a5fa" }}>
              {part}
            </a>
          );
        })}
      </span>
    );
  }

  return <span className="whitespace-pre-wrap">{content}</span>;
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
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url || content);
    } catch {
      // Silent fail
    }
  }
}
