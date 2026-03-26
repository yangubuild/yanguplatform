import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ArrowLeft } from "lucide-react";
import { MarketingShell } from "@/components/primitives/MarketingShell";
import { LandingTestFooter } from "@/components/landing-test/LandingTestFooter";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { Button } from "@/components/ui/button";

/* ── FAQ Data ── */
const FAQ_CATEGORIES = [
  {
    key: "getting-started",
    label: "Getting Started",
    faqs: [
      { q: "How do I create a YANGU account?", a: "Tap 'Get Started' on the landing page, enter your email, and verify it. You'll be guided through onboarding to set up your profile." },
      { q: "What is a Surface?", a: "A Surface is your digital presence on YANGU — it can be a website, store, portfolio, or landing page that you build and publish." },
      { q: "How do I create my first Surface?", a: "Go to Dashboard → Build. Choose 'Build with AI' for an AI-generated Surface or 'Build Manually' to start from scratch." },
      { q: "What's the difference between Build with AI and Build Manually?", a: "'Build with AI' generates a full Surface from a text prompt. 'Build Manually' gives you a blank canvas to design section by section." },
    ],
  },
  {
    key: "account-login",
    label: "Account & Login",
    faqs: [
      { q: "How do I reset my password?", a: "On the login page, tap 'Forgot password?', enter your email, and follow the reset link sent to your inbox." },
      { q: "Can I change my email address?", a: "Go to Dashboard → Profile → Settings → Account to update your email address." },
      { q: "How do I delete my account?", a: "Go to Dashboard → Profile → Settings → Account and scroll to 'Delete Account'. This action is permanent." },
      { q: "How do I enable two-factor authentication?", a: "Go to Dashboard → Profile → Settings → Account → Security section to enable 2FA." },
    ],
  },
  {
    key: "pricing-billing",
    label: "Pricing & Billing",
    faqs: [
      { q: "What plans does YANGU offer?", a: "YANGU offers Free, Creator, and Pro plans for individuals, plus Business Starter, Growth, and Scale plans for businesses." },
      { q: "How do I upgrade my plan?", a: "Go to Dashboard → Profile → Subscription and select the plan you'd like to upgrade to." },
      { q: "How do I view my invoices?", a: "Go to Dashboard → Profile → Settings → Billing to view and download your invoices." },
      { q: "Can I cancel my subscription?", a: "Yes — go to Dashboard → Profile → Subscription and tap 'Cancel Plan'. You'll keep access until the end of your billing period." },
    ],
  },
  {
    key: "free-plan",
    label: "Free Plan / Lifetime Free Package",
    faqs: [
      { q: "What's included in the Free plan?", a: "The Free plan includes 1 Surface, basic AI tools, limited credits, and access to the community — free forever." },
      { q: "Can I publish a Surface on the Free plan?", a: "Yes, you can publish 1 Surface on a yangu.io subdomain with the Free plan." },
      { q: "Are there usage limits on Free?", a: "Yes — Free plan users have limited AI credits and feature access. Upgrade to Creator or Pro for more." },
    ],
  },
  {
    key: "ai-credits",
    label: "AI Usage & Credits",
    faqs: [
      { q: "What are AI credits?", a: "AI credits are used when you generate content, images, or use AI-powered tools like ADA, Studio, and Build with AI." },
      { q: "How do I check my remaining credits?", a: "Your credit balance is shown in the Dashboard top bar and in Profile → Subscription." },
      { q: "What happens when I run out of credits?", a: "AI-powered features will be paused until your credits renew or you purchase additional credits." },
      { q: "How do I get more credits?", a: "Credits renew monthly with your plan. You can also purchase additional credits or upgrade your plan for a higher allocation." },
    ],
  },
  {
    key: "builder-surfaces",
    label: "Builder / Surfaces",
    faqs: [
      { q: "How do I edit my Surface after creating it?", a: "Go to Dashboard → your Surface card → Edit to open the Surface builder." },
      { q: "Can I add custom sections to my Surface?", a: "Yes — in the Surface builder, tap '+' to add sections like Hero, Features, Gallery, Contact, and more." },
      { q: "How do I change my Surface theme?", a: "Open your Surface in the builder and use the Theme panel to adjust colors, fonts, and overall style." },
      { q: "Can I duplicate a Surface?", a: "Yes — from the Surface card on your Dashboard, use the options menu to duplicate it." },
    ],
  },
  {
    key: "publishing",
    label: "Publishing",
    faqs: [
      { q: "How do I publish my Surface?", a: "Open your Surface in the builder and tap 'Publish'. Your Surface will go live on your yangu.io subdomain or custom domain." },
      { q: "Can I unpublish a Surface?", a: "Yes — go to the Surface builder and tap 'Unpublish' to take it offline." },
      { q: "Why is my Surface not publishing?", a: "Check that your KYC is approved (required for publishing) and that your plan supports the number of Surfaces you have." },
    ],
  },
  {
    key: "kyc",
    label: "KYC Verification",
    faqs: [
      { q: "What is KYC and why is it required?", a: "KYC (Know Your Customer) verifies your identity. It's required before you can publish Surfaces or access certain features." },
      { q: "How do I start KYC verification?", a: "Go to Dashboard → Profile → Settings → KYC and tap 'Start Verification'. Follow the ID and selfie steps." },
      { q: "How long does KYC review take?", a: "KYC review typically takes 1–24 hours. You'll receive a notification when it's complete." },
      { q: "What documents are accepted for KYC?", a: "Government-issued ID (passport, national ID card, or driver's license) and a live selfie." },
    ],
  },
  {
    key: "ads-promotions",
    label: "Ads / Promotions",
    faqs: [
      { q: "How do I create an ad on YANGU?", a: "Go to Dashboard → Ads → Create Ad. Set your target, budget, creative, and launch your campaign." },
      { q: "What ad formats are available?", a: "YANGU supports banner ads, promoted listings, and sponsored placements across the community and discover pages." },
      { q: "How do I track ad performance?", a: "Go to Dashboard → Ads to view impressions, clicks, and spend for each campaign." },
    ],
  },
  {
    key: "agency",
    label: "Agency",
    faqs: [
      { q: "What is a YANGU Agency?", a: "An Agency lets you manage multiple clients, team members, and Surfaces from a single workspace." },
      { q: "How do I create an Agency?", a: "Go to Dashboard → Agency → Create Agency. Complete the setup and invite your team." },
      { q: "Can I invite team members to my Agency?", a: "Yes — go to Agency → Team → Invite and enter their email. They'll receive an invitation to join." },
    ],
  },
  {
    key: "visionaire",
    label: "Visionaire",
    faqs: [
      { q: "What is Visionaire?", a: "Visionaire is YANGU's digital product marketplace where you can discover, save, and request digital products." },
      { q: "How do I save a product in Visionaire?", a: "Tap the bookmark icon on any product card to save it to your collection." },
      { q: "How do I request a custom product?", a: "Go to Visionaire → Requests → New Request and describe what you need." },
    ],
  },
  {
    key: "app-store",
    label: "App Store",
    faqs: [
      { q: "What is the YANGU App Store?", a: "The App Store lets you discover and install apps and integrations that extend your YANGU workspace." },
      { q: "How do I install an app?", a: "Go to Dashboard → App Store, find the app you want, and tap 'Install' or 'Connect'." },
      { q: "Can I build my own app for YANGU?", a: "Yes — visit the Developer Portal to register and submit your app for review." },
    ],
  },
  {
    key: "studio",
    label: "Studio / AI Tools",
    faqs: [
      { q: "What is Studio?", a: "Studio is YANGU's AI creative suite — generate images, videos, ads, product videos, and more." },
      { q: "How do I generate an image in Studio?", a: "Go to Dashboard → Studio → Image Generator, enter a prompt, and tap 'Generate'." },
      { q: "What AI tools are available in Studio?", a: "Image generator, video editor, AI shorts, product videos, ad cloner, avatar creator, and more." },
    ],
  },
  {
    key: "store-commerce",
    label: "Store / Shop / Commerce",
    faqs: [
      { q: "How do I set up a shop on YANGU?", a: "Create a Surface with a Store section, add your products, set pricing, and publish." },
      { q: "What payment methods are supported?", a: "YANGU supports card payments, mobile money, and other regional payment methods depending on your location." },
      { q: "How do I manage orders?", a: "Go to Dashboard → Orders to view, process, and track your incoming orders." },
    ],
  },
  {
    key: "safety-policies",
    label: "Safety & Policies",
    faqs: [
      { q: "Where can I find YANGU's Terms of Service?", a: "Visit yangu.io/termsofservice to read the full Terms of Service." },
      { q: "Where is YANGU's Privacy Policy?", a: "Visit yangu.io/privacypolicy to read the full Privacy Policy." },
      { q: "What is YANGU's AI Safety policy?", a: "Visit yangu.io/aisafety to learn about YANGU's approach to responsible AI use." },
    ],
  },
  {
    key: "domains",
    label: "Domains / Custom Domains",
    faqs: [
      { q: "Can I use a custom domain for my Surface?", a: "Yes — go to your Surface settings → Domain and connect your own domain. A paid plan is required." },
      { q: "How do I set up DNS for my custom domain?", a: "Add a CNAME record pointing your domain to the value shown in your Surface domain settings." },
      { q: "How long does domain verification take?", a: "DNS propagation usually takes a few minutes to 48 hours depending on your domain provider." },
    ],
  },
  {
    key: "support-contact",
    label: "Support & Contact",
    faqs: [
      { q: "How do I contact YANGU support?", a: "Use the in-app Support Chat (Messages → Support) for instant help, or email support@yangu.io." },
      { q: "What's the fastest way to get help?", a: "Open Support Chat from Messages → Support for instant AI-powered assistance." },
      { q: "How do I report a bug?", a: "Go to /support → Contact Support and select 'Technical / Bug Report' as the category." },
    ],
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.faqs.length > 0);
  }, [searchQuery]);

  const activeCat = filteredCategories.find((c) => c.key === activeCategory);

  return (
    <MarketingShell
      header={
        <header className="w-full px-6 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <img
              src={yanguLogo}
              alt="yangu"
              className="h-7 w-auto cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => navigate("/")}
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/support")}>
              ← Support
            </Button>
          </div>
        </header>
      }
      footer={
        <div className="max-w-[1200px] mx-auto px-6">
          <LandingTestFooter />
        </div>
      }
    >
      {/* Hero */}
      <section className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
          Help Center
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
          Find answers to common questions about YANGU.
        </p>
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveCategory(null);
            }}
            placeholder="Search FAQs..."
            className="w-full pl-11 pr-4 py-3.5 rounded-full text-sm bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-4 pb-20">
        {/* Back button when viewing a category */}
        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Categories
          </button>
        )}

        {!activeCategory ? (
          /* Category grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="text-left p-5 rounded-xl border border-border/50 transition-colors hover:border-border hover:bg-muted/30"
              >
                <p className="text-sm font-semibold text-foreground mb-1">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.faqs.length} articles</p>
              </button>
            ))}
          </div>
        ) : activeCat ? (
          /* FAQ list */
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6">{activeCat.label}</h2>
            <div className="space-y-4">
              {activeCat.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border/50 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
                    {faq.q}
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 ml-3" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No results found for "{searchQuery}"</p>
            <p className="text-muted-foreground text-xs mt-1">
              Try different keywords or <button onClick={() => navigate("/support")} className="underline">contact support</button>.
            </p>
          </div>
        )}
      </section>
    </MarketingShell>
  );
}
