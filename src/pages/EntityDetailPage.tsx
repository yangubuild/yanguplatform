import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Building2, Star, Users, Globe, Flag, ChevronDown, ChevronUp, ShieldCheck,
  MessageSquare, Package, Wrench, Palette, Landmark, Calendar, MapPin, Tag,
} from "lucide-react";
import { useEntityDetail, useEntityReviews, useEntityFaqs, useRelatedEntities } from "@/hooks/useEntityDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/entity/ReviewForm";
import { ReportDialog } from "@/components/entity/ReportDialog";
import { recordEntityClick } from "@/lib/sessionMemory";
import { ENTITY_TYPE_CONFIG, ENTITY_SUBTYPE_LABELS } from "@/types/search";
import type { SearchableEntityType, EntitySubtype } from "@/types/search";
import { getEntityRoute, isExternalRoute } from "@/lib/entityRouting";
import { getVerificationDepth, getTrustTier, getReviewConfidence } from "@/lib/trustSignals";

const TYPE_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  product: Package, service: Wrench, business: Building2, creator: Star,
  organization: Landmark, community: Users, project: Palette,
};

/** Type-aware metadata block — renders differently per entity_type */
function TypeMetaBlock({ entity }: { entity: any }) {
  const et = entity.entity_type as string;
  const items: { icon: React.FC<any>; label: string; value: string }[] = [];

  if (entity.industry) items.push({ icon: Tag, label: "Industry", value: entity.industry });
  if (entity.primary_category) items.push({ icon: Tag, label: "Category", value: entity.primary_category });
  if (entity.published_at) items.push({ icon: Calendar, label: et === "community" ? "Founded" : "Published", value: new Date(entity.published_at).toLocaleDateString() });
  if (entity.surface_type) {
    const surfaceLabel =
      et === "product" || et === "business" ? "Surface" :
      et === "creator" ? "Profile type" :
      et === "community" ? "Group type" : "Type";
    items.push({ icon: MapPin, label: surfaceLabel, value: entity.surface_type });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <item.icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
          </div>
          <span className="text-white text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function EntityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: entity, isLoading, isError } = useEntityDetail(slug);
  const { data: reviews } = useEntityReviews(entity?.id);
  const { data: faqs } = useEntityFaqs(entity?.id);
  const { data: related } = useRelatedEntities(entity?.id);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Record session click for personalization
  useEffect(() => {
    if (entity) {
      recordEntityClick({
        id: entity.id,
        entity_type: entity.entity_type,
        primary_category: entity.primary_category,
        tags: entity.tags,
      });
    }
  }, [entity?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#08120D" }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-56 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-96 mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!entity || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08120D" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Building2 className="w-7 h-7" style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Not Found</h1>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            This page doesn't exist or isn't published yet.
          </p>
          <button onClick={() => navigate("/")} className="text-sm font-medium px-5 py-2 rounded-lg" style={{ background: "rgba(181,98,42,0.15)", color: "#b5622a" }}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const config = ENTITY_TYPE_CONFIG[entity.entity_type as SearchableEntityType];
  const subtypeLabel = entity.entity_subtype ? ENTITY_SUBTYPE_LABELS[entity.entity_subtype as EntitySubtype] : null;
  const Icon = TYPE_ICONS[entity.entity_type] || Building2;
  const badgeColor =
    entity.is_verified
      ? entity.entity_type === "business" ? "orange" : entity.entity_type === "organization" ? "green" : "blue"
      : null;

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      {/* Back nav */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Cover */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-48 sm:h-56 rounded-2xl overflow-hidden mb-6" style={{ background: "rgba(255,255,255,0.03)" }}>
          {entity.cover_image_url ? (
            <img src={entity.cover_image_url} alt={entity.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-12 h-12" style={{ color: "rgba(255,255,255,0.08)" }} />
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-2xl font-bold">{entity.title}</h1>
              {badgeColor === "blue" && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">✓</span>}
              {badgeColor === "orange" && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white" style={{ background: "#b5622a" }}>✓</span>}
              {badgeColor === "green" && <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-[9px] text-white">✓</span>}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {config && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>{config.label}</span>
              )}
              {subtypeLabel && subtypeLabel !== "General" && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>{subtypeLabel}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entity.domain_host && (
              <a href={`https://${entity.domain_host}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(181,98,42,0.15)", color: "#b5622a" }}>
                <Globe className="w-3.5 h-3.5" /> Visit
              </a>
            )}
            <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>
              <Flag className="w-3.5 h-3.5" /> Report
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 text-sm flex-wrap" style={{ color: "rgba(255,255,255,0.4)" }}>
          {typeof entity.avg_rating === "number" && entity.avg_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {entity.avg_rating.toFixed(1)} ({entity.review_count})
            </span>
          )}
          {typeof entity.trust_score === "number" && entity.trust_score >= 30 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", color: "rgb(74,222,128)" }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Trusted
            </span>
          )}
          {entity.visibility_tier !== "free" && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(181,98,42,0.15)", color: "#b5622a" }}>
              {entity.visibility_tier}
            </span>
          )}
          {entity.published_at && (
            <span className="text-xs">Published {new Date(entity.published_at).toLocaleDateString()}</span>
          )}
        </div>

        {/* Description */}
        {entity.short_description && (
          <p className="mt-6 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            {entity.short_description}
          </p>
        )}

        {/* Type-aware metadata block */}
        <TypeMetaBlock entity={entity} />

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {entity.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FAQs — only rendered when data exists, no dead controls */}
      {faqs && faqs.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <h2 className="text-white text-lg font-bold mb-4">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-white text-sm font-medium">{faq.question}</span>
                  {expandedFaq === faq.id ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">
            Reviews{reviews && reviews.length > 0 ? ` (${reviews.length})` : ""}
          </h2>
          <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(181,98,42,0.15)", color: "#b5622a" }}>
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
            Write a review
          </button>
        </div>

        {showReviewForm && entity && (
          <div className="mb-6">
            <ReviewForm entityId={entity.id} onSuccess={() => setShowReviewForm(false)} />
          </div>
        )}

        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"}`} />
                    ))}
                  </div>
                  {review.title && <span className="text-white text-sm font-medium">{review.title}</span>}
                </div>
                {review.body && <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{review.body}</p>}
                <span className="text-[10px] mt-2 block" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl py-8 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Star className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No reviews yet. Be the first to share your experience.</p>
          </div>
        )}
      </div>

      {/* Related entities — intelligent cross-category recommendations */}
      {related && related.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-white text-lg font-bold mb-4">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.slice(0, 6).map((r: any) => {
              const route = getEntityRoute(r);
              const ext = isExternalRoute(route);
              const RelIcon = TYPE_ICONS[r.entity_type] || Building2;
              const isCrossType = entity && r.entity_type !== entity.entity_type;
              const relConfig = ENTITY_TYPE_CONFIG[r.entity_type as SearchableEntityType];
              return (
                <div
                  key={r.id}
                  onClick={() => ext ? window.open(route, "_blank") : navigate(route)}
                  className="rounded-xl p-3 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RelIcon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                    <span className="text-white text-sm font-semibold truncate">{r.title}</span>
                    {r.is_verified && <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-[7px] text-white">✓</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isCrossType && relConfig && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                        {relConfig.label}
                      </span>
                    )}
                    {r.short_description && <p className="text-xs line-clamp-1" style={{ color: "rgba(255,255,255,0.4)" }}>{r.short_description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Dialog */}
      {entity && (
        <ReportDialog entityId={entity.id} entityTitle={entity.title} open={showReport} onOpenChange={setShowReport} />
      )}
    </div>
  );
}
