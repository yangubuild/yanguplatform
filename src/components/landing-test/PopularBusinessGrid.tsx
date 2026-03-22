import { Building2, Package, Wrench, Star as StarIcon, Users, Palette, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { T } from "@/lib/typography";
import type { SearchEntityResult } from "@/types/search";
import { ENTITY_TYPE_CONFIG } from "@/types/search";
import { getEntityRoute, isExternalRoute, getVerifiedBadgeColor } from "@/lib/entityRouting";
import { useImpressionTracker } from "@/hooks/useExploreTracking";

export interface PopularBusiness {
  profileImage: string;
  name: string;
  creator: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  members?: string;
  views?: string;
  launchedAgo?: string;
  verified?: "blue" | "orange";
}

interface Props {
  businesses?: PopularBusiness[];
  entities?: SearchEntityResult[];
}

const TYPE_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  product: Package,
  service: Wrench,
  business: Building2,
  creator: StarIcon,
  organization: Landmark,
  community: Users,
  project: Palette,
};

function EntityGridCard({ entity, onClickTrack }: { entity: SearchEntityResult; onClickTrack?: (e: SearchEntityResult) => void }) {
  const navigate = useNavigate();
  const route = getEntityRoute(entity);
  const ext = isExternalRoute(route);
  const badge = getVerifiedBadgeColor(entity);
  const Icon = TYPE_ICONS[entity.entity_type] || Building2;
  const config = ENTITY_TYPE_CONFIG[entity.entity_type];

  return (
    <div
      onClick={() => { onClickTrack?.(entity); ext ? window.open(route, "_blank") : navigate(route); }}
      className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-3 mb-2">
        {entity.avatar_url ? (
          <img src={entity.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : entity.cover_image_url ? (
          <img src={entity.cover_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-white text-sm font-semibold truncate min-w-0 flex-1">{entity.title}</span>
            {badge === "blue" && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
            {badge === "orange" && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ background: '#b5622a' }}>✓</span>}
            {badge === "green" && <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
          </div>
          {entity.primary_category && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{entity.primary_category}</span>
          )}
        </div>
      </div>
      {entity.short_description && (
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{entity.short_description}</p>
      )}
      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {config?.label || entity.entity_type}
        </span>
        {entity.visibility_tier !== 'free' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(181,98,42,0.15)', color: '#b5622a' }}>
            {entity.visibility_tier}
          </span>
        )}
      </div>
    </div>
  );
}

export function PopularBusinessGrid({ businesses, entities }: Props) {
  const hasLive = entities && entities.length > 0;
  const { ref: trackRef, handleClick } = useImpressionTracker(entities ?? [], "popular_grid");

  return (
    <section className="mb-12" ref={trackRef}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Popular businesses</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasLive
          ? entities.map((entity) => <EntityGridCard key={entity.id} entity={entity} onClickTrack={handleClick} />)
          : businesses?.map((biz, i) => (
            <div key={i} className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 mb-2">
                <img src={biz.profileImage} alt={biz.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-semibold truncate">{biz.name}</span>
                    {biz.verified === "blue" && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
                    {biz.verified === "orange" && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ background: '#b5622a' }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>by {biz.creator}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{biz.description}</p>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {biz.rating && <span>★ {biz.rating} {biz.reviewCount && `(${biz.reviewCount})`}</span>}
                {biz.members && <span>{biz.members} members</span>}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
