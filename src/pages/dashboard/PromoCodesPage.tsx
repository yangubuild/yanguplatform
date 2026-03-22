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
      <div className="flex items-center justify-center h-full min-h-[60vh] min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      {promoCodes.length === 0 ? (
        <PromoEmptyState
          onCreateClick={() => setShowCreate(true)}
          onCreateOfferClick={() => setShowCreateOffer(true)}
        />
      ) : (
        <div>
          <PromoCodesList
            promoCodes={promoCodes}
            onCreateClick={() => setShowCreate(true)}
          />
          {/* Create Offer section below promo codes list */}
          <div className="px-4 md:px-6 pb-6">
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Offers</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Create visual offer ads to promote your business</p>
                </div>
                <Button
                  variant="accent"
                  onClick={() => setShowCreateOffer(true)}
                  className="px-4 h-9 gap-2 text-sm">
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