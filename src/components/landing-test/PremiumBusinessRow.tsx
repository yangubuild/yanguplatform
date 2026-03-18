import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Users, Building2, Package, Wrench, Palette, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { T } from "@/lib/typography";
import type { SearchEntityResult } from "@/types/search";
import { ENTITY_TYPE_CONFIG } from "@/types/search";
import { getEntityRoute, isExternalRoute, getVerifiedBadgeColor } from "@/lib/entityRouting";
import { useImpressionTracker } from "@/hooks/useDiscoveryTracking";
import type { DiscoverySurface } from "@/lib/discoveryAnalytics";

export interface PremiumBusiness {
  coverImage: string;
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
  title: string;
  subtitle?: string;
  businesses?: PremiumBusiness[];
  entities?: SearchEntityResult[];
  trackingSurface?: DiscoverySurface;
}

const TYPE_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  product: Package,
  service: Wrench,
  business: Building2,
  creator: Star,
  organization: Landmark,
  community: Users,
  project: Palette,
};

function EntityCard({ entity }: { entity: SearchEntityResult }) {
  const navigate = useNavigate();
  const route = getEntityRoute(entity);
  const ext = isExternalRoute(route);
  const badge = getVerifiedBadgeColor(entity);
  const Icon = TYPE_ICONS[entity.entity_type] || Building2;
  const config = ENTITY_TYPE_CONFIG[entity.entity_type];

  return (
    <div
      onClick={() => ext ? window.open(route, "_blank") : navigate(route)}
      className="shrink-0 w-[290px] rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', scrollSnapAlign: 'start' }}
    >
      <div className="h-[170px] overflow-hidden">
        {entity.cover_image_url ? (
          <img src={entity.cover_image_url} alt={entity.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Icon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.1)' }} />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-white ${T.body} font-semibold truncate`}>{entity.title}</span>
              {badge === "blue" && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
              {badge === "orange" && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ background: '#b5622a' }}>✓</span>}
              {badge === "green" && <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
            </div>
            {entity.primary_category && (
              <span className={T.bodyCompact} style={{ color: 'rgba(255,255,255,0.35)' }}>{entity.primary_category}</span>
            )}
          </div>
        </div>
        {entity.short_description && (
          <p className={`${T.bodyCompact} mb-3 line-clamp-2`} style={{ color: 'rgba(255,255,255,0.45)' }}>{entity.short_description}</p>
        )}
        <div className={`flex items-center gap-3 ${T.bodyCompact}`} style={{ color: 'rgba(255,255,255,0.35)' }}>
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
    </div>
  );
}

export function PremiumBusinessRow({ title, subtitle, businesses, entities }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const hasLive = entities && entities.length > 0;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className={`text-white ${T.sectionH2}`}>{title}</h2>
          {subtitle && <p className={`${T.body} mt-1`} style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll("left")} className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide mt-4 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {hasLive
          ? entities.map((entity) => <EntityCard key={entity.id} entity={entity} />)
          : businesses?.map((biz, i) => (
            <div key={i} className="shrink-0 w-[290px] rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', scrollSnapAlign: 'start' }}>
              <div className="h-[170px] overflow-hidden">
                <img src={biz.coverImage} alt={biz.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={biz.profileImage} alt={biz.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-white ${T.body} font-semibold truncate`}>{biz.name}</span>
                      {biz.verified === "blue" && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>}
                      {biz.verified === "orange" && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ background: '#b5622a' }}>✓</span>}
                    </div>
                    <span className={T.bodyCompact} style={{ color: 'rgba(255,255,255,0.35)' }}>by {biz.creator}</span>
                  </div>
                </div>
                <p className={`${T.bodyCompact} mb-3 line-clamp-2`} style={{ color: 'rgba(255,255,255,0.45)' }}>{biz.description}</p>
                <div className={`flex items-center gap-3 ${T.bodyCompact}`} style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {biz.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{biz.rating} {biz.reviewCount && `(${biz.reviewCount})`}</span>}
                  {biz.members && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{biz.members}</span>}
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
