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
  { id: "d1", title: "The AI Race Is Over. The Application Race Has Begun.", date: "Feb 4, 2026", column: "DISPATCHES", author: "Evan Armstrong", image: "/placeholder.svg" },
  { id: "d2", title: "OpenAI's New Strategy Is Hiding in Plain Sight", date: "Feb 2, 2026", column: "DISPATCHES", author: "Evan Armstrong", image: "/placeholder.svg" },
  { id: "d3", title: "Google's AI Moment Is Finally Here", date: "Jan 30, 2026", column: "DISPATCHES", author: "Evan Armstrong", image: "/placeholder.svg" },
  { id: "d4", title: "Why Apple Intelligence Will Win the Consumer AI War", date: "Jan 28, 2026", column: "DISPATCHES", author: "Evan Armstrong", image: "/placeholder.svg" },
];

export const aiWorkArticles: BlogArticle[] = [
  { id: "a1", title: "Automating Your Research Workflow with AI", date: "Feb 3, 2026", column: "PUTTING AI TO WORK", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "a2", title: "The Best AI Tools for Writers in 2026", date: "Feb 1, 2026", column: "PUTTING AI TO WORK", author: "Casey Rosengren", image: "/placeholder.svg" },
  { id: "a3", title: "How I Use AI to Read 100 Articles a Week", date: "Jan 29, 2026", column: "PUTTING AI TO WORK", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "a4", title: "Building a Personal AI Knowledge Base", date: "Jan 27, 2026", column: "PUTTING AI TO WORK", author: "Dan Shipper", image: "/placeholder.svg" },
];

export const programmingArticles: BlogArticle[] = [
  { id: "f1", title: "Vibe Coding Is the Future of Software", date: "Feb 2, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "f2", title: "Why Every Developer Should Learn Prompt Engineering", date: "Jan 31, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "f3", title: "The End of Boilerplate Code", date: "Jan 28, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "f4", title: "How AI Is Changing the Way We Debug", date: "Jan 26, 2026", column: "THE FUTURE OF PROGRAMMING", author: "Dan Shipper", image: "/placeholder.svg" },
];

export const writingArticles: BlogArticle[] = [
  { id: "w1", title: "Writing in the Age of AI: A New Framework", date: "Feb 1, 2026", column: "THE NEW RULES OF WRITING", author: "Casey Rosengren", image: "/placeholder.svg" },
  { id: "w2", title: "How to Use AI Without Losing Your Voice", date: "Jan 30, 2026", column: "THE NEW RULES OF WRITING", author: "Casey Rosengren", image: "/placeholder.svg" },
  { id: "w3", title: "The 3x Writing Method: Speed Without Sacrifice", date: "Jan 27, 2026", column: "THE NEW RULES OF WRITING", author: "Casey Rosengren", image: "/placeholder.svg" },
  { id: "w4", title: "Why the Best Writers Will Embrace AI First", date: "Jan 25, 2026", column: "THE NEW RULES OF WRITING", author: "Casey Rosengren", image: "/placeholder.svg" },
];

export const columnistArticles: BlogArticle[] = [
  { id: "c1", title: "What I Learned Building AI Products for a Year", date: "Feb 6, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "c2", title: "The Taste Gap in AI", date: "Feb 3, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
  { id: "c3", title: "How to Think About AI Risk as a Builder", date: "Jan 31, 2026", author: "Dan Shipper", image: "/placeholder.svg" },
];

export const podcastEpisodes: BlogEpisode[] = [
  { id: "ep1", episode: 88, title: "The Future of AI-Powered Writing", subtitle: "Dan Shipper interviews the founders of Anthropic about Claude's creative capabilities", image: "/placeholder.svg" },
  { id: "ep2", episode: 87, title: "Building Products in the Age of LLMs", subtitle: "How startups are rethinking product development with AI at the core", image: "/placeholder.svg" },
  { id: "ep3", episode: 86, title: "The State of AI in 2026", subtitle: "A comprehensive look at where we are and where we're headed", image: "/placeholder.svg" },
];

export const chipLabels = [
  "Newsletter",
  "Podcast",
  "Organize your Mac",
  "Automate writing",
  "Stop email stress",
  "Write 3x faster",
];

export const exploreItems = [
  { icon: "📖", label: "Read an article" },
  { icon: "🎧", label: "Listen to a podcast" },
  { icon: "✉️", label: "Get inbox zero with Cora" },
  { icon: "✨", label: "Organize with Sparkle" },
  { icon: "✍️", label: "Write with Spiral" },
  { icon: "🎙️", label: "Voice dictation with Monologue" },
  { icon: "👥", label: "Create a team" },
  { icon: "💌", label: "Refer a friend" },
];
