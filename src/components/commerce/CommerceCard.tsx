/**
 * Universal Commerce Card — renders a product or service consistently
 * across chat, feeds, profiles, discovery, and future shop pages.
 *
 * Compact mode for chat bubbles, full mode for grids/profiles.
 */

import { Package, Wrench, ExternalLink, MessageSquare, ShieldCheck } from "lucide-react";
import type { CommerceItem } from "@/types/commerce";
import { truncateText } from "@/types/commerce";

interface CommerceCardProps {
  item: CommerceItem;
  variant?: "compact" | "full";
  onMessage?: () => void;
  onOpen?: () => void;
  className?: string;
}

export default function CommerceCard({
  item,
  variant = "full",
  onMessage,
  onOpen,
  className = "",
}: CommerceCardProps) {
  const isProduct = item.kind === "product";
  const Icon = isProduct ? Package : Wrench;

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else if (item.link) {
      window.open(item.link, "_blank", "noopener,noreferrer");
    } else if (item.slug) {
      window.location.href = `/${item.kind}/${item.slug}`;
    }
  };

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onClick={handleOpen}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
            {item.is_verified && (
              <ShieldCheck className="w-3 h-3 text-accent shrink-0" />
            )}
          </div>
          {item.price_label && (
            <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>{item.price_label}</span>
          )}
          {item.owner_name && (
            <span className="text-[10px] block" style={{ color: "rgba(255,255,255,0.4)" }}>
              by {item.owner_name}
            </span>
          )}
        </div>

        <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all hover:shadow-lg ${className}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Image */}
      <div className="aspect-[16/10] overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-10 h-10" style={{ color: "rgba(255,255,255,0.08)" }} />
          </div>
        )}
        {/* Kind badge */}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm"
          style={{
            background: isProduct ? "rgba(96,165,250,0.2)" : "rgba(168,85,247,0.2)",
            color: isProduct ? "#60a5fa" : "#a855f7",
            border: `1px solid ${isProduct ? "rgba(96,165,250,0.3)" : "rgba(168,85,247,0.3)"}`,
          }}
        >
          {isProduct ? "Product" : "Service"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title + verified */}
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-semibold text-foreground flex-1 line-clamp-2 leading-snug">{item.title}</h3>
          {item.is_verified && (
            <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            {truncateText(item.description, 120)}
          </p>
        )}

        {/* Price + Category */}
        <div className="flex items-center justify-between">
          {item.price_label ? (
            <span className="text-sm font-bold" style={{ color: "#10b981" }}>{item.price_label}</span>
          ) : (
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {item.kind === "service" ? "Contact for pricing" : "Price on request"}
            </span>
          )}
          {item.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
              {item.category}
            </span>
          )}
        </div>

        {/* Owner row */}
        {item.owner_name && (
          <div className="flex items-center gap-2 pt-1">
            {item.owner_avatar ? (
              <img src={item.owner_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-foreground" style={{ background: "rgba(255,255,255,0.1)" }}>
                {item.owner_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{item.owner_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleOpen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-foreground transition-colors"
            style={{ background: "linear-gradient(135deg, #b5622a, #d97706)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {item.kind === "service" ? "View Service" : "View Product"}
          </button>
          {onMessage && (
            <button
              onClick={(e) => { e.stopPropagation(); onMessage(); }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
