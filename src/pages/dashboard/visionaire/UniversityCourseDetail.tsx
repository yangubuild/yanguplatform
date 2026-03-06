import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";

import masterLibraryImg from "@/assets/university/master-library-guide.webp";
import onlineBusinessImg from "@/assets/university/online-business.jpg";
import platformsGuideImg from "@/assets/university/platforms-guide.jpg";
import funnelImg from "@/assets/university/funnel.jpg";
import pricingGuideImg from "@/assets/university/pricing-guide.jpg";
import aiWritingImg from "@/assets/university/ai-writing.jpg";
import visualsGuideImg from "@/assets/university/visuals-guide.jpg";

interface CourseModule {
  title: string;
  lessons: string[];
}

interface CourseData {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  lessons: number;
  level: string;
  image: string;
  modules: CourseModule[];
}

const COURSE_DATA: CourseData[] = [
  {
    slug: "master-library-masterclass",
    title: "Master Library Masterclass",
    description:
      'Go from "I just got access" to "my first product is live." Find your first product, customize it, launch it, and build a real digital product business.',
    longDescription:
      "This masterclass walks you step-by-step through the entire process of finding your first digital product in the library, customizing it for your brand, setting up your storefront, and making your first sale. By the end, you'll have a live product generating revenue.",
    lessons: 5,
    level: "Beginner",
    image: masterLibraryImg,
    modules: [
      {
        title: "Getting Started",
        lessons: [
          "Welcome & Library Overview",
          "How to Browse and Pick Your First Product",
        ],
      },
      {
        title: "Customization",
        lessons: [
          "Rebranding Your Product for Your Audience",
          "Editing Content and Adding Your Voice",
        ],
      },
      {
        title: "Launch",
        lessons: ["Publishing and Making Your First Sale"],
      },
    ],
  },
  {
    slug: "starting-an-online-business",
    title: "Starting an Online Business",
    description:
      "Learn the fundamentals of launching a profitable online business from scratch, including market research, business models, and your first sales.",
    longDescription:
      "This comprehensive course covers everything you need to know to start an online business from zero. From validating your idea and understanding your target market to choosing the right business model and making your first sales, each lesson is designed to get you from idea to income.",
    lessons: 7,
    level: "Beginner",
    image: onlineBusinessImg,
    modules: [
      {
        title: "Foundation",
        lessons: [
          "The Digital Business Landscape in 2025",
          "Finding Your Profitable Niche",
          "Validating Your Business Idea",
        ],
      },
      {
        title: "Building",
        lessons: [
          "Choosing Your Business Model",
          "Setting Up Your Online Presence",
        ],
      },
      {
        title: "Launching",
        lessons: [
          "Your First Marketing Campaign",
          "Making Your First 10 Sales",
        ],
      },
    ],
  },
  {
    slug: "choosing-the-right-platform",
    title: "Choosing the Right Platform",
    description:
      "Compare and evaluate the best platforms for selling digital products so you can pick the one that fits your goals, audience, and workflow.",
    longDescription:
      "Navigating the crowded marketplace of selling platforms can be overwhelming. This course breaks down the top platforms for digital product sellers, comparing features, fees, audience reach, and scalability so you can make the best decision for your business.",
    lessons: 4,
    level: "Beginner",
    image: platformsGuideImg,
    modules: [
      {
        title: "Platform Landscape",
        lessons: [
          "Overview of Digital Product Platforms",
          "Marketplace vs. Self-Hosted: Pros and Cons",
        ],
      },
      {
        title: "Making Your Choice",
        lessons: [
          "Platform Comparison Deep Dive",
          "Setting Up Your Chosen Platform",
        ],
      },
    ],
  },
  {
    slug: "building-your-sales-funnel",
    title: "Building Your Sales Funnel",
    description:
      "Design and launch a high-converting sales funnel that turns visitors into buyers using proven frameworks and real-world examples.",
    longDescription:
      "A great product without a funnel is a missed opportunity. This course teaches you how to map your customer journey, build landing pages that convert, write email sequences that sell, and optimize every step of your funnel for maximum revenue.",
    lessons: 6,
    level: "Intermediate",
    image: funnelImg,
    modules: [
      {
        title: "Funnel Fundamentals",
        lessons: [
          "Understanding the Sales Funnel",
          "Mapping Your Customer Journey",
        ],
      },
      {
        title: "Building Your Funnel",
        lessons: [
          "Creating High-Converting Landing Pages",
          "Writing Email Sequences That Sell",
        ],
      },
      {
        title: "Optimization",
        lessons: [
          "A/B Testing and Analytics",
          "Scaling Your Funnel for Growth",
        ],
      },
    ],
  },
  {
    slug: "pricing-your-digital-products",
    title: "Pricing Your Digital Products",
    description:
      "Master pricing psychology and strategies to maximize revenue. Learn how to price ebooks, courses, templates, and bundles for profit.",
    longDescription:
      "Pricing is the single biggest lever for profitability. This course dives deep into pricing psychology, competitive analysis, value-based pricing strategies, and bundle economics. You'll walk away with a clear pricing framework for every type of digital product you sell.",
    lessons: 5,
    level: "Intermediate",
    image: pricingGuideImg,
    modules: [
      {
        title: "Pricing Psychology",
        lessons: [
          "The Psychology Behind Buying Decisions",
          "Anchoring, Decoy, and Charm Pricing",
        ],
      },
      {
        title: "Strategy",
        lessons: [
          "Value-Based Pricing for Digital Products",
          "Bundle and Tier Pricing Strategies",
        ],
      },
      {
        title: "Implementation",
        lessons: ["Testing and Optimizing Your Prices"],
      },
    ],
  },
  {
    slug: "ai-powered-content-writing",
    title: "AI-Powered Content Writing",
    description:
      "Leverage AI tools to write compelling product descriptions, sales pages, and marketing copy that converts — without losing your voice.",
    longDescription:
      "AI is transforming content creation. This course shows you how to use AI writing tools effectively to create product descriptions, sales copy, blog posts, and email campaigns that sound authentic and drive conversions. Learn the prompts, workflows, and editing techniques the pros use.",
    lessons: 8,
    level: "Intermediate",
    image: aiWritingImg,
    modules: [
      {
        title: "AI Writing Foundations",
        lessons: [
          "Introduction to AI Writing Tools",
          "Crafting Effective Prompts",
        ],
      },
      {
        title: "Product Copy",
        lessons: [
          "Writing Product Descriptions with AI",
          "AI-Powered Sales Pages",
          "Email Marketing Copy with AI",
        ],
      },
      {
        title: "Advanced Techniques",
        lessons: [
          "Maintaining Your Brand Voice with AI",
          "Editing and Humanizing AI Content",
          "Building an AI Content Workflow",
        ],
      },
    ],
  },
  {
    slug: "creating-stunning-product-visuals",
    title: "Creating Stunning Product Visuals",
    description:
      "Learn to create professional mockups, cover designs, and marketing graphics that make your digital products stand out and sell.",
    longDescription:
      "Visual presentation can make or break a digital product. This advanced course teaches you to create professional-quality mockups, book covers, social media graphics, and marketing materials using both traditional design tools and AI-powered generators.",
    lessons: 6,
    level: "Advanced",
    image: visualsGuideImg,
    modules: [
      {
        title: "Design Fundamentals",
        lessons: [
          "Visual Design Principles for Products",
          "Color Theory and Typography for Sellers",
        ],
      },
      {
        title: "Creating Assets",
        lessons: [
          "Professional Mockup Creation",
          "Book Cover and Thumbnail Design",
        ],
      },
      {
        title: "Marketing Graphics",
        lessons: [
          "Social Media Graphics That Convert",
          "AI-Powered Visual Generation",
        ],
      },
    ],
  },
];

