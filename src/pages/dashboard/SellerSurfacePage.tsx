import { useCallback } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getEngine } from "@/lib/builder/engineRegistry";
import { BuilderEntryScreen } from "@/components/builder/BuilderEntryScreen";
import { EmenuWizard, type WizardData } from "@/components/builder/EmenuWizard";
import { useState } from "react";

/** Map legacy seller keys → engine keys */
const SELLER_KEY_MAP: Record<string, string> = {
  emenu: "emenu",
  esite: "esite",
  eshop: "eshop",
  estore: "estore",
};

interface Props {
  sellerKey: string;
}

/**
 * Unified seller entry page.
 * For emenu, the "Build Manually" path still opens the existing EmenuWizard (identical questions).
 * For other categories, it uses the generic BuilderManualWizard via BuilderEntryScreen.
 */
export default function SellerSurfacePage({ sellerKey }: Props) {
  const { user } = useAuth();
  const { initAndNavigate } = useBuilderSurfaceInit();
  const engineKey = SELLER_KEY_MAP[sellerKey] || sellerKey;
  const engine = getEngine(engineKey);

  // Emenu wizard state (for backward-compat manual flow)
  const [emenuWizardOpen, setEmenuWizardOpen] = useState(false);

  /** Handle wizard/AI completion — build seed sections and navigate to editor */
  const handleComplete = useCallback(async (answers: Record<string, unknown>) => {
    if (!engine || !user?.id) { toast.error("You must be logged in"); return null; }

    const businessName = String(answers.business_name || answers.display_name || answers.community_name || "Untitled");
    const slug = String(answers.slug || businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40));

    const seedSections = engine.defaultSections.map((s) => {
      const schema = { ...s.schema };
      if (s.type === "hero" && !schema.headline) schema.headline = businessName;
      if (s.type === "contact") {
        if (answers.contact_email) schema.email = answers.contact_email;
        if (answers.contact_phone) schema.phone = answers.contact_phone;
        if (answers.location) schema.address = answers.location;
      }
      return { type: s.type, schema };
    });

    const metadata: Record<string, unknown> = {};
    if (answers.primary_color) metadata.brand = { primary_color: answers.primary_color };
    if (answers._ai_setup) metadata.ai_setup = true;

    return initAndNavigate({
      surfaceType: engine.surfaceType,
      slug,
      title: businessName,
      seedSections,
      metadata,
    });
  }, [user, engine, initAndNavigate]);

  /** Handle emenu wizard completion (existing flow, identical questions) */
  const handleEmenuWizardComplete = useCallback(async (wd: WizardData) => {
    if (!user?.id) { toast.error("You must be logged in"); return; }

    const socialLinks: Record<string, string> = {};
    if (wd.social_website) socialLinks.website = wd.social_website;
    if (wd.social_instagram) socialLinks.instagram = wd.social_instagram;
    if (wd.social_facebook) socialLinks.facebook = wd.social_facebook;
    if (wd.social_twitter) socialLinks.twitter = wd.social_twitter;
    if (wd.social_tiktok) socialLinks.tiktok = wd.social_tiktok;

    const paymentMethods: Record<string, unknown>[] = [];
    if (wd.pay_cash) paymentMethods.push({ method: "cash", label: "Cash" });
    if (wd.pay_mobile_money) paymentMethods.push({
      method: "mobile_money", label: "Mobile Money",
      number: wd.mobile_money_number, name: wd.mobile_money_name,
    });
    if (wd.pay_card) paymentMethods.push({ method: "card", label: "Card / Stripe" });
    if (wd.pay_paypal) paymentMethods.push({ method: "paypal", label: "PayPal" });

    const orderTypes: string[] = [];
    if (wd.order_dine_in) orderTypes.push("dine_in");
    if (wd.order_takeaway) orderTypes.push("takeaway");
    if (wd.order_delivery) orderTypes.push("delivery");

    const seedSections: { type: string; schema: Record<string, unknown> }[] = [
      {
        type: "hero",
        schema: {
          headline: wd.business_name, subheadline: "",
          media: wd.hero_banner_url ? {
            type: "image", source: "upload", url: wd.hero_banner_url, alt: `${wd.business_name} banner`, fit: "cover",
          } : { type: "none", source: "url", url: "", alt: "", fit: "contain" },
          logo: wd.logo_url || "", logo_position: wd.logo_position || "left",
        },
      },
      { type: "menu", schema: { heading: "Menu", categories: [], layout_style: wd.layout_style, currency: wd.currency, currency_symbol: wd.currency_symbol } },
      { type: "hours", schema: { heading: "Opening Hours", items: [] } },
      { type: "contact", schema: { heading: "Contact", email: wd.contact_email, phone: wd.contact_phone, address: wd.location } },
    ];

    if (Object.keys(socialLinks).length > 0) {
      seedSections.push({ type: "social", schema: { handles: socialLinks } });
    }

    const surfaceMetadata = {
      brand: { logo: wd.logo_url, primary_color: wd.primary_color },
      header: { logo_position: wd.logo_position, logo_size: wd.logo_size, show_name: wd.show_business_name },
      order_types: orderTypes,
      payment_methods: paymentMethods,
    };

    try {
      await initAndNavigate({
        surfaceType: "emenu",
        slug: wd.slug,
        title: wd.business_name,
        seedSections,
        metadata: surfaceMetadata,
      });
      setEmenuWizardOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create menu");
    }
  }, [user, initAndNavigate]);

  if (!engine) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <p className="text-muted-foreground">Unknown builder category: {sellerKey}</p>
      </div>
    );
  }

  // For emenu, we use a custom entry that still opens the existing EmenuWizard for manual path
  if (engineKey === "emenu") {
    return (
      <>
        <BuilderEntryScreen engine={engine} onComplete={handleComplete} />
        <EmenuWizard
          open={emenuWizardOpen}
          onOpenChange={setEmenuWizardOpen}
          onComplete={handleEmenuWizardComplete}
        />
      </>
    );
  }

  return <BuilderEntryScreen engine={engine} onComplete={handleComplete} />;
}
