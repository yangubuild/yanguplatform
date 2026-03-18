import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Building2, Star, Users, Globe, CheckCircle, Flag, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useEntityDetail, useEntityReviews, useEntityFaqs, useRelatedEntities } from "@/hooks/useEntityDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/entity/ReviewForm";
import { ReportDialog } from "@/components/entity/ReportDialog";
import { ENTITY_TYPE_CONFIG, ENTITY_SUBTYPE_LABELS } from "@/types/search";
import type { SearchableEntityType, EntitySubtype } from "@/types/search";
import { getEntityRoute, isExternalRoute, getVerifiedBadgeColor } from "@/lib/entityRouting";

export default function EntityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: entity, isLoading } = useEntityDetail(slug);
  const { data: reviews } = useEntityReviews(entity?.id);
  const { data: faqs } = useEntityFaqs(entity?.id);
  const { data: related } = useRelatedEntities(entity?.entity_type, entity?.id);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

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

  if (!entity) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08120D" }}>
        <div className="text-center">
          <h1 className="text-white text-xl font-bold mb-2">Not Found</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>This entity doesn't exist or isn't published.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm underline" style={{ color: "#b5622a" }}>Back to home</button>
        </div>
      </div>
    );
  }

  const config = ENTITY_TYPE_CONFIG[entity.entity_type as SearchableEntityType];
  const subtypeLabel = entity.entity_subtype ? ENTITY_SUBTYPE_LABELS[entity.entity_subtype as EntitySubtype] : null;
  const badgeResult = entity.is_verified ? (
    entity.entity_type === "business" ? "orange" : entity.entity_type === "organization" ? "green" : "blue"
  ) : null;

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
              <Building2 className="w-12 h-12" style={{ color: "rgba(255,255,255,0.08)" }} />
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
              {badgeResult === "blue" && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">✓</span>}
              {badgeResult === "orange" && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white" style={{ background: "#b5622a" }}>✓</span>}
              {badgeResult === "green" && <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-[9px] text-white">✓</span>}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {config && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>{config.label}</span>
              )}
              {subtypeLabel && (
                <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>{subtypeLabel}</span>
              )}
              {entity.primary_category && <span>{entity.primary_category}</span>}
              {entity.industry && <span>· {entity.industry}</span>}
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
        <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          {entity.avg_rating && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {entity.avg_rating} ({entity.review_count})
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

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {entity.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
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
                  {expandedFaq === faq.id ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
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
          <h2 className="text-white text-lg font-bold">Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}</h2>
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
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No reviews yet. Be the first to review.</p>
        )}
      </div>

      {/* Related entities */}
      {related && related.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-white text-lg font-bold mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.slice(0, 6).map((r: any) => {
              const route = getEntityRoute(r);
              const ext = isExternalRoute(route);
              return (
                <div
                  key={r.id}
                  onClick={() => ext ? window.open(route, "_blank") : navigate(route)}
                  className="rounded-xl p-3 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-white text-sm font-semibold truncate block">{r.title}</span>
                  {r.short_description && <p className="text-xs line-clamp-1 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{r.short_description}</p>}
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
