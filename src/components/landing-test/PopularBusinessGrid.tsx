import { Star, Users, Eye } from "lucide-react";

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
  businesses: PopularBusiness[];
}

export function PopularBusinessGrid({ businesses }: Props) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-xl font-bold">Popular businesses</h2>
        <button
          className="text-sm px-4 py-2 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          Business Type
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {businesses.map((biz, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
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
            <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
        ))}
      </div>
    </section>
  );
}
