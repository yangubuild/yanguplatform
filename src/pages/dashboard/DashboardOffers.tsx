import { OffersSearchBar } from "@/components/offers/OffersSearchBar";
import { OffersGrid } from "@/components/offers/OffersGrid";

/**
 * DashboardOffers – /dashboard/offers
 * Phase 1: Structure + layout only. Search bar + discovery grid.
 */
export default function DashboardOffers() {
  return (
    <div className="overflow-y-auto pb-10 min-h-screen bg-background">
      <OffersSearchBar />
      <OffersGrid />
    </div>
  );
}
