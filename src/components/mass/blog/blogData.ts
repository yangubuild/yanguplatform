import featuredMain from "@/assets/blog/featured-main.jpg";
import featuredLeft1 from "@/assets/blog/featured-left-1.jpg";
import featuredLeft2 from "@/assets/blog/featured-left-2.jpg";
import essay1 from "@/assets/blog/essay-1.jpg";
import essay2 from "@/assets/blog/essay-2.jpg";
import essay3 from "@/assets/blog/essay-3.jpg";
import essay4 from "@/assets/blog/essay-4.jpg";
import adaAiImg from "@/assets/products/ada-ai.jpg";
import foundawebImg from "@/assets/products/foundaweb.jpg";
import visionaireImg from "@/assets/products/visionaire.jpg";
import vlsImg from "@/assets/products/vls.jpg";
import studioImg1 from "@/assets/blog/studio-1.jpg";
import studioImg2 from "@/assets/blog/studio-2.jpg";
import studioImg3 from "@/assets/blog/studio-3.jpg";
import studioImg4 from "@/assets/blog/studio-4.jpg";
import dispatchImg1 from "@/assets/blog/dispatch-1.jpg";
import dispatchImg2 from "@/assets/blog/dispatch-2.jpg";
import dispatchImg3 from "@/assets/blog/dispatch-3.jpg";
import dispatchImg4 from "@/assets/blog/dispatch-4.jpg";
import aiWork1 from "@/assets/blog/ai-work-1.jpg";
import aiWork2 from "@/assets/blog/ai-work-2.jpg";
import aiWork3 from "@/assets/blog/ai-work-3.jpg";
import aiWork4 from "@/assets/blog/ai-work-4.jpg";
import prog1 from "@/assets/blog/prog-1.jpg";
import prog2 from "@/assets/blog/prog-2.jpg";
import prog3 from "@/assets/blog/prog-3.jpg";
import prog4 from "@/assets/blog/prog-4.jpg";
import event1 from "@/assets/blog/event-1.jpg";
import event2 from "@/assets/blog/event-2.jpg";
import event3 from "@/assets/blog/event-3.jpg";
import event4 from "@/assets/blog/event-4.jpg";
import podcastHero from "@/assets/blog/podcast-hero.jpg";
import podcast1 from "@/assets/blog/podcast-1.jpg";
import podcast2 from "@/assets/blog/podcast-2.jpg";
import podcast3 from "@/assets/blog/podcast-3.jpg";

// Mock data for Blog page — 1:1 Every.to clone

export interface BlogArticle {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  column?: string;
  author: string;
  authorAvatar?: string;
  image: string;
}

export interface BlogEssay {
  id: string;
  title: string;
  author: string;
  image: string;
}

export interface BlogProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  link: string;
}

