import {
  GraduationCap,
  Settings,
  Briefcase,
  TrendingUp,
  Users,
  Monitor,
  Calendar,
  ShoppingBag,
  Store,
} from "lucide-react";

const merchantCards = [
  {
    icon: GraduationCap,
    title: "Educational programs",
    description: "Sell courses, workshops, and other educational programs.",
  },
  {
    icon: Settings,
    title: "Agency services",
    description: "Send invoices, chat with clients, and get paid.",
  },
  {
    icon: Briefcase,
    title: "Coaching",
    description: "Charge for your services and organize your clients in one spot.",
  },
  {
    icon: TrendingUp,
    title: "Newsletters",
    description: "Publish long form writing and charge subscribers for exclusive content.",
  },
  {
    icon: Users,
    title: "Paid groups",
    description: "Build a paid community where members connect and share alpha.",
  },
  {
    icon: Monitor,
    title: "SaaS",
    description: "Launch your app with built-in payments and user management.",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Run paid masterminds, events, and give attendees a unified place to chat.",
  },
  {
    icon: ShoppingBag,
    title: "DTC Ecommerce",
    description: "Sell physical products online with an out of the box social layer.",
  },
  {
    icon: Store,
    title: "Brick and Mortar",
    description: "Accept in-store payments and manage memberships for your physical location.",
  },
];

export function WhyYanguContent() {
  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        Overview
      </p>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-3">What is Yangu?</h1>

      {/* Subtitle */}
      <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
        Yangu is on a mission to deliver everyone a sustainable income.
      </p>

      {/* Section: For merchants */}
      <div id="for-merchants" className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">For merchants</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Learn how to set up popular business models on Yangu:
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchantCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl p-5 transition-colors cursor-pointer hover:border-white/20"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <card.icon
              className="w-6 h-6 mb-4"
              strokeWidth={1.5}
              style={{ color: "#F46D2A" }}
            />
            <h3 className="text-white font-semibold text-sm mb-2">{card.title}</h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* On this page sidebar anchor */}
      <div className="hidden xl:block fixed right-8 top-32">
        <div className="text-white/40 text-xs font-medium flex items-center gap-2 mb-3">
          <span className="text-white/30">≡</span> On this page
        </div>
        <a
          href="#for-merchants"
          className="text-xs block"
          style={{ color: "#F46D2A" }}
        >
          For merchants
        </a>
      </div>
    </div>
  );
}
