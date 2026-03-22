import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CURRENCIES: Record<string, string> = {
  AED: "د.إ", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹",
  SAR: "﷼", CHF: "Fr", CAD: "C$", AUD: "A$", SGD: "S$", HKD: "HK$",
  KRW: "₩", BRL: "R$", ZAR: "R", NGN: "₦", KES: "KSh", EGP: "E£",
  TRY: "₺", MXN: "Mex$", THB: "฿", MYR: "RM", IDR: "Rp", PHP: "₱",
  SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč", RUB: "₽",
  NZD: "NZ$", QAR: "﷼", KWD: "د.ك", BHD: "BD", OMR: "OMR", UGX: "UGX",
  TZS: "TZS", GHS: "GH₵",
};

// Base prices in USD cents
const BASE_PRICES_USD = { day: 500, week: 2500, month: 8000 };

// Approximate exchange rates from USD
const RATES: Record<string, number> = {
  USD: 1, AED: 3.67, EUR: 0.92, GBP: 0.79, JPY: 149, CNY: 7.24, INR: 83,
  SAR: 3.75, CHF: 0.88, CAD: 1.36, AUD: 1.53, SGD: 1.34, HKD: 7.82,
  KRW: 1320, BRL: 4.97, ZAR: 18.5, NGN: 1550, KES: 153, EGP: 30.9,
  TRY: 30.2, MXN: 17.1, THB: 35.5, MYR: 4.72, IDR: 15600, PHP: 56.2,
  SEK: 10.5, NOK: 10.7, DKK: 6.87, PLN: 4.02, CZK: 23.1, RUB: 92,
  NZD: 1.63, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, UGX: 3780,
  TZS: 2520, GHS: 12.5,
};

function getUserCurrency(): { code: string; symbol: string } {
  try {
    const stored = localStorage.getItem("yangu_currency");
    if (stored && CURRENCIES[stored]) {
      return { code: stored, symbol: CURRENCIES[stored] };
    }
  } catch {}
  return { code: "AED", symbol: "د.إ" };
}

function convertPrice(usdCents: number, currencyCode: string): string {
  const rate = RATES[currencyCode] || 1;
  const amount = (usdCents / 100) * rate;
  // Round nicely
  const rounded = amount>= 100 ? Math.round(amount) : Math.round(amount * 100) / 100;
  return rounded.toLocaleString();
}

export function CreateOfferModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [header, setHeader] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [durationType, setDurationType] = useState("week");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = useMemo(() => getUserCurrency(), []);

  const durationOptions = useMemo(() => [
    { value: "day", label: "1 Day", price: `${currency.symbol} ${convertPrice(BASE_PRICES_USD.day, currency.code)}` },
    { value: "week", label: "1 Week", price: `${currency.symbol} ${convertPrice(BASE_PRICES_USD.week, currency.code)}` },
    { value: "month", label: "1 Month", price: `${currency.symbol} ${convertPrice(BASE_PRICES_USD.month, currency.code)}` },
  ], [currency]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !header.trim()) return;
    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `offers/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("media")
          .upload(path, imageFile, { contentType: imageFile.type });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const now = new Date();
      let expiresAt: string | null = null;
      if (durationType === "day") expiresAt = new Date(now.getTime() + 86400000).toISOString();
      else if (durationType === "week") expiresAt = new Date(now.getTime() + 604800000).toISOString();
      else expiresAt = new Date(now.getTime() + 2592000000).toISOString();

      const feeCents = BASE_PRICES_USD[durationType as keyof typeof BASE_PRICES_USD] || 2500;

      const { error } = await supabase
        .from("merchant_offers" as any)
        .insert({
          user_id: user.id,
          owner_type: "user",
          image_url: imageUrl,
          header: header.trim(),
          description: description.trim() || null,
          destination_url: destinationUrl.trim() || null,
          duration_type: durationType,
          fee_cents: feeCents,
          expires_at: expiresAt,
        } as any);

      if (error) throw error;

      toast.success("Offer created!");
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedDuration = durationOptions.find((d) => d.value === durationType)!;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md mx-auto rounded-2xl border border-white/10 flex flex-col"
        style={{ background: "#111a15", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Create offer</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-3 space-y-5">
          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Offer Image</label>
            <label className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-white/20 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Upload image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Offer Header</label>
            <input
              type="text"
              placeholder="Summer Sale"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="w-full rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Offer Description</label>
            <textarea
              placeholder="Describe your offer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Destination link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Destination Link</label>
            <input
              type="url"
              placeholder="https://..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Duration selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationType(opt.value)}
                  className={`rounded-xl px-3 py-3 text-center border transition-colors ${
                    durationType === opt.value
                      ? "border-accent/50 bg-accent/10 text-foreground"
                      : "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]"
                  }`}>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fee summary */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-muted-foreground">Offer fee</span>
            <span className="text-sm font-semibold text-foreground">{selectedDuration.price}</span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <button
            type="submit"
            disabled={isSubmitting || !header.trim()}
            onClick={handleSubmit as any}
            className="w-full h-12 rounded-xl text-sm font-semibold text-foreground transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}>
            {isSubmitting ? "Publishing…" : "Publish Offer"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
