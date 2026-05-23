import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const sections = [
  {
    id: "comparison",
    title: "Feature comparison: Free vs. Paid plans",
    body: [
      {
        sub: "Free plan",
        items: [
          "5 daily credits, up to a maximum of 30 per month",
          "Workspace collaboration with unlimited members",
          "Private projects",
        ],
      },
      {
        sub: "Yangu+ plan",
        items: [
          "5 daily credits up to a maximum of 150 per month",
          "Monthly credits depending on your plan",
          "Workspace roles and permissions",
          "Private projects",
        ],
      },
      {
        sub: "Yangu Pro plan",
        items: [
          "Everything in Yangu+",
          "Custom domain support",
          "Priority support and analytics",
        ],
      },
      {
        sub: "Yangu Business plan",
        items: ["Everything in Yangu Pro", "SSO", "Granular role management"],
      },
      {
        sub: "Yangu Enterprise plan",
        items: [
          "Built for large orgs",
          "Volume credit pricing",
          "Dedicated support, onboarding & design systems",
        ],
      },
    ],
  },
  {
    id: "credits",
    title: "Credits",
    body: [
      {
        sub: "Credit display",
        items: [
          "Daily credits — refresh every 24 hours, cap based on your plan.",
          "Monthly credits — refresh on your billing cycle anniversary.",
          "Extra credits — top-up credits valid for 12 months.",
        ],
      },
      {
        sub: "Credit usage",
        items: [
          "Every build message consumes credits based on scope and complexity.",
          "Plan mode consumes 1 credit per message.",
          "Try-to-fix messages are free.",
        ],
      },
      {
        sub: "Credit top-ups",
        items: [
          "Purchase extra credits anytime from Plans & credits.",
          "Top-ups stack on top of your plan credits.",
        ],
      },
      {
        sub: "Credit rollovers",
        items: [
          "Unused monthly credits on paid plans roll over for one billing cycle.",
          "Free plan credits do not roll over.",
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    body: [
      {
        sub: "Can I change plans anytime?",
        items: ["Yes. Upgrades take effect immediately. Downgrades apply at the next billing cycle."],
      },
      {
        sub: "What happens to my credits if I downgrade?",
        items: ["Unused top-up credits remain valid for 12 months from purchase regardless of plan."],
      },
      {
        sub: "Do you offer refunds?",
        items: ["Credit purchases are non-refundable. Contact billing support for billing errors."],
      },
    ],
  },
];

export default function BillingDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link
          to="/dashboard/profile/subscription"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans & credits
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          <aside className="lg:sticky lg:top-6 self-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              On this page
            </p>
            <nav className="space-y-2 text-sm">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.title}
                </a>
              ))}
              <Link
                to="/dashboard/profile/subscription/security"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border"
              >
                <Shield className="w-3.5 h-3.5" /> Security & compliance
              </Link>
            </nav>
          </aside>

          <article className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Getting started
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-3">Plans and credits</h1>
            <p className="text-muted-foreground mb-10 max-w-2xl">
              Compare Free, Yangu+, Yangu Pro, and Yangu Business plans, understand how
              credits work, and manage your subscription and billing.
            </p>

            {sections.map((s) => (
              <section key={s.id} id={s.id} className="mb-12 scroll-mt-6">
                <h2 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border">
                  {s.title}
                </h2>
                <div className="space-y-6">
                  {s.body.map((b) => (
                    <div key={b.sub}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{b.sub}</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {b.items.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}