import { Plus, Tag, Gift, Percent, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromoEmptyStateProps {
  onCreateClick: () => void;
  onCreateOfferClick: () => void;
}

export function PromoEmptyState({ onCreateClick, onCreateOfferClick }: PromoEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-5">
      {/* Illustration area */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #b5622a22, #5c2a1222)" }}
        />
        <div className="relative flex items-center justify-center">
          <Gift className="w-10 h-10 text-accent" />
          <Tag className="w-7 h-7 text-accent/70 absolute -top-2 -right-3 rotate-12" />
          <Percent className="w-5 h-5 text-accent/50 absolute -bottom-1 -left-3 -rotate-12" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Create your <span className="text-accent">first</span> promo code or offer
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Get more sales by creating promo codes or visual offer ads to share with users!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-sm sm:max-w-none sm:w-auto px-4 sm:px-0">
        <Button onClick={onCreateClick} variant="solid" className="px-5 h-10 gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Create promo code
        </Button>
        <Button variant="accent" onClick={onCreateOfferClick} className="px-6 h-10 gap-2 w-full sm:w-auto">
          <Send className="w-4 h-4" />
          Create Offer
        </Button>
      </div>
    </div>
  );
}
