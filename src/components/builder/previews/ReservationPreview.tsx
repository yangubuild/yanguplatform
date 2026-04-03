/**
 * ReservationPreview — Fine dining / hotel reservation-style menu preview.
 * Extracted from the Gusto template pattern:
 * - Dark cinematic theme
 * - Reservation form (date, time, guests)
 * - Menu display only (no cart/checkout)
 * - Restaurant gallery
 * - Testimonials with rating
 * - Opening hours
 */

import { useState } from "react";
import { Star, Calendar, Clock, Users, MapPin } from "lucide-react";
import { DIETARY_TAGS } from "@/lib/builder/emenu/types";
import type { EmenuCategory, EmenuItem } from "@/lib/builder/emenu/types";

interface ReservationPreviewProps {
  schema: Record<string, unknown>;
  canvas?: {
    sectionId: string;
    onUpdateField?: (sectionId: string, fieldPath: string, value: unknown) => void;
    onImageReplace?: (sectionId: string, fieldPath: string, url: string, source: string) => void;
  };
}

function DietaryDot({ tagKey }: { tagKey: string }) {
  const tag = DIETARY_TAGS.find((t) => t.key === tagKey);
  if (!tag) return null;
  return <span className="text-xs opacity-70" title={tag.label}>{tag.icon}</span>;
}

function MenuItemRow({ item, currency }: { item: EmenuItem; currency: string }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/10 last:border-0">
      {item.image_url && (
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white/90">{item.name}</h4>
          {item.dietary_tags?.map((t) => <DietaryDot key={t} tagKey={t} />)}
        </div>
        {item.description && (
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.description}</p>
        )}
      </div>
      <span className="text-sm font-medium text-white/80 flex-shrink-0">{currency}{item.price}</span>
    </div>
  );
}

function ReservationForm({ schema }: { schema: Record<string, unknown> }) {
  const form = schema.reservation_form as Record<string, unknown> | undefined;
  const fields = (form?.fields as Array<Record<string, unknown>>) || [
    { key: "name", label: "Name", type: "text", placeholder: "Jane Smith" },
    { key: "email", label: "Email", type: "email", placeholder: "jane@email.com" },
    { key: "phone", label: "Phone Number", type: "tel", placeholder: "+256 123 456 789" },
    { key: "guests", label: "People", type: "number", placeholder: "1-10" },
    { key: "date", label: "Date", type: "date", placeholder: "mm/dd/yyyy" },
    { key: "time", label: "Time", type: "time", placeholder: "--:-- --" },
  ];
  const submitLabel = (form?.submit_label as string) || "Make Reservation";

  const iconMap: Record<string, React.ReactNode> = {
    date: <Calendar className="w-4 h-4 text-white/40" />,
    time: <Clock className="w-4 h-4 text-white/40" />,
    guests: <Users className="w-4 h-4 text-white/40" />,
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-serif text-white italic">
          {(schema.heading as string) || "Book a Table"}
        </h3>
        {schema.description && (
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            {schema.description as string}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key as string} className="space-y-1">
            <label className="text-xs text-white/70 italic">{field.label as string}</label>
            <div className="relative">
              <input
                type={(field.type as string) || "text"}
                placeholder={(field.placeholder as string) || ""}
                className="w-full bg-transparent border border-white/20 rounded-md px-3 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/40"
                readOnly
              />
              {iconMap[field.key as string] && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {iconMap[field.key as string]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-3 bg-white/10 border border-white/20 rounded-md text-sm text-white/90 hover:bg-white/15 transition-colors">
        {submitLabel}
      </button>
    </div>
  );
}

function TestimonialCard({ schema }: { schema: Record<string, unknown> }) {
  const testimonials = schema.testimonials as Record<string, unknown> | undefined;
  if (!testimonials?.enabled) return null;

  const items = (testimonials.items as Array<Record<string, unknown>>) || [];
  const firstItem = items[0];
  if (!firstItem) return null;

  const rating = (firstItem.rating as number) || 4.8;
  const reviewCount = (firstItem.review_count as number) || 0;

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-6 space-y-4">
      <h3 className="text-xl font-serif text-white italic leading-snug">
        "{firstItem.quote as string}"
      </h3>
      {firstItem.body && (
        <p className="text-xs text-white/50 leading-relaxed">
          "{firstItem.body as string}"
        </p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-900" />
          ))}
        </div>
        <span className="text-2xl font-semibold text-white">{rating}</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
          ))}
          {reviewCount > 0 && (
            <span className="text-xs text-white/40 ml-1">({reviewCount.toLocaleString()} Reviews)</span>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryGrid({ schema }: { schema: Record<string, unknown> }) {
  const gallery = schema.gallery as Record<string, unknown> | undefined;
  if (!gallery?.enabled) return null;

  const items = (gallery.items as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/70">{(gallery.heading as string) || "Our Restaurant"}</h4>
      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-800">
              <img src={item.image_url as string} alt={(item.caption as string) || ""} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg bg-zinc-800/60 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white/20" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpeningHours() {
  const hours = [
    { day: "Monday", time: "Closed" },
    { day: "Tuesday", time: "16:00 - 22:00" },
    { day: "Wednesday", time: "16:00 - 22:00" },
    { day: "Thursday", time: "16:00 - 22:00" },
    { day: "Friday", time: "17:00 - 22:00" },
    { day: "Sat - Sun", time: "17:00 - 22:00" },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/70">Opening Hours</h4>
      <div className="space-y-2">
        {hours.map((h, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-white/60">{h.day}</span>
            <span className="text-white/40">{"·".repeat(20)}</span>
            <span className={`${h.time === "Closed" ? "text-white/40" : "text-white/70"}`}>{h.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReservationPreview({ schema }: ReservationPreviewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const rawCategories = (schema.categories as EmenuCategory[]) || [];
  const categories = rawCategories.filter((c) => !c._hidden);
  const currency = (schema.currency_symbol as string) || (schema.currency as string) || "$";

  return (
    <div className="bg-zinc-950 text-white min-h-[600px]">
      {/* Two-column Gusto-style layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-0">
        {/* Left: Testimonial + Hero image area */}
        <div className="relative min-h-[500px] bg-zinc-900">
          {schema.hero_image_url ? (
            <img src={schema.hero_image_url as string} alt="" className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full p-6">
            <TestimonialCard schema={schema} />
          </div>
        </div>

        {/* Right: Sidebar with gallery, reservation, hours */}
        <div className="bg-zinc-950 p-6 space-y-6">
          <GalleryGrid schema={schema} />

          {/* Menu preview link */}
          <div className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer">
            <span className="text-sm text-white/80">Menu</span>
          </div>

          {/* Book a Table CTA */}
          <div className="border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
            <span className="text-sm text-white/80">Book a Table</span>
            <Calendar className="w-4 h-4 text-white/40" />
          </div>

          <OpeningHours />
        </div>
      </div>

      {/* Reservation Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-0 border-t border-white/10">
        <div className="relative min-h-[400px] bg-zinc-900">
          {schema.reservation_image_url ? (
            <img src={schema.reservation_image_url as string} alt="" className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 absolute inset-0" />
          )}
        </div>
        <div className="bg-zinc-950 p-8">
          <ReservationForm schema={schema} />
        </div>
      </div>

      {/* Menu Display-Only Section */}
      {categories.length > 0 && (
        <div className="border-t border-white/10 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-serif text-white italic mb-2">
              {(schema.heading as string) || "Menu"}
            </h3>
            {schema.description && (
              <p className="text-sm text-white/50 mb-6">{schema.description as string}</p>
            )}

            {/* Category accordion */}
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className="border-b border-white/10">
                <button
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-sm font-medium text-white/80">{cat.name}</span>
                  <span className={`text-white/40 transition-transform ${activeCategory === cat.name ? "rotate-180" : ""}`}>↓</span>
                </button>
                {(activeCategory === cat.name || activeCategory === null) && (
                  <div className="pb-4">
                    {(cat.items || []).map((item, itemIdx) => (
                      <MenuItemRow key={itemIdx} item={item} currency={currency} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="border-t border-white/10 p-12 text-center">
          <span className="text-4xl">🍷</span>
          <p className="text-sm text-white/40 mt-3">No menu items yet</p>
          <p className="text-xs text-white/25 mt-1">Add categories and dishes from the editor panel</p>
        </div>
      )}
    </div>
  );
}
