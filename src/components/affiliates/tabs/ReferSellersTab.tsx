import { useState } from "react";
import { Link2, UserPlus, DollarSign, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import yanguYLogo from "@/assets/yangu-y-logo.png";

export function ReferSellersTab() {
  const [showPartnerPage, setShowPartnerPage] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  if (showPartnerPage) {
    return <PartnerDetailPage onBack={() => setShowPartnerPage(false)} />;
  }

  return (
    <div className="flex flex-col items-center pt-10 pb-16">
      <h2 className="text-4xl font-bold text-foreground mb-4 text-center">
        Become a yangu partner
      </h2>
      <p className="text-muted-foreground text-center max-w-xl mb-6">
        Become a yangu Partner, refer users, and earn money whenever yangu grows.
      </p>
      <Button
        variant="accent"
        size="lg"
        className="w-full max-w-lg mb-12"
        onClick={() => setShowPartnerPage(true)}
      >
        Apply to be a partner
      </Button>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
        <StepCard
          step={1}
          title="Share your link"
          desc="Share your referral link with your network or invite new users to your yangu."
          visual={
            <div className="rounded-lg bg-white/5 border border-white/[0.06] px-3 py-2 text-xs text-muted-foreground mb-3 max-w-[200px]">
              yangu.studio/?a=yourcode
            </div>
          }
        />
        <StepCard
          step={2}
          title="New user signs up"
          desc="When people sign up to yangu with your link, they will be attributed to you."
          visual={
            <div className="mb-3">
              <div className="rounded-lg bg-white/5 border border-white/[0.06] px-3 py-2 text-xs text-muted-foreground max-w-[200px]">
                user@example.com
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Signed up
              </div>
            </div>
          }
        />
        <StepCard
          step={3}
          title="Get paid"
          desc="Anytime yangu earns from one of your referrals, you'll get paid."
          visual={
            <div className="rounded-lg bg-white/5 border border-white/[0.06] px-3 py-2 text-xs text-muted-foreground mb-3 flex items-center gap-2 max-w-[220px]">
              <img src={yanguYLogo} alt="yangu" className="w-6 h-6 object-contain" />
              <span>You've earned $50.00 from a new referral!</span>
            </div>
          }
        />
      </div>

      {/* Bottom info cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="rounded-xl border border-white/[0.04] p-5" style={{ background: "#111a15" }}>
          <p className="text-sm font-semibold text-foreground mb-1">💰 Your yangu earns money</p>
          <p className="text-xs text-muted-foreground">Every new user who joins your yangu and didn't have an account before is automatically counted as your referral.</p>
        </div>
        <div className="rounded-xl border border-white/[0.04] p-5" style={{ background: "#111a15" }}>
          <p className="text-sm font-semibold text-foreground mb-1">📚 Learn from the best</p>
          <p className="text-xs text-muted-foreground">If you're just getting started it's all good! Once accepted, you'll get access to a free community with top partners, educational resources, and best practices.</p>
        </div>
      </div>

      {showApplyForm && <ApplyPartnerForm onClose={() => setShowApplyForm(false)} />}
    </div>
  );
}

function StepCard({ step, title, desc, visual }: { step: number; title: string; desc: string; visual: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.04] p-5 flex flex-col" style={{ background: "linear-gradient(180deg, #0f2318 0%, #0a1710 100%)" }}>
      {visual}
      <p className="text-sm font-semibold text-foreground mb-1">{step}. {title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function PartnerDetailPage({ onBack }: { onBack: () => void }) {
  const [showApplyForm, setShowApplyForm] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <span>‹</span>
        <img src={yanguYLogo} alt="yangu" className="w-6 h-6 object-contain" />
        yangu Partners
      </button>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left content */}
        <div>
          {/* Hero banner */}
          <div className="rounded-xl overflow-hidden mb-4 h-[280px] flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #0d1f15 60%, #08120D 100%)" }}>
             <div className="text-center">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <img src={yanguYLogo} alt="yangu" className="w-10 h-10 object-contain" />
                 <span className="text-2xl font-bold text-foreground">yangu</span>
               </div>
               <p className="text-4xl font-black text-foreground tracking-wide">AFFILIATES</p>
             </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-4 rounded-xl border border-white/[0.04] px-5 py-3 mb-6" style={{ background: "#111a15" }}>
            <span className="text-sm text-muted-foreground">🏷 Free</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="text-sm text-muted-foreground">👥 434 members</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="text-sm text-muted-foreground">By Alex Heiden</span>
          </div>

          {/* Description */}
          <h3 className="text-xl font-bold text-foreground mb-2">Make Money Bringing People to yangu</h3>
          <p className="text-sm text-muted-foreground mb-8">
            This yangu will provide you with full training and support to make the most money possible bringing new people to yangu
          </p>

          {/* Customer reviews */}
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer reviews</h3>
          <div className="rounded-xl border border-white/[0.04] p-5 mb-8" style={{ background: "#111a15" }}>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">4.3</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {[1, 2, 3, 4].map(i => <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                  <Star className="w-4 h-4 fill-yellow-500/50 text-yellow-500" />
                </div>
                <p className="text-xs text-muted-foreground">18 ratings</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[
                  { stars: 5, pct: 78, count: 14, color: "#22c55e" },
                  { stars: 4, pct: 6, count: 1, color: "#84cc16" },
                  { stars: 3, pct: 0, count: 0, color: "#9ca3af" },
                  { stars: 2, pct: 6, count: 1, color: "#f97316" },
                  { stars: 1, pct: 11, count: 2, color: "#ef4444" },
                ].map(r => (
                  <div key={r.stars} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-4">{r.stars}</span>
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                    <span className="text-muted-foreground w-16 text-right">{r.pct}% ({r.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top reviews */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top reviews</h3>
            <button className="text-sm text-muted-foreground hover:text-foreground">See all reviews</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { name: "GHOST PICKZ", handle: "@ghostsportzpi...", time: "4 months ago", text: "Def a goat. Studies all plays and it shows", img: "https://i.pravatar.cc/80?img=12" },
              { name: "AB", handle: "@abonsocials", time: "6 months ago", text: "lots to learn from yangu partners! i love the outreach help section", img: "https://i.pravatar.cc/80?img=32" },
              { name: "K 🏈", handle: "@scalewithk", time: "2 months ago", text: "", img: "https://i.pravatar.cc/80?img=45" },
              { name: "RichCrypto", handle: "@richcrypto", time: "2 months ago", text: "", img: "https://i.pravatar.cc/80?img=57" },
            ].map((review, i) => (
              <div key={i} className="rounded-xl border border-white/[0.04] p-4" style={{ background: "#111a15" }}>
                <div className="flex items-center gap-3 mb-2">
                  <img src={review.img} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.handle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">{review.time}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}
                </div>
                {review.text && <p className="text-xs text-muted-foreground">{review.text}</p>}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">🚩 Report this creator</p>
        </div>

        {/* Right sidebar */}
        <div>
          <div className="rounded-xl border border-white/[0.04] p-5 sticky top-6" style={{ background: "#111a15" }}>
            <div className="rounded-xl overflow-hidden mb-4 h-[180px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #0d1f15 100%)" }}>
              <div className="text-center">
                <img src={yanguYLogo} alt="yangu" className="w-14 h-14 mx-auto mb-2 object-contain" />
                <p className="text-lg font-bold text-foreground">yangu Partners</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />)}
              <Star className="w-3.5 h-3.5 fill-yellow-500/50 text-yellow-500" />
              <span className="text-xs text-muted-foreground ml-1">4.3 (18)</span>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">yangu Partners</p>
            <Button
              variant="accent"
              className="w-full"
              onClick={() => setShowApplyForm(true)}
            >
              Join the waitlist
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">Powered by yangu</p>
          </div>
        </div>
      </div>

      {showApplyForm && <ApplyPartnerForm onClose={() => setShowApplyForm(false)} />}
    </div>
  );
}

function ApplyPartnerForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In production, this would send to partners@yangu.io
    setTimeout(() => {
      toast.success("Application submitted! We'll be in touch at partners@yangu.io");
      setLoading(false);
      onClose();
    }, 1000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-white/[0.04] p-6" style={{ background: "#111a15" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">Apply to be a partner</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Full name</label>
            <input
              required
              value={formData.fullName}
              onChange={e => setFormData(d => ({ ...d, fullName: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Username</label>
            <input
              required
              value={formData.username}
              onChange={e => setFormData(d => ({ ...d, username: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40"
              placeholder="@johndoe"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Phone number</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/40"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            className="w-full h-11"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit application"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Your application will be sent to partners@yangu.io</p>
        </form>
      </div>
    </div>,
    document.body
  );
}
