import { Package, ShieldCheck } from "lucide-react";

interface SearchItem {
  external_product_id: string;
  title: string;
  thumbnail: string;
  thumbnail_url?: string | null;
  image_urls?: string[];
  provider_currency: string;
  provider_min_price_cents: number;
  display_currency?: string;
  display_min_price_cents?: number;
  display_max_price_cents?: number;
  provider_key?: string;
  [key: string]: unknown;
}

interface Props {
  item: SearchItem;
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
  onClick: () => void;
}

export default function ProductCard({ item, formatPrice, onClick }: Props) {
  const displayPrice = item.display_min_price_cents != null
    ? formatPrice(item.display_min_price_cents, item.display_currency)
    : formatPrice(item.provider_min_price_cents, item.provider_currency);

  const displayPriceMax = item.display_max_price_cents != null && item.display_max_price_cents !== item.display_min_price_cents
    ? formatPrice(item.display_max_price_cents, item.display_currency)
    : null;

  const providerLabel = item.provider_key === "cj" ? "CJ" : item.provider_key === "moderndropship" ? "Modern" : item.provider_key === "estores" ? "Estores" : item.provider_key;

  return (
    <button
      onClick={onClick}
      className="min-w-0 w-full text-left rounded-lg border border-border bg-card hover:border-accent/40 hover:shadow-md transition-all group overflow-hidden">
      <div className="aspect-square bg-muted overflow-hidden relative">
        {(item.thumbnail || item.thumbnail_url) ? (
          <img
            src={item.thumbnail || item.thumbnail_url || ""}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Provider badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-card/90 text-foreground border border-border/60 backdrop-blur-sm">
          {providerLabel}
        </span>
      </div>

      <div className="p-3 space-y-1.5 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug break-words">{item.title}</p>
        <div className="flex min-w-0 flex-wrap items-baseline gap-1">
          <span className="text-sm font-bold text-accent break-words">{displayPrice}</span>
          {displayPriceMax && (
            <span className="text-xs text-muted-foreground break-words">– {displayPriceMax}</span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-success" />
          <span className="truncate">Ships from China</span>
        </div>
      </div>
    </button>
  );
}
