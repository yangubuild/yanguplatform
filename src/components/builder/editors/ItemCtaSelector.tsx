import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CTA_OPTIONS = [
  { value: "none", label: "No Button" },
  { value: "buy_now", label: "Buy Now" },
  { value: "add_to_cart", label: "Add to Cart" },
  { value: "order_now", label: "Order Now" },
  { value: "book_now", label: "Book Now" },
  { value: "join_now", label: "Join Now" },
  { value: "contact_seller", label: "Contact Seller" },
  { value: "reserve", label: "Reserve" },
  { value: "access", label: "Access" },
  { value: "download", label: "Download" },
  { value: "view", label: "View" },
] as const;

export type CtaValue = (typeof CTA_OPTIONS)[number]["value"];

/** Resolves a CTA value to its display label */
export function ctaLabel(value: string | undefined): string {
  if (!value || value === "none") return "";
  return CTA_OPTIONS.find((o) => o.value === value)?.label || value;
}

interface ItemCtaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ItemCtaSelector({ value, onChange, className }: ItemCtaSelectorProps) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <Label className="text-xs">CTA Button</Label>
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
  );
}