export default function UniversityCourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const course = COURSE_DATA.find((c) => c.slug === slug);

  if (!course) {
    return (
      <VisionairePageContainer>
        <div className="py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Course not found</h1>
          <Link to="/dashboard/visionaire/university">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to University
            </Button>
          </Link>
        </div>
      </VisionairePageContainer>
    );
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12">
        {/* Back link */}
        <Link
          to="/dashboard/visionaire/university"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to University
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative w-full aspect-[21/9] md:aspect-[21/7]">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                  <BookOpen className="h-3.5 w-3.5" /> {totalLessons} Lessons
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80 backdrop-blur border border-border">
                  <BarChart3 className="h-3.5 w-3.5" /> {course.level}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {course.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="max-w-3xl space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            {course.longDescription}
          </p>
        </div>

        {/* CTA */}
        <div>
          <a
            href="https://www.entrepedia.co/university"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="accent" size="lg" className="gap-2">
              Start Learning <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Course Curriculum */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Course Curriculum</h2>
          <div className="space-y-4">
            {course.modules.map((mod, mi) => (
              <div
                key={mi}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold text-foreground text-sm">
                    Module {mi + 1}: {mod.title}
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {mod.lessons.map((lesson, li) => (
                    <li
                      key={li}
                      className="px-5 py-3.5 flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="h-4 w-4 text-primary/60 shrink-0" />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
