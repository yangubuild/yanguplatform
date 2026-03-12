import { NavDashPromoCards } from "@/components/mass/navigation/NavDashPromoCards";
import { CustomProductOffer } from "@/components/offers/CustomProductOffer";

/**
 * DashboardOffers – Main /dashboard/offers page.
 * Re-uses the same promo banner carousel as the Dashboard home.
 */
export default function DashboardOffers() {
  return (
    <div>
      <NavDashPromoCards />
      <div className="px-6 md:px-10 lg:px-14 pb-6">
        <CustomProductOffer />
      </div>
    </div>
  );
}
