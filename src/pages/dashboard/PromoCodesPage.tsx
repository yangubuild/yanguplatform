import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PromoEmptyState } from "@/components/promo-codes/PromoEmptyState";
import { CreatePromoModal } from "@/components/promo-codes/CreatePromoModal";
import { PromoSuccessModal } from "@/components/promo-codes/PromoSuccessModal";
import { PromoCodesList } from "@/components/promo-codes/PromoCodesList";
import { CreateOfferModal } from "@/components/promo-codes/CreateOfferModal";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PromoCodeFormData {
  code: string;
  discountValue: number;
  discountType: "percentage" | "fixed";
  duration: "forever" | "one-time" | "multiple_months";
  durationMonths?: number;
  eligibleUsers: "everyone" | "only_new" | "only_churned";
  affiliateId?: string;
  setExpiration: boolean;
  expiresAt?: string;
  setMaxRedemptions: boolean;
  maxRedemptions?: number;
  oneUsePerUser: boolean;
  applyToSpecificProducts: boolean;
  applicableProductIds: string[];
  surfaceId?: string;
}

export interface CreatedPromo {
  id: string;
  code: string;
  promoLink: string;
  discountValue: number;
  discountType: string;
  expiresAt?: string;
  surfaceTitle?: string;
}

export default function PromoCodesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [createdPromo, setCreatedPromo] = useState<CreatedPromo | null>(null);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ["merchant-promo-codes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("merchant_promo_codes" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (form: PromoCodeFormData) => {
      if (!user) throw new Error("Not authenticated");

      const baseUrl = window.location.origin;
      const promoLink = `${baseUrl}/promo/${form.code}`;

      const { data, error } = await supabase
        .from("merchant_promo_codes" as any)
        .insert({
          user_id: user.id,
          code: form.code.toUpperCase().replace(/\s/g, "_"),
          discount_type: form.discountType,
          discount_value: form.discountValue,
          duration: form.duration,
          duration_months: form.duration === "multiple_months" ? (form.durationMonths || 1) : null,
          eligible_users: form.eligibleUsers,
          affiliate_id: form.affiliateId || null,
          expires_at: form.setExpiration && form.expiresAt ? form.expiresAt : null,
          max_redemptions: form.setMaxRedemptions ? (form.maxRedemptions || 1) : null,
          one_use_per_user: form.oneUsePerUser,
          applicable_product_ids: form.applyToSpecificProducts ? form.applicableProductIds : [],
          surface_id: form.surfaceId || null,
          promo_link: promoLink,
          popup_config: {
            title: form.code,
            discount: `${form.discountValue}${form.discountType === "percentage" ? "%" : "$"} OFF`,
            cta: "Apply Code",
            expires: form.setExpiration && form.expiresAt ? form.expiresAt : null,
          },
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { ...(data as any), promoLink };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["merchant-promo-codes"] });
      setShowCreate(false);
      setCreatedPromo({
        id: data.id,
        code: data.code,
        promoLink: data.promo_link || data.promoLink,
        discountValue: data.discount_value,
        discountType: data.discount_type,
        expiresAt: data.expires_at,
      });
      toast.success("Promo code created!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create promo code");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full">
      {promoCodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-6">
          <PromoEmptyState onCreateClick={() => setShowCreate(true)} />
          {/* Create Offer CTA below promo empty state */}
          <div className="border-t border-white/[0.06] pt-6 w-full max-w-sm mx-auto text-center flex flex-col items-center gap-4">
            {/* Offer illustration icon */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(135deg, #b5622a22, #5c2a1222)" }}
              />
              <div className="relative flex items-center justify-center">
                <Send className="w-10 h-10 text-accent" />
                <ImageIcon className="w-7 h-7 text-accent/70 absolute -top-2 -right-3 rotate-12" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Create your <span className="text-accent">first</span> offer
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Promote your business with visual offer ads
              </p>
            </div>
            <Button
              variant="accent"
              onClick={() => setShowCreateOffer(true)}
              className="rounded-xl px-6 h-10 gap-2"
            >
              <Send className="w-4 h-4" />
              Create Offer
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <PromoCodesList
            promoCodes={promoCodes}
            onCreateClick={() => setShowCreate(true)}
          />
          {/* Create Offer section below promo codes list */}
          <div className="px-4 md:px-6 pb-6">
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Offers</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Create visual offer ads to promote your business</p>
                </div>
                <Button
                  variant="accent"
                  onClick={() => setShowCreateOffer(true)}
                  className="rounded-xl px-4 h-9 gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  Create Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreatePromoModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={(form) => createMutation.mutate(form)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {showCreateOffer && (
        <CreateOfferModal
          open={showCreateOffer}
          onClose={() => setShowCreateOffer(false)}
        />
      )}

      {createdPromo && (
        <PromoSuccessModal
          open={!!createdPromo}
          onClose={() => setCreatedPromo(null)}
          promo={createdPromo}
        />
      )}
    </div>
  );
}