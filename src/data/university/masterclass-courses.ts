import guideImg from "@/assets/university/courses/guide.png";
import buildingImg from "@/assets/university/courses/building.png";
import funnelImg from "@/assets/university/courses/funnel.png";
import platformsImg from "@/assets/university/courses/platforms.png";
import coinImg from "@/assets/university/courses/coin.png";
import copywritingImg from "@/assets/university/courses/copywriting.png";
import brushImg from "@/assets/university/courses/brush.png";

export interface CourseLesson {
  id: number;
  title: string;
  description?: string;
}

export interface MasterclassCourse {
  id: number;
  title: string;
  lessons: number;
  level: string;
  description: string;
  image: string;
  comingSoon: boolean;
  slug: string;
  lessonsList: CourseLesson[];
}

export const MASTERCLASS_COURSES: MasterclassCourse[] = [
  {
    id: 1,
    title: "How to use Master Library",
    lessons: 8,
    level: "Beginner",
    description:
      "A supportive, step-by-step guide to help you confidently navigate the Master Library and turn its ready-made resources into real business momentum.",
    image: guideImg,
    comingSoon: false,
    slug: "how-to-use-master-library",
    lessonsList: [
      { id: 1, title: "Private Label Rights Explained" },
      { id: 2, title: "Start Your Online Business" },
      { id: 3, title: "Building Your Product Offering" },
      { id: 4, title: "Branding and Customization" },
      { id: 5, title: "Marketing Your Business" },
      { id: 6, title: "Scaling and Diversifying" },
      { id: 7, title: "Key Takeaways and Next Steps" },
      { id: 8, title: "Visionaire's Library Checklist" },
    ],
  },
  {
    id: 2,
    title: "Online Business Master Plan",
    lessons: 9,
    level: "Beginner",
    description:
      "A realistic, step-by-step guide to help you launch a profitable online business with clarity, confidence, and digital products that are ready to sell.",
    image: buildingImg,
    comingSoon: false,
    slug: "online-business-master-plan",
    lessonsList: [
      { id: 1, title: "The Adventure Begins", description: "Start your journey into building a profitable online business with clarity and confidence." },
      { id: 2, title: "Find Your Business Purpose", description: "Discover your niche and define your business mission with purpose-driven strategy." },
      { id: 3, title: "Branding & Visual Identity", description: "Create a brand that stands out and resonates with your target audience." },
      { id: 4, title: "Build Offers People Can't Refuse", description: "Design irresistible product offerings that solve real problems and drive sales." },
      { id: 5, title: "Ready-Made. Ready to Sell. Ready for You.", description: "Leverage pre-made digital products to fast-track your business launch." },
      { id: 6, title: "Building Your Online Presence", description: "Establish a professional online presence that attracts and converts visitors." },
      { id: 7, title: "Build an Audience That Buys", description: "Grow a loyal community that trusts your brand and purchases your products." },
      { id: 8, title: "Marketing & Traffic Generation", description: "Master proven strategies to drive targeted traffic and increase conversions." },
      { id: 9, title: "Wrapping It Up", description: "Bring it all together with final insights and your next steps to success." },
    ],
  },
  {
    id: 3,
    title: "How to use funnels to sell digital products",
    lessons: 14,
    level: "Beginner",
    description:
      "A clear, step-by-step guide to help you choose, build, and launch the right funnel for selling your digital products, with no tech overwhelm and real results.",
    image: funnelImg,
    comingSoon: false,
    slug: "funnel-guide",
    lessonsList: [
      { id: 1, title: "Why Funnels Matter for Selling Digital Products", description: "Understand why funnels are essential for converting browsers into buyers." },
      { id: 2, title: "Think in Systems, Not Just Sales Pages", description: "Learn how to build interconnected systems that nurture leads and drive consistent sales." },
      { id: 3, title: "Lead Magnet Funnel", description: "Build email lists with irresistible free offers that attract your ideal customers." },
      { id: 4, title: "Tripwire Funnel", description: "Convert free subscribers into buyers with low-cost, high-value offers." },
      { id: 5, title: "Drip Content Funnel", description: "Nurture leads over time with automated email sequences that build trust and authority." },
      { id: 6, title: "Mini-Course Funnel", description: "Deliver value through a structured mini-course that positions you as an expert." },
      { id: 7, title: "Challenge Funnel", description: "Create momentum and community with time-bound challenges that drive action and sales." },
      { id: 8, title: "Quiz Funnel", description: "Use interactive quizzes to segment your audience and deliver personalized product recommendations." },
      { id: 9, title: "Evergreen Video Funnel", description: "Leverage automated video sales presentations that convert viewers into customers 24/7." },
      { id: 10, title: "Content Upgrade Funnel", description: "Turn blog readers into subscribers with content-specific upgrades that add immediate value." },
      { id: 11, title: "Referral Funnel", description: "Turn customers into advocates with incentivized referral programs that drive organic growth." },
      { id: 12, title: "Interactive Tool Funnel", description: "Attract leads with free calculators, generators, or tools that showcase your expertise." },
      { id: 13, title: "Choose the Right Funnel for Your Business Stage", description: "Match funnel strategies to your business goals and current stage of growth." },
      { id: 14, title: "Launch Your First Funnel and Let It Work", description: "Take action with confidence and launch your first funnel to start generating consistent sales." },
    ],
  },
  {
    id: 4,
    title: "Where to sell digital products",
    lessons: 10,
    level: "Intermediate",
    description:
      "Get clear instructions where to build your website, how to store and deliver your digital products, or how to get paid. Create the perfect system for your business.",
    image: platformsImg,
    comingSoon: false,
    slug: "platforms-guide",
    lessonsList: [
      { id: 1, title: "Before You Choose a Platform, Understand This", description: "Understanding the foundation before choosing where to sell your digital products." },
      { id: 2, title: "The 6 Pillars Your Selling Platform Should Have", description: "Essential features every selling platform needs to support your digital product business." },
      { id: 3, title: "The Digital Presence Funnel", description: "How to create a complete digital presence that drives sales and builds trust." },
      { id: 4, title: "Turn Your Website Into a Selling System", description: "Build and optimize your own website to sell digital products directly to customers." },
      { id: 5, title: "Use a Link-in-Bio Tool as Your Sales Hub", description: "Leverage link-in-bio platforms to create a simple yet effective sales hub." },
      { id: 6, title: "Launch Fast on Top Digital Marketplaces", description: "Get started quickly on established marketplaces with built-in audiences." },
      { id: 7, title: "Sell Online Courses Through Marketplaces", description: "Learn about course-specific marketplaces and how to leverage them for education products." },
      { id: 8, title: "How Payment Works on Each Platform", description: "Understanding payment processing, fees, and payout structures across platforms." },
      { id: 9, title: "External Payment Systems for Digital Products", description: "Explore external payment processors like Stripe and LemonSqueezy for more control." },
      { id: 10, title: "Your Digital Business Starts Here", description: "Final insights and next steps for launching your digital product business." },
    ],
  },
  {
    id: 5,
    title: "How to price digital products",
    lessons: 12,
    level: "Intermediate",
    description:
      "A practical, no-fluff guide to help you price your digital products with strategy, confidence, and clarity.",
    image: coinImg,
    comingSoon: false,
    slug: "pricing-guide",
    lessonsList: [
      { id: 1, title: "Why Pricing Matters More Than You Think", description: "Understand why pricing shapes perception, trust, and business sustainability." },
      { id: 2, title: "The Psychology of Pricing", description: "Learn how buyers think and make decisions based on price points and perceived value." },
      { id: 3, title: "Understand Your Product's Value", description: "Discover how to identify and communicate the true value your digital product delivers." },
      { id: 4, title: "Flat Pricing vs Tiered Pricing", description: "Compare pricing models and learn which one fits your product and audience best." },
      { id: 5, title: "One-Time vs Subscription Pricing", description: "Understand the pros and cons of one-time purchases versus recurring subscription models." },
      { id: 6, title: '"Pay What You Want" and Free + Upsell Strategy', description: "Explore alternative pricing strategies that build trust and create opportunities for upsells." },
      { id: 7, title: "Look at the Market, But Price for Value", description: "Learn how to research competitors while staying focused on your unique value proposition." },
      { id: 8, title: "Test Your Pricing Before Scaling", description: "Discover practical methods to validate and test your pricing with real customers." },
      { id: 9, title: "Turn Products Into Offers", description: "Learn how to package, position, and present your products as compelling offers that convert." },
      { id: 10, title: "Set Your Pricing and Stick to It (at First)", description: "Understand why consistency matters and when to adjust your pricing strategy." },
      { id: 11, title: "Create a Pricing Section or Page That Converts", description: "Design pricing pages that clearly communicate value and drive purchase decisions." },
      { id: 12, title: "Your Final Step: Price With Confidence", description: "Launch your products with pricing confidence and clarity." },
    ],
  },
  {
    id: 6,
    title: "How to write effective copy in the age of AI",
    lessons: 17,
    level: "Intermediate",
    description:
      "A clear, actionable guide to help you write digital product copy that connects, converts, and actually drives sales.",
    image: copywritingImg,
    comingSoon: false,
    slug: "copywriting-guide",
    lessonsList: [
      { id: 1, title: "Why Copywriting Matters More Than You Think", description: "Understand why your words are the bridge between your product and your buyers." },
      { id: 2, title: "Your Name Is Your First Sales Pitch", description: "Learn why your product name matters and how to make it stand out." },
      { id: 3, title: "How to Name for Desire (Not Description)", description: "Create product names that trigger emotion and desire." },
      { id: 4, title: "Using Taglines to Add Instant Clarity", description: "Craft taglines that clarify value and make your product instantly understandable." },
      { id: 5, title: "Stop Talking About Features — Start Selling Outcomes", description: "Shift from listing features to communicating the real transformations your product delivers." },
      { id: 6, title: "Writing Like a Mirror: Make It About Them", description: "Master the art of customer-centric writing that speaks directly to your audience's needs." },
      { id: 7, title: "Tell the Story That Sells the Product", description: "Use storytelling to create emotional connection and make your product memorable." },
      { id: 8, title: "How to Format Copy People Actually Read", description: "Structure your copy for maximum readability and engagement." },
      { id: 9, title: "The PAS Formula (Problem, Agitation, Solution)", description: "Master this powerful copywriting framework to write persuasive copy faster." },
      { id: 10, title: "Write Like You Talk — Not Like a Textbook", description: "Develop a conversational writing style that builds trust and feels authentic." },
      { id: 11, title: "Avoid Copy That Tries Too Hard", description: "Learn to recognize and avoid common copywriting mistakes that undermine credibility." },
      { id: 12, title: "Social Proof & Testimonials That Actually Convert", description: "Use testimonials and social proof strategically to build trust and drive conversions." },
      { id: 13, title: "Your Landing Page Is the Sales Conversation", description: "Structure landing pages that guide visitors from curiosity to purchase." },
      { id: 14, title: "Buttons, Headlines & CTAs That Drive Action", description: "Write compelling calls-to-action and headlines that command attention and clicks." },
      { id: 15, title: "Email & DMs: Writing Messages That Lead to Sales", description: "Craft emails and direct messages that build relationships and generate revenue." },
      { id: 16, title: "Clarity Is the New Creativity", description: "Understand why clear, simple copy outperforms clever wordplay every time." },
      { id: 17, title: "Copy Polish Checklist", description: "A final checklist to polish your copy before publishing and ensure maximum impact." },
    ],
  },
  {
    id: 7,
    title: "How to design stunning visuals",
    lessons: 17,
    level: "Intermediate",
    description:
      "A complete guide to creating scroll-stopping visuals that elevate your digital products, boost credibility, and drive conversions.",
    image: brushImg,
    comingSoon: false,
    slug: "visuals-guide",
    lessonsList: [
      { id: 1, title: "Introduction", description: "Begin your journey to creating professional, scroll-stopping visuals for your digital products." },
      { id: 2, title: "Why are visuals important?", description: "Understand how visuals impact perception, credibility, and conversions." },
      { id: 3, title: "Basics of Design", description: "Learn fundamental design principles that make visuals effective and professional." },
      { id: 4, title: "Outline content", description: "Plan and structure your visual content before diving into design work." },
      { id: 5, title: "Establish a color scheme", description: "Choose colors that align with your brand and resonate with your audience." },
      { id: 6, title: "Decide on your typography", description: "Select fonts that enhance readability and strengthen your visual identity." },
      { id: 7, title: "Generate assets with Midjourney", description: "Use AI to create unique visual assets that elevate your digital products." },
      { id: 8, title: "Design eBook cover", description: "Create eye-catching eBook covers that attract buyers and convey value." },
      { id: 9, title: "Utilize premium mockups", description: "Use professional mockups to showcase your products in a realistic, premium way." },
      { id: 10, title: "Create product thumbnails", description: "Design compelling thumbnails that stop the scroll and drive clicks." },
      { id: 11, title: "Create once, reuse multiple times", description: "Build a design system that lets you create faster and maintain consistency." },
      { id: 12, title: "Finalize and export", description: "Prepare your designs for publishing with proper export settings and formats." },
      { id: 13, title: "Repurpose content with Shots.so", description: "Transform your visuals into multiple formats for different platforms and uses." },
      { id: 14, title: "Recap and feedback", description: "Review your design process and gather insights for continuous improvement." },
      { id: 15, title: "Book Cover Templates", description: "120+ professional book cover templates ready to customize in Canva." },
      { id: 16, title: "Visuals Checklist", description: "A comprehensive checklist to ensure your visuals meet professional standards." },
      { id: 17, title: "Tools Library", description: "Access a curated collection of design tools to streamline your workflow." },
    ],
  },
];
