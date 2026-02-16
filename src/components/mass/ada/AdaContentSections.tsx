import { Brain, Wand2, Search, Target, Link, ChevronRight } from "lucide-react";
import { useState } from "react";

/* ── 1. Four Steps ── */
const steps = [
  { num: 1, title: "Understand & Reason", desc: "ADA interprets goals, prompts, and platform context to guide users intelligently across YANGU." },
  { num: 2, title: "Create with AI Tools", desc: "Generate images, campaigns, content, and assets using embedded AI engines and workflows." },
  { num: 3, title: "Product Intelligence", desc: "ADA helps structure offers, communities, digital products, and growth strategies." },
  { num: 4, title: "Publish & Grow", desc: "ADA assists with publishing flows, optimization, and directing users to the right YANGU tools like Studio or Community." },
];

/* ── 2. Feature blocks ── */
const features = [
  { icon: Brain, title: "Motion & Visual Generation", desc: "High-level AI image creation, campaign visuals, and creative asset generation." },
  { icon: Wand2, title: "Embedded AI Tools", desc: "Integrated workflows connected to Studio, Community, and future modules." },
  { icon: Search, title: "Product Reasoning Engine", desc: "ADA understands business logic, funnels, and creator workflows." },
  { icon: Target, title: "Creator Optimization", desc: "Guidance for positioning, branding, monetization, and content strategy." },
  { icon: Link, title: "Platform Intelligence", desc: "ADA understands YANGU routing, surfaces, and ecosystem structure." },
];

/* ── 3. Reviews ── */
const longReviews = [
  { name: "Ray B.", text: "ADA feels like working with a strategist and a builder at the same time. It understands where I want my brand to go and guides me step by step." },
  { name: "Thomas", text: "I used many AI tools before, but ADA feels integrated into a real ecosystem. It doesn't just generate — it helps me think and execute." },
];
const shortReviews = [
  { name: "Karin", text: "Fast, intuitive, and actually understands creators." },
  { name: "Andrew B.", text: "ADA turned my ideas into structured products." },
  { name: "Rasmus J.", text: "It's freakishly accurate with suggestions." },
  { name: "Kate", text: "Feels like having an AI co-founder." },
];

/* ── 4. FAQs ── */
const faqs = [
  { q: "Does ADA create videos?", a: "No. ADA guides video creation and workflows but video generation happens through YANGU Studio tools." },
  { q: "Does ADA generate AI avatars?", a: "ADA helps plan and guide avatar creation, but generation happens inside supported AI engines within Studio." },
  { q: "Can ADA build my business strategy?", a: "Yes. ADA helps structure offers, positioning, and platform workflows." },
  { q: "Is ADA only for creators?", a: "No. Agencies, brands, and communities can use ADA." },
  { q: "Does ADA replace designers or developers?", a: "ADA accelerates creation but works best alongside creators and teams." },
  { q: "Is ADA connected to all YANGU modules?", a: "Yes. ADA understands Studio, Community, and future platform tools." },
];

export function AdaContentSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="lg:ml-[280px]">

      {/* ── Section 1: Four Steps ── */}
      <section className="px-6 pt-2 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col items-center text-center relative">
              {/* Step number */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white mb-4"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {s.num}
              </div>
              {/* Connector line (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-white/10" />
              )}
              <h3 className="text-white text-sm font-semibold mb-2" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
                {s.title}
              </h3>
              <p className="text-white/50 text-xs leading-relaxed max-w-[200px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Spacer (no divider) ── */}
      <div className="h-8" />

      {/* ── Section 2: Feature Blocks ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2
          className="text-white text-3xl md:text-4xl font-bold text-center mb-16"
          style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
        >
          A Superhuman AI Command System
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.slice(0, 3).map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon className="w-5 h-5 text-white/60" />
                </div>
                <h3 className="text-white text-base font-semibold mb-2" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-white/45 text-sm leading-relaxed max-w-[280px]">{f.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 max-w-2xl mx-auto">
          {features.slice(3).map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon className="w-5 h-5 text-white/60" />
                </div>
                <h3 className="text-white text-base font-semibold mb-2" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-white/45 text-sm leading-relaxed max-w-[280px]">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Reviews ── */}
      <section
        className="px-6 py-20"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212,149,43,0.12) 0%, transparent 60%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-white text-3xl md:text-4xl font-bold text-center mb-14"
            style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
          >
            Loved by creators worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
            {/* Left column: long review + short */}
            <div className="space-y-4">
              <ReviewCard name={longReviews[1].name} text={longReviews[1].text} />
              <ReviewCard name={shortReviews[2].name} text={shortReviews[2].text} />
            </div>
            {/* Center: long tall card */}
            <div className="space-y-4">
              <ReviewCard name={longReviews[0].name} text={longReviews[0].text} />
              <ReviewCard name={shortReviews[3].name} text={shortReviews[3].text} />
            </div>
            {/* Right column: short cards */}
            <div className="space-y-4">
              <ReviewCard name={shortReviews[0].name} text={shortReviews[0].text} />
              <ReviewCard name={shortReviews[1].name} text={shortReviews[1].text} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: FAQ ── */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        {/* Spacer */}
        <div className="mb-16" />
        <h2
          className="text-white text-3xl md:text-4xl font-bold text-center mb-14"
          style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
        >
          Frequently Asked<br />Questions
        </h2>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-white text-sm md:text-base font-medium pr-4">{faq.q}</span>
                <ChevronRight
                  className={`w-5 h-5 text-white/30 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="pb-5 pr-10">
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
              {i < faqs.length - 1 && (
                <div className="h-px" style={{ background: "rgba(212,149,43,0.08)" }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-20" />
    </div>
  );
}

function ReviewCard({ name, text }: { name: string; text: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p className="text-white/70 text-sm leading-relaxed mb-3">"{text}"</p>
      <p className="text-white/40 text-xs font-medium">{name}</p>
    </div>
  );
}
