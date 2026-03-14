import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Users, Eye } from "lucide-react";

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
  businesses: PremiumBusiness[];
}

export function PremiumBusinessRow({ title, subtitle, businesses }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-white text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
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
        {businesses.map((biz, i) => (
          <div
            key={i}
            className="shrink-0 w-[290px] rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', scrollSnapAlign: 'start' }}
          >
            {/* Cover */}
            <div className="h-[170px] overflow-hidden">
              <img src={biz.coverImage} alt={biz.name} className="w-full h-full object-cover" />
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <img src={biz.profileImage} alt={biz.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-semibold truncate">{biz.name}</span>
                    {biz.verified === "blue" && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shrink-0">✓</span>
                    )}
                    {biz.verified === "orange" && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ background: '#b5622a' }}>✓</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>by {biz.creator}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{biz.description}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {biz.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {biz.rating} {biz.reviewCount && `(${biz.reviewCount})`}
                  </span>
                )}
                {biz.members && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{biz.members}</span>}
                {biz.views && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{biz.views}</span>}
                {biz.launchedAgo && <span>{biz.launchedAgo}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