export interface BlogEpisode {
  id: string;
  episode: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface StampItem {
  id: string;
  label: string;
  withText: string;
  color: string;
  icon: string;
}

export const stamps: StampItem[] = [
  { id: "read", label: "Read", withText: "our articles", color: "#1a8a4a", icon: "📖" },
  { id: "email", label: "Email", withText: "with Cora", color: "#1a1adb", icon: "✉️" },
  { id: "speak", label: "Speak", withText: "with Monologue", color: "#8b2abf", icon: "🎙️" },
  { id: "listen", label: "Listen", withText: "to our podcast", color: "#c0461a", icon: "🎧" },
  { id: "write", label: "Write", withText: "with Spiral", color: "#d4691a", icon: "✍️" },
  { id: "organize", label: "Organize", withText: "with Sparkle", color: "#b8a030", icon: "✨" },
];

export const featuredArticles: BlogArticle[] = [
  {
    id: "1",
    title: "The AI-Powered Editor That Writes With You",
    subtitle: "How Spiral is changing the way writers think about AI assistance",
    date: "Feb 8, 2026",
    column: "PRODUCT DEEP DIVE",
    author: "Dan Shipper",
    image: featuredMain,
  },
  {
    id: "2",
    title: "Why Every Company Needs an AI Strategy Now",
    date: "Feb 7, 2026",
    column: "DISPATCHES",
    author: "Evan Armstrong",
    image: featuredLeft1,
  },
  {
    id: "3",
    title: "Building AI Products That People Actually Use",
    subtitle: "Lessons from shipping to 100,000+ users",
    date: "Feb 6, 2026",
    column: "YANGU STUDIO",
    author: "Dan Shipper",
    image: featuredLeft2,
  },
];

export const recentEssays: BlogEssay[] = [
  { id: "e1", title: "The Future of Knowledge Work Is Here", author: "Dan Shipper", image: essay1 },
  { id: "e2", title: "How to Build an AI-First Company", author: "Evan Armstrong", image: essay2 },
  { id: "e3", title: "The Compound Effect of Writing Daily", author: "Casey Rosengren", image: essay3 },
  { id: "e4", title: "Why Taste Matters More Than Ever in AI", author: "Dan Shipper", image: essay4 },
];

export const products: BlogProduct[] = [
  { id: "p1", name: "Ada AI", description: "The Intelligence Layer of Yangu — ADA AI is the thinking layer of the Yangu ecosystem.", image: adaAiImg, link: "#" },
  { id: "p2", name: "Foundaweb", description: "AI website builder for businesses. Create websites and business pages and launch without code.", image: foundawebImg, link: "#" },
  { id: "p3", name: "Visionaire", description: "AI digital knowledge engine that gives instant access to ready-to-use intellectual assets.", image: visionaireImg, link: "#" },
  { id: "p4", name: "VLS", description: "Helps entrepreneurs build and scale their businesses.", image: vlsImg, link: "#" },
];

export const studioArticles: BlogArticle[] = [
  { id: "s1", title: "Compound Engineering: The Definitive Guide", subtitle: "A comprehensive handbook for the AI-native engineering philosophy", date: "Feb 5, 2026", column: "YANGU STUDIO", author: "Dan Shipper", image: studioImg1 },
  { id: "s2", title: "Compound Engineering: How Every Codes With Agents", subtitle: "A four-step engineering process for software teams that don't write code", date: "Feb 3, 2026", column: "YANGU STUDIO", author: "Dan Shipper", image: studioImg2 },
  { id: "s3", title: "Teach Your AI to Think Like a Senior Engineer", subtitle: "These are the eight strategies I use to help my AI learn my codebase, my patterns, and my preferences", date: "Feb 1, 2026", column: "YANGU STUDIO", author: "Dan Shipper", image: studioImg3 },
  { id: "s4", title: "Stop Coding and Start Planning", subtitle: "Spend an hour teaching AI how you think, and it gets smarter with every feature you build", date: "Jan 29, 2026", column: "YANGU STUDIO", author: "Dan Shipper", image: studioImg4 },
];

export const dispatchArticles: BlogArticle[] = [
  { id: "d1", title: "Vibe Check: Opus 4.6—The Best Coding Model We've Tested (With Some Maddening Habits)", subtitle: "It one-shotted a problem other models missed—and brings agentic, parallel work to non-coding tasks", date: "Feb 4, 2026", column: "DISPATCHES", author: "Dan Shipper", image: dispatchImg1 },
  { id: "d2", title: "Vibe Check: OpenAI's Codex App Gains Ground on Claude Code", subtitle: "OpenAI nailed the interface. But it's built for hardcore engineering.", date: "Feb 2, 2026", column: "DISPATCHES", author: "Dan Shipper", image: dispatchImg2 },
  { id: "d3", title: "Vibe Check: Claude Cowork Is Claude Code for the Rest of Us", subtitle: "The asynchronous, agentic workflow developers love is finally accessible to everyone—but the polish isn't there yet", date: "Jan 30, 2026", column: "DISPATCHES", author: "Katie Parrott", image: dispatchImg3 },
  { id: "d4", title: "The Boring Businesses That Will Dominate the AI Era", subtitle: "They're not the companies with the best models—they're the ones that own what AI has to flow through.", date: "Jan 28, 2026", column: "DISPATCHES", author: "Tina He", image: dispatchImg4 },
];

export const aiWorkArticles: BlogArticle[] = [
  { id: "a1", title: "Automating Your Research Workflow with AI", subtitle: "'Does this mean I'm good at my job?'", date: "Feb 3, 2026", column: "PUTTING AI TO WORK", author: "Katie Parrott", image: aiWork1 },
  { id: "a2", title: "How AI Can Cut Your Planning Cycle From Two Weeks to Two Days", subtitle: "Three simple tools will save you hours—plus, the seven-step process for implementation", date: "Feb 1, 2026", column: "PUTTING AI TO WORK", author: "Austin Tedesco", image: aiWork2 },
  { id: "a3", title: "Think First, AI Second", subtitle: "Three principles for keeping your cognitive edge while leveraging AI's capabilities", date: "Jan 29, 2026", column: "PUTTING AI TO WORK", author: "Ines Lee", image: aiWork3 },
  { id: "a4", title: "Vibe Check: Skills Need a 'Share' Button", subtitle: "The feature is powerful for individuals and tricky for teams—but it does lighten the cognitive load", date: "Jan 27, 2026", column: "PUTTING AI TO WORK", author: "Katie Parrott", image: aiWork4 },
];

export const programmingArticles: BlogArticle[] = [
  { id: "f1", title: "Compound Engineering: The Definitive Guide", subtitle: "A comprehensive handbook for the AI-native engineering philosophy", date: "Feb 2, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Kieran Klaassen", image: prog1 },
  { id: "f2", title: "Vibe Check: OpenAI's Codex App Gains Ground on Claude Code", subtitle: "OpenAI nailed the interface. But it's built for hardcore engineering.", date: "Jan 31, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Dan Shipper", image: prog2 },
  { id: "f3", title: "How I Use Claude Code to Ship Like a Team of Five", subtitle: "It's the first AI tool that feels like delegating to a colleague, not prompting a chatbot", date: "Jan 28, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Kieran Klaassen", image: prog3 },
  { id: "f4", title: "I Stopped Reading Code. My Code Reviews Got Better.", subtitle: "How 13 AI agents reviewing in parallel caught a critical bug I would have otherwise missed", date: "Jan 26, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Kieran Klaassen", image: prog4 },
];

export interface BlogEvent {
  id: string;
  title: string;
  date: string;
  image: string;
}

export const eventArticles: BlogEvent[] = [
  { id: "ev1", title: "Yangu AI Week 2026", date: "July 7–11, 2026", image: event1 },
  { id: "ev2", title: "Yangu Builders/Sellers Event", date: "July 15, 2026", image: event2 },
  { id: "ev3", title: "Yangu Influencers Live Stream", date: "July 22, 2026", image: event3 },
  { id: "ev4", title: "Yangu Developers Community", date: "July 29, 2026", image: event4 },
];

export const columnistArticles: BlogArticle[] = [
  { id: "c1", title: "What I Learned Building AI Products for a Year", date: "Feb 6, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "c2", title: "The Taste Gap in AI", date: "Feb 3, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "c3", title: "How to Think About AI Risk as a Builder", date: "Jan 31, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
];

export const podcastEpisodes: BlogEpisode[] = [
  { id: "ep1", episode: 88, title: "Every's Head of Consulting Just Automated Her Job", subtitle: "Natalia Quintero on why resources and fancy tools don't predict success, the power of internal AI champions, and building Claudie", image: podcast1 },
  { id: "ep2", episode: 87, title: "Opus 4.5 Changed How Andrew Wilkinson Works and Lives", subtitle: "Tiny's cofounder on the relationship counselor, email client, and personal stylist he created with AI", image: podcast2 },
  { id: "ep3", episode: 86, title: "Why Your AI Learning Projects Keep Fizzling Out", subtitle: "Founder Nir Zicherman on what general-purpose LLMs can't do—and what real learning requires", image: podcast3 },
];

export const podcastHeroImage = podcastHero;

export const chipLabels = [
  "Newsletter",
  "Podcast",
  "Organize your Mac",
  "Automate writing",
  "Stop email stress",
  "Write 3x faster",
];

export const exploreItems = [
  { icon: "📰", label: "Read an article" },
  { icon: "👕", label: "Buy our exclusive merch" },
  { icon: "💬", label: "Join our subscriber-only Discord" },
  { icon: "🎙️", label: "Listen to the 'AI and I' podcast" },
  { icon: "📧", label: "Get to inbox zero with Cora" },
  { icon: "✨", label: "Use Sparkle to organize your Mac" },
  { icon: "↩️", label: "Use Spiral to write with AI" },
  { icon: "𝑀", label: "Use Monologue for voice dictation" },
  { icon: "👥", label: "Create a team" },
  { icon: "💛", label: "Refer a friend and get paid", muted: true },
];
