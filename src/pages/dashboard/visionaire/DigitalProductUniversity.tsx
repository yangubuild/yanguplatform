import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, BookOpen, BarChart3, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";

import masterLibraryImg from "@/assets/university/master-library-guide.webp";
import onlineBusinessImg from "@/assets/university/online-business.jpg";
import platformsGuideImg from "@/assets/university/platforms-guide.jpg";
import funnelImg from "@/assets/university/funnel.jpg";
import pricingGuideImg from "@/assets/university/pricing-guide.jpg";
import aiWritingImg from "@/assets/university/ai-writing.jpg";
import visualsGuideImg from "@/assets/university/visuals-guide.jpg";

const COURSES = [
  {
    slug: "master-library-masterclass",
    title: "Master Library Masterclass",
    description:
      'Go from "I just got access" to "my first product is live." Find your first product, customize it, launch it, and build a real digital product business.',
    lessons: 5,
    level: "Beginner",
    image: masterLibraryImg,
    featured: true,
  },
  {
    slug: "starting-an-online-business",
    title: "Starting an Online Business",
    description:
      "Learn the fundamentals of launching a profitable online business from scratch, including market research, business models, and your first sales.",
    lessons: 7,
    level: "Beginner",
    image: onlineBusinessImg,
    featured: false,
  },
  {
    slug: "choosing-the-right-platform",
    title: "Choosing the Right Platform",
    description:
      "Compare and evaluate the best platforms for selling digital products so you can pick the one that fits your goals, audience, and workflow.",
    lessons: 4,
    level: "Beginner",
    image: platformsGuideImg,
    featured: false,
    badge: "Pro",
  },
  {
    slug: "building-your-sales-funnel",
    title: "Building Your Sales Funnel",
    description:
      "Design and launch a high-converting sales funnel that turns visitors into buyers using proven frameworks and real-world examples.",
    lessons: 6,
    level: "Intermediate",
    image: funnelImg,
    featured: false,
  },
  {
    slug: "pricing-your-digital-products",
    title: "Pricing Your Digital Products",
    description:
      "Master pricing psychology and strategies to maximize revenue. Learn how to price ebooks, courses, templates, and bundles for profit.",
    lessons: 5,
    level: "Intermediate",
    image: pricingGuideImg,
    featured: false,
  },
  {
    slug: "ai-powered-content-writing",
    title: "AI-Powered Content Writing",
    description:
      "Leverage AI tools to write compelling product descriptions, sales pages, and marketing copy that converts — without losing your voice.",
    lessons: 8,
    level: "Intermediate",
    image: aiWritingImg,
    featured: false,
  },
  {
    slug: "creating-stunning-product-visuals",
    title: "Creating Stunning Product Visuals",
    description:
      "Learn to create professional mockups, cover designs, and marketing graphics that make your digital products stand out and sell.",
    lessons: 6,
    level: "Advanced",
    image: visualsGuideImg,
    featured: false,
  },
];

export default function DigitalProductUniversity() {
  const featured = COURSES.find((c) => c.featured)!;
  const grid = COURSES.filter((c) => !c.featured);

  return (
    <VisionairePageContainer>
      <div className="space-y-10 pb-12">
        {/* ── Hero ── */}
        <div className="text-center space-y-5 pt-6 pb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            Start Here
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold text-foreground tracking-tight leading-tight">
            Learn.&nbsp;Build.&nbsp;Launch.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Everything you need to know about the digital product business,
            distilled into clear, actionable lessons.
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-border" />

        {/* ── Featured Course ── */}
        <Link
          to={`/dashboard/visionaire/university/${featured.slug}`}
          className="block rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left text */}
            <div className="p-8 md:p-10 flex flex-col justify-center space-y-5">
              <span className="inline-block w-fit px-3 py-1 rounded-md bg-destructive/90 text-destructive-foreground text-xs font-semibold">
                Featured
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                {featured.title}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md">
                {featured.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {featured.lessons} Lessons
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> {featured.level}
                </span>
              </div>
              <div>
                <Button variant="accent" size="lg" className="gap-2">
                  Start Learning <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Right image */}
            <div className="relative min-h-[260px] md:min-h-[340px]">
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </Link>

        {/* ── Course Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grid.map((course) => (
            <Link
              key={course.slug}
              to={`/dashboard/visionaire/university/${course.slug}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {course.badge && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur text-xs font-medium text-foreground border border-border">
                    <Crown className="h-3 w-3" /> {course.badge}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1 space-y-2">
                <h3 className="font-semibold text-foreground text-base leading-snug">
                  {course.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1">
                  {course.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {course.lessons} Lessons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" /> {course.level}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </VisionairePageContainer>
  );
}
