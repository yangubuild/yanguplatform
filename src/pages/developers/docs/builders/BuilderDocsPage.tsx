import { useParams, useNavigate } from "react-router-dom";
import { DocsPage, DocsSection } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FeatureDoc {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

const DOCS: Record<string, FeatureDoc> = {
  community: {
    title: "Community",
    intro: "Create groups, foster discovery, and build a loyal audience around your brand.",
    sections: [
      { heading: "Groups", body: "Launch free or paid groups where members can share ideas, ask questions, and connect. Set visibility rules, invite members, and pin important posts." },
      { heading: "Discovery", body: "Your community appears in the yangu directory so new members can find you organically. Feature highlights and trending posts boost visibility." },
      { heading: "Moderation", body: "Built-in moderation tools let you manage members, flag content, and set posting rules — all without third-party plugins." },
    ],
  },
  shop: {
    title: "Shop",
    intro: "Sell physical or digital products with a fully integrated storefront and checkout.",
    sections: [
      { heading: "Product listings", body: "Add unlimited products with images, descriptions, variants, and pricing. Support for both physical goods and digital downloads." },
      { heading: "Checkout", body: "Customers check out directly on your surface — no redirects. Payments are processed securely with built-in invoicing." },
      { heading: "Inventory", body: "Track stock levels, set low-stock alerts, and manage fulfilment from a single dashboard." },
    ],
  },
  payments: {
    title: "Payments & Invoicing",
    intro: "Create, send, and track invoices directly from YANGU. Request payments from customers with professional invoices that support one-time or recurring billing.",
    sections: [
      { heading: "Send an invoice", body: "YANGU lets you create professional invoices and send them directly to your customers. Each invoice includes your branding, itemized details, and a secure payment link. Customers receive the invoice via email and can pay instantly using their preferred payment method." },
      { heading: "How invoice creation works", body: "Creating an invoice is simple: Add your customer's email, set the due date, write a description of what you're billing for, enter the amount, choose between one-time or recurring billing, configure payment methods and any advanced options, then send. Your customer receives a professional invoice immediately." },
      { heading: "One-time vs recurring invoices", body: "One-time invoices are perfect for single projects, consultations, or one-off purchases. Recurring invoices automatically bill your customer on a schedule you define — weekly, monthly, quarterly, or annually. Ideal for subscriptions, retainers, or ongoing services." },
      { heading: "Automated reminders", body: "YANGU automatically sends payment reminders to customers with unpaid invoices. Reminders are sent at 3 days, 7 days, 14 days, 30 days, and 60 days past due. After extended non-payment, you can void the invoice to close it without collecting payment." },
      { heading: "Invoice actions", body: "From your dashboard, you can void or cancel an invoice if it's no longer needed, download a PDF copy for your records or to share manually, and track the real-time status of every invoice you've sent." },
      { heading: "Invoice statuses", body: "Every invoice has a status: Open means sent and awaiting payment. Paid means the customer has completed payment. Past due means the due date has passed without payment. Void means the invoice was cancelled and is no longer collectible." },
      { heading: "Dashboard controls", body: "Your invoice dashboard gives you full control. Use filters to view invoices by status, date, or customer. Customize columns to show the information you need. Export your invoice data for accounting, reporting, or backup purposes." },
    ],
  },
  studio: {
    title: "Studio",
    intro: "Create professional ads, images, and branded content powered by AI.",
    sections: [
      { heading: "AI image generation", body: "Describe what you need and get production-ready images for social, ads, and product listings in seconds." },
      { heading: "Brand kit", body: "Upload your logo, colours, and fonts once — every asset you generate stays on brand." },
      { heading: "Export & publish", body: "Download assets in any format or publish them directly to your surface, shop, or social channels." },
    ],
  },
  live: {
    title: "Live",
    intro: "Go live and sell in real time to your audience.",
    sections: [
      { heading: "Live selling", body: "Pin products during a live stream so viewers can buy with one tap. Real-time order notifications keep energy high." },
      { heading: "Audience interaction", body: "Chat, polls, and reactions are built in. Engage your audience without switching apps." },
      { heading: "Replays", body: "Every live session is automatically saved. Share replays and continue earning from on-demand purchases." },
    ],
  },
  site: {
    title: "Site",
    intro: "Build service pages, portfolios, and real estate listings — no code needed.",
    sections: [
      { heading: "Templates", body: "Choose from purpose-built templates for agencies, consultants, real estate, and more." },
      { heading: "Sections", body: "Add hero banners, testimonials, FAQs, pricing tables, and contact forms with drag-and-drop blocks." },
      { heading: "SEO", body: "Every page is search-engine optimised out of the box with meta tags, sitemaps, and fast load times." },
    ],
  },
  domains: {
    title: "Custom domains",
    intro: "Use your own domain for a professional, branded online presence.",
    sections: [
      { heading: "Connect a domain", body: "Point your DNS to yangu and your surface goes live on your own domain — SSL included." },
      { heading: "Subdomains", body: "Map different subdomains to different surfaces (e.g. shop.yourbrand.com, community.yourbrand.com)." },
      { heading: "Email forwarding", body: "Receive email at your custom domain and forward it to any inbox." },
    ],
  },
  ads: {
    title: "Ads & Trends",
    intro: "Boost visibility with promoted placements and trending features.",
    sections: [
      { heading: "Promoted listings", body: "Put your products and surfaces in front of more people with self-serve promoted placements." },
      { heading: "Trend boosts", body: "Appear in Trending sections across yangu to attract new visitors and followers." },
      { heading: "Analytics", body: "Track impressions, clicks, and conversions for every promotion so you can optimise spend." },
    ],
  },
};

export default function BuilderDocsPage() {
  const { feature } = useParams<{ feature: string }>();
  const navigate = useNavigate();
  const doc = feature ? DOCS[feature] : undefined;

  if (!doc) {
    return (
      <DocsPage breadcrumb="Builders" title="Page not found" subtitle="This builder docs page doesn't exist.">
        <Button variant="ghost" className="text-white/70 gap-2" onClick={() => navigate("/why-yangu?audience=builders")}>
          <ArrowLeft className="w-4 h-4" /> Back to Builders
        </Button>
      </DocsPage>
    );
  }

  return (
    <DocsPage breadcrumb={`Builders / ${doc.title}`} title={doc.title} subtitle={doc.intro}>
      <Button
        variant="ghost"
        className="text-white/60 gap-2 mb-6 hover:text-white/80"
        onClick={() => navigate("/why-yangu?audience=builders")}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Builders
      </Button>

      {doc.sections.map((s) => (
        <DocsSection key={s.heading} id={s.heading.toLowerCase().replace(/\s+/g, "-")} title={s.heading}>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            {s.body}
          </p>
        </DocsSection>
      ))}

      <div className="mt-10">
        <Button variant="accent" onClick={() => navigate("/why-yangu?audience=builders")}>
          Select this feature
        </Button>
      </div>
    </DocsPage>
  );
}
