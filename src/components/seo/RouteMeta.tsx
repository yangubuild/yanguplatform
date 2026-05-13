import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type Meta = { title: string; description: string };

const SITE = "Yangu";
const DEFAULT: Meta = {
  title: "Yangu — All-in-One AI Platform to Build & Grow Online",
  description:
    "Yangu is an all-in-one AI platform for creators, sellers, and influencers to build, market, and grow a business with live video, AI tools, and automation.",
};

// Static route metadata. Keep titles <60 chars, descriptions 50–160.
const STATIC: Record<string, Meta> = {
  "/": DEFAULT,
  "/why-yangu": {
    title: "Why Yangu — The AI platform built for creators",
    description:
      "Discover why creators, sellers, and influencers choose Yangu to build, market, and grow their business with AI-powered tools.",
  },
  "/discover": {
    title: "Discover Yangu — Explore creators, shops & communities",
    description:
      "Explore creators, businesses, products, and communities on Yangu. Discover the people and brands shaping the next wave of online commerce.",
  },
  "/discover-yangu": {
    title: "Discover Yangu — Explore creators, shops & communities",
    description:
      "Explore creators, businesses, products, and communities on Yangu. Discover the people and brands shaping the next wave of online commerce.",
  },
  "/blog": {
    title: "Yangu Blog — Tips for creators and online sellers",
    description:
      "Guides, stories, and product updates from Yangu. Learn how to build, market, and grow an online business with AI.",
  },
  "/affiliates": {
    title: "Yangu Affiliates — Earn by promoting Yangu",
    description:
      "Join the Yangu Affiliate program and earn recurring commissions promoting the all-in-one AI platform for creators and sellers.",
  },
  "/community": {
    title: "Yangu Community — Connect with creators worldwide",
    description:
      "Join the Yangu community to connect with creators, sellers, and influencers building the future of online business.",
  },
  "/support": {
    title: "Yangu Support — Get help with your account",
    description:
      "Get help with Yangu. Browse guides, contact support, and find answers to common questions about building your business.",
  },
  "/help-center": {
    title: "Yangu Help Center — Guides & answers",
    description:
      "Browse the Yangu Help Center for guides, tutorials, and answers about using the AI platform for creators and sellers.",
  },
  "/updates": {
    title: "Platform Updates — What's new on Yangu",
    description:
      "See the latest features, improvements, and announcements from the Yangu team.",
  },
  "/privacy": {
    title: "Privacy Policy — Yangu",
    description:
      "Read the Yangu privacy policy to learn how we collect, use, and protect your personal information.",
  },
  "/privacypolicy": {
    title: "Privacy Policy — Yangu",
    description:
      "Read the Yangu privacy policy to learn how we collect, use, and protect your personal information.",
  },
  "/terms": {
    title: "Terms of Service — Yangu",
    description:
      "Review the Yangu Terms of Service governing the use of our platform, products, and services.",
  },
  "/termsofservice": {
    title: "Terms of Service — Yangu",
    description:
      "Review the Yangu Terms of Service governing the use of our platform, products, and services.",
  },
  "/aisafety": {
    title: "AI Safety — Yangu",
    description:
      "How Yangu builds and deploys AI responsibly, with safety, transparency, and user trust at the core.",
  },
  "/builder": {
    title: "Yangu Builder — Build your site with AI",
    description:
      "Use the Yangu Builder to design and launch your online shop, portfolio, or community in minutes with AI assistance.",
  },
  "/developers": {
    title: "Yangu Developers — APIs, SDKs & docs",
    description:
      "Build on Yangu with our APIs, SDKs, webhooks, and developer tools. Read the docs and start integrating today.",
  },
  "/unsubscribe": {
    title: "Unsubscribe — Yangu",
    description: "Manage your email subscription preferences for Yangu.",
  },
};

function deriveMeta(pathname: string): Meta {
  if (STATIC[pathname]) return STATIC[pathname];

  // Prefix matches for nested sections
  const prefixes: Array<[string, Meta]> = [
    ["/community", STATIC["/community"]],
    ["/developers", STATIC["/developers"]],
    ["/help-center", STATIC["/help-center"]],
    ["/builder", STATIC["/builder"]],
    ["/blog", STATIC["/blog"]],
    ["/affiliates", STATIC["/affiliates"]],
    ["/support", STATIC["/support"]],
    ["/updates", STATIC["/updates"]],
  ];
  for (const [p, m] of prefixes) {
    if (m && pathname.startsWith(p + "/")) return m;
  }

  // Entity detail routes — humanize the slug
  const entityMatch = pathname.match(
    /^\/(discover|business|creator|community|org|service|product|project)\/([^/]+)/,
  );
  if (entityMatch) {
    const slug = decodeURIComponent(entityMatch[2])
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .slice(0, 50);
    return {
      title: `${slug} — ${SITE}`.slice(0, 60),
      description: `Explore ${slug} on Yangu — connect, follow, and discover more from creators and businesses on the all-in-one AI platform.`.slice(
        0,
        160,
      ),
    };
  }

  return DEFAULT;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * RouteMeta keeps <title>, meta description, canonical, og:* and twitter:*
 * in sync with the current route. Mount once inside <BrowserRouter>.
 */
export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = deriveMeta(pathname);
    const canonical =
      typeof window !== "undefined"
        ? `${window.location.origin}${pathname}`
        : pathname;

    document.title = title;
    setMeta("description", description);
    setCanonical(canonical);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
  }, [pathname]);

  return null;
}