import { useState } from "react";
import { ArrowRight, ArrowLeft, BookOpen, Clock, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── Wizard steps ────────────────────────────────────────── */
const STEPS = ["Length", "Polish", "Enhancers", "Summary"] as const;
type Step = (typeof STEPS)[number];

/* ── Book length options ─────────────────────────────────── */
const LENGTHS = [
  {
    id: "short",
    title: "Short Book",
    oldPrice: "$399",
    price: "$299",
    description:
      "Teach bite-sized lessons that showcase your expertise, attract attention fast, and build instant credibility with your audience.",
    words: "5,000–6,000 words",
    read: "15-20 min read",
    icon: "/images/custom/short-icon.png",
  },
  {
    id: "medium",
    title: "Medium Book",
    oldPrice: "$599",
    price: "$399",
    description:
      "Deliver a deeper educational experience that helps your readers learn, implement, and trust you as a go-to expert in your niche.",
    words: "10,000–12,000 words",
    read: "30-45 min read",
    icon: "/images/custom/medium-icon.png",
  },
  {
    id: "long",
    title: "Long Book",
    oldPrice: "$999",
    price: "$699",
    description:
      "Own your niche with a comprehensive book that positions you as a leading authority and creates lasting influence in your industry.",
    words: "20,000–25,000 words",
    read: "60-90 min read",
    icon: "/images/custom/long-icon.png",
  },
];

/* ── Polish options ──────────────────────────────────────── */
const POLISH_OPTIONS = [
  {
    id: "standard",
    title: "Standard Polish",
    price: "Included",
    description: "Professional proofreading and basic formatting to ensure your book is clean, readable, and error-free.",
  },
  {
    id: "premium",
    title: "Premium Polish",
    price: "+$99",
    description: "Advanced editing with tone refinement, flow optimization, and enhanced formatting for a polished, professional feel.",
  },
];

/* ── Enhancer options ────────────────────────────────────── */
const ENHANCERS = [
  { id: "cover", title: "Custom Cover Design", price: "+$49", description: "A professionally designed book cover tailored to your brand and niche." },
  { id: "landing", title: "Landing Page Copy", price: "+$79", description: "High-converting sales page copy to promote and sell your book." },
  { id: "social", title: "Social Media Kit", price: "+$39", description: "Ready-to-post graphics and captions for launching your book on social media." },
  { id: "email", title: "Email Sequence", price: "+$59", description: "A 5-email launch sequence to announce and sell your book to your list." },
];

/* ── Main Wizard ─────────────────────────────────────────── */
export default function CustomProductWizard() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [selectedPolish, setSelectedPolish] = useState<string>("standard");
  const [selectedEnhancers, setSelectedEnhancers] = useState<string[]>([]);

  const currentStep = STEPS[stepIdx];

  const canContinue =
    currentStep === "Length" ? !!selectedLength :
    currentStep === "Polish" ? !!selectedPolish :
    true;

  const handleContinue = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };
  const handleBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
    else navigate("/dashboard/offers");
  };

  const toggleEnhancer = (id: string) => {
    setSelectedEnhancers((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectedLengthData = LENGTHS.find((l) => l.id === selectedLength);
  const selectedPolishData = POLISH_OPTIONS.find((p) => p.id === selectedPolish);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#08120D" }}>
      <div className="max-w-3xl mx-auto">
        {/* ── Step indicator ──────────────────────────── */}
        <div className="flex items-start gap-0 mb-10 pl-1">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    i < stepIdx
                      ? "bg-[#b5622a] border-[#b5622a]"
                      : i === stepIdx
                      ? "border-[#b5622a] bg-transparent"
                      : "border-border bg-transparent"
                  }`}
                >
                  {i < stepIdx && <Check className="w-3 h-3 text-white" />}
                  {i === stepIdx && <div className="w-1.5 h-1.5 rounded-full bg-[#b5622a]" />}
                </div>
                <span
                  className={`text-xs font-medium ${
                    i <= stepIdx ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-px mt-[-12px] mx-1 ${
                    i < stepIdx ? "bg-[#b5622a]" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step: Length ─────────────────────────────── */}
        {currentStep === "Length" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choose your book length</h1>
              <p className="text-sm text-muted-foreground mt-1">Select the desired length for your content</p>
            </div>

            {/* Promo banner */}
            <div className="rounded-xl bg-foreground text-background p-5 text-center">
              <h4 className="font-bold text-sm">Kickstart 2026 with special offer: 25%+ Off</h4>
              <p className="text-xs opacity-70 mt-1">New Year offer is now active on all books. Ends on January 31, 2026.</p>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {LENGTHS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedLength(opt.id)}
                  className={`w-full text-left rounded-xl border p-5 flex items-center gap-5 transition-all ${
                    selectedLength === opt.id
                      ? "border-[#b5622a] bg-[#b5622a]/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-bold text-foreground">{opt.title}</h3>
                      <span className="text-sm text-muted-foreground line-through">{opt.oldPrice}</span>
                      <span className="text-sm font-bold text-foreground">{opt.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{opt.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{opt.words}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{opt.read}</span>
                    </div>
                  </div>
                  <img src={opt.icon} alt={opt.title} className="w-20 h-20 object-contain flex-shrink-0 hidden sm:block" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Polish ────────────────────────────── */}
        {currentStep === "Polish" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choose your polish level</h1>
              <p className="text-sm text-muted-foreground mt-1">Select how refined you want your book to be</p>
            </div>
            <div className="space-y-3">
              {POLISH_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedPolish(opt.id)}
                  className={`w-full text-left rounded-xl border p-5 transition-all ${
                    selectedPolish === opt.id
                      ? "border-[#b5622a] bg-[#b5622a]/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-foreground">{opt.title}</h3>
                    <span className="text-sm font-bold text-foreground">{opt.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Enhancers ─────────────────────────── */}
        {currentStep === "Enhancers" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add enhancers</h1>
              <p className="text-sm text-muted-foreground mt-1">Optional add-ons to maximize your book's impact</p>
            </div>
            <div className="space-y-3">
              {ENHANCERS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleEnhancer(opt.id)}
                  className={`w-full text-left rounded-xl border p-5 transition-all ${
                    selectedEnhancers.includes(opt.id)
                      ? "border-[#b5622a] bg-[#b5622a]/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedEnhancers.includes(opt.id) ? "bg-[#b5622a] border-[#b5622a]" : "border-muted-foreground/40"
                      }`}>
                        {selectedEnhancers.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <h3 className="font-bold text-foreground">{opt.title}</h3>
                    </div>
                    <span className="text-sm font-bold text-foreground">{opt.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-6">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Summary ───────────────────────────── */}
        {currentStep === "Summary" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Order summary</h1>
              <p className="text-sm text-muted-foreground mt-1">Review your selections before placing your order</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              {selectedLengthData && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{selectedLengthData.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedLengthData.words}</p>
                  </div>
                  <span className="font-bold text-foreground">{selectedLengthData.price}</span>
                </div>
              )}
              <div className="h-px bg-border" />
              {selectedPolishData && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">{selectedPolishData.title}</p>
                  <span className="text-sm font-medium text-foreground">{selectedPolishData.price}</span>
                </div>
              )}
              {selectedEnhancers.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  {selectedEnhancers.map((id) => {
                    const enh = ENHANCERS.find((e) => e.id === id);
                    if (!enh) return null;
                    return (
                      <div key={id} className="flex items-center justify-between">
                        <p className="text-sm text-foreground">{enh.title}</p>
                        <span className="text-sm font-medium text-foreground">{enh.price}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <button
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Place Order
            </button>
          </div>
        )}

        {/* ── Navigation buttons ──────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {currentStep !== "Summary" && (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b5622a] to-[#5c2a12] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
