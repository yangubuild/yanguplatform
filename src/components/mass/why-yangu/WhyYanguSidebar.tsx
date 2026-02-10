import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { label: "What is Yangu?", id: "what-is-yangu", active: true },
      { label: "Why choose Yangu", id: "why-choose-yangu" },
    ],
  },
  {
    title: "Business models",
    items: [
      { label: "Paid groups", id: "paid-groups" },
      { label: "Educational programs", id: "educational-programs" },
      { label: "Coaches", id: "coaches" },
      { label: "Agencies", id: "agencies" },
      { label: "SaaS", id: "saas" },
      { label: "Newsletters", id: "newsletters" },
      { label: "Events", id: "events" },
      { label: "DTC Ecommerce", id: "dtc-ecommerce" },
      { label: "Brick and mortar", id: "brick-and-mortar" },
    ],
  },
  {
    title: "Affiliates",
    items: [
      { label: "Promote your business", id: "promote" },
      { label: "Set up global affiliates", id: "global-affiliates" },
      { label: "Set up custom affiliates", id: "custom-affiliates" },
      { label: "Set up revenue share", id: "revenue-share" },
    ],
  },
  {
    title: "Products",
    items: [
      { label: "Manage products", id: "manage-products" },
      { label: "Create a waitlist", id: "create-waitlist" },
    ],
  },
];

export function WhyYanguSidebar() {
  const [activeId, setActiveId] = useState("what-is-yangu");

  return (
    <nav className="sticky top-8">
      {/* Collapse button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/90 text-sm font-semibold">Getting Started</span>
        <button className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-white/10 mb-4" />

      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h4>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveId(item.id)}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors"
                  style={{
                    color: activeId === item.id ? "#F46D2A" : "rgba(255,255,255,0.55)",
                    background: activeId === item.id ? "rgba(244,109,42,0.08)" : "transparent",
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
