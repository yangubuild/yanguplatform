import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CTA_OPTIONS = [
  { value: "none", label: "No Button" },
  { value: "add_to_cart", label: "Add Item" },
  { value: "buy_now", label: "Buy Now" },
  { value: "order_now", label: "Order Now" },
  { value: "book_now", label: "Book Now" },
  { value: "join_now", label: "Join Now" },
  { value: "contact_seller", label: "Contact Seller" },
  { value: "reserve", label: "Reserve" },
  { value: "access", label: "Access" },
  { value: "download", label: "Download" },
  { value: "view", label: "View" },
] as const;

export const ACTION_OPTIONS = [
  { value: "checkout", label: "Checkout (default)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "external_url", label: "External URL" },
] as const;

export type CtaValue = (typeof CTA_OPTIONS)[number]["value"];
export type ActionValue = (typeof ACTION_OPTIONS)[number]["value"];

/** Resolves a CTA value to its display label */
export function ctaLabel(value: string | undefined): string {
  if (!value || value === "none") return "";
  return CTA_OPTIONS.find((o) => o.value === value)?.label || value;
}

/** Returns default CTA value, button text, and action for a given surface type */
export function getDefaultCtaForSurface(surfaceType?: string): {
  ctaAction: string;
  buttonText: string;
  actionType: string;
} {
  switch (surfaceType) {
    case "emenu":
      return { ctaAction: "add_to_cart", buttonText: "+ Add", actionType: "checkout" };
    case "eshop":
      return { ctaAction: "add_to_cart", buttonText: "+ Add", actionType: "checkout" };
    case "estore":
      return { ctaAction: "add_to_cart", buttonText: "+ Add", actionType: "checkout" };
    case "community":
      return { ctaAction: "join_now", buttonText: "+ Join", actionType: "checkout" };
    case "influencer":
      return { ctaAction: "buy_now", buttonText: "Buy", actionType: "external_url" };
    case "esite":
      return { ctaAction: "book_now", buttonText: "+ Book", actionType: "checkout" };
    default:
      return { ctaAction: "add_to_cart", buttonText: "+ Add", actionType: "checkout" };
  }
}

interface ItemCtaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  buttonText?: string;
  onButtonTextChange?: (text: string) => void;
  actionType?: string;
  onActionTypeChange?: (action: string) => void;
  actionUrl?: string;
  onActionUrlChange?: (url: string) => void;
  className?: string;
  surfaceType?: string;
}

export function ItemCtaSelector({
  value, onChange,
  buttonText, onButtonTextChange,
  actionType, onActionTypeChange,
  actionUrl, onActionUrlChange,
  className,
  surfaceType,
}: ItemCtaSelectorProps) {
  const showButtonConfig = value && value !== "none";
  const defaults = getDefaultCtaForSurface(surfaceType);

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Button Type</Label>
        <Select value={value || "none"} onValueChange={onChange}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CTA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showButtonConfig && (
        <>
          {onButtonTextChange && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Button Text</Label>
              <Input
                value={buttonText || ctaLabel(value)}
                onChange={(e) => onButtonTextChange(e.target.value)}
                placeholder={defaults.buttonText || "e.g. Buy Now, Add, Order"}
              />
              <p className="text-xs text-muted-foreground">
                Edit the button text your buyers will see (e.g. Buy Now, Add, Order, Join)
              </p>
            </div>
          )}

          {onActionTypeChange && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Action / Link</Label>
              <Select value={actionType || "checkout"} onValueChange={onActionTypeChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === "external_url" && onActionUrlChange && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">URL</Label>
              <Input
                value={actionUrl || ""}
                onChange={(e) => onActionUrlChange(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
