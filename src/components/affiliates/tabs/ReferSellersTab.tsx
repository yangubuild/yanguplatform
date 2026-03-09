import { Link2, UserPlus, DollarSign } from "lucide-react";

export function ReferSellersTab() {
  return (
    <div className="flex flex-col items-center pt-10 pb-16">
      <h2 className="text-4xl font-bold text-white mb-4 text-center">
        Become a YANGU partner
      </h2>
      <p className="text-white/50 text-center max-w-xl mb-6">
        Become a YANGU Partner, refer users, and earn money whenever YANGU grows.
      </p>
      <button
        className="w-full max-w-lg h-12 rounded-xl text-sm font-semibold text-white mb-12"
        style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
      >
        Apply to be a partner
      </button>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-8">
        <StepCard
          step={1}
          title="Share your link"
          desc="Share your referral link with your network or invite new users to your YANGU."
          visual={
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60 mb-3 max-w-[200px]">
              yangu.studio/?a=yourcode
            </div>
          }
        />
        <StepCard
          step={2}
          title="New user signs up"
          desc="When people sign up to YANGU with your link, they will be attributed to you."
          visual={
            <div className="mb-3">
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60 max-w-[200px]">
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
          desc="Anytime YANGU earns from one of your referrals, you'll get paid."
          visual={
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60 mb-3 flex items-center gap-2 max-w-[220px]">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-accent" />
              </div>
              <span>You've earned $50.00 from a new referral!</span>
            </div>
          }
        />
      </div>

      {/* Bottom info cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="rounded-xl border border-white/8 p-5" style={{ background: "#141A21" }}>
          <p className="text-sm font-semibold text-white mb-1">💰 Your YANGU earns money</p>
          <p className="text-xs text-white/40">Every new user who joins your YANGU and didn't have an account before is automatically counted as your referral.</p>
        </div>
        <div className="rounded-xl border border-white/8 p-5" style={{ background: "#141A21" }}>
          <p className="text-sm font-semibold text-white mb-1">📚 Learn from the best</p>
          <p className="text-xs text-white/40">If you're just getting started it's all good! Once accepted, you'll get access to a free community with top partners, educational resources, and best practices.</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc, visual }: { step: number; title: string; desc: string; visual: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 p-5 flex flex-col" style={{ background: "#141A21" }}>
      {visual}
      <p className="text-sm font-semibold text-white mb-1">{step}. {title}</p>
      <p className="text-xs text-white/40">{desc}</p>
    </div>
  );
}
