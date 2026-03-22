import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { getMarketplaceListings, getHotOffers, type AffiliateMarketplaceRow, type AffiliateOffer } from "@/lib/affiliateCanonicalData";

interface AffiliateJoinState {
  joinedIds: Set<string>;
  isJoined: (id: string) => boolean;
  joinAffiliate: (id: string, name: string) => void;
  marketplaceListings: AffiliateMarketplaceRow[];
  hotOffers: AffiliateOffer[];
}

const AffiliateJoinCtx = createContext<AffiliateJoinState | null>(null);

export function AffiliateJoinProvider({ children }: { children: ReactNode }) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [listings] = useState<AffiliateMarketplaceRow[]>(() => getMarketplaceListings());
  const [offers] = useState<AffiliateOffer[]>(() => getHotOffers());

  const isJoined = useCallback((id: string) => joinedIds.has(id), [joinedIds]);

  const joinAffiliate = useCallback((id: string, name: string) => {
    setJoinedIds(prev => {
      if (prev.has(id)) {
        toast.info("Already joined this affiliate program");
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      toast.success("Successfully joined affiliate program");
      return next;
    });
  }, []);

  return (
    <AffiliateJoinCtx.Provider value={{
      joinedIds,
      isJoined,
      joinAffiliate,
      marketplaceListings: listings,
      hotOffers: offers }}>
      {children}
    </AffiliateJoinCtx.Provider>
  );
}

export function useAffiliateJoin() {
  const ctx = useContext(AffiliateJoinCtx);
  if (!ctx) throw new Error("useAffiliateJoin must be used within AffiliateJoinProvider");
  return ctx;
}
