export interface Resource {
  image: string;
  title: string;
  subtitle: string;
  category: "Sale" | "Learn" | "Build" | "Scale";
  featured?: boolean;
}

export const featuredResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/LnXUeoRLtFdfqGFphNz2RHNZVk.jpg?width=2400&height=1800",
    title: "Live Shopping",
    subtitle: "Sell Products Live",
    category: "Sale",
    featured: true,
  },
  {
    image: "https://framerusercontent.com/images/bE2r4D8FDICBHISLhFehg0fZvI.jpg?width=2400&height=1800",
    title: "Ada AI",
    subtitle: "Your 24/7 AI assistant",
    category: "Sale",
    featured: true,
  },
  {
    image: "https://framerusercontent.com/images/kRIOHbPRgtbfe4Z0NlK2qSiO5Q.jpg?width=1200&height=900",
    title: "Digital E-Shop",
    subtitle: "Sell Products Online",
    category: "Sale",
    featured: true,
  },
  {
    image: "https://framerusercontent.com/images/lFB33SIMWsogDBI02316XDG3tfc.jpg?width=1200&height=900",
    title: "Digital Menu",
    subtitle: "Increase your sales with digital menu",
    category: "Sale",
    featured: true,
  },
  {
    image: "https://framerusercontent.com/images/kUNPmKVFYs9FN6p19KwE8pNZdA.png?width=278&height=181",
    title: "Social Marketing",
    subtitle: "Grow Your Audience With AI",
    category: "Sale",
    featured: true,
  },
  {
    image: "https://framerusercontent.com/images/NgkQ2uqwhqhzp1GpuNpksVYeAE.png?width=2920&height=1602",
    title: "Learn From 1000+ Courses",
    subtitle: "(Ebooks, courses, business skills)",
    category: "Learn",
    featured: true,
  },
];

export const learnResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/mEAxnN029jRMMnVb24MVnsrUeHE.jpeg?width=1600&height=1085",
    title: "Learn From 1000+ Courses",
    subtitle: "(Ebooks, courses, business skills)",
    category: "Learn",
  },
  {
    image: "https://framerusercontent.com/images/O1XE3m9LcBRskOvexF1hpVFrTxc.jpg?width=1208&height=840",
    title: "Organize Work Every Day",
    subtitle: "(Tasks, goals, team planning)",
    category: "Learn",
  },
  {
    image: "https://framerusercontent.com/images/xgZmgz5YDwDdQhd0RLniNpa6nU.png?width=225&height=225",
    title: "Documents",
    subtitle: "Create And Manage Documents",
    category: "Learn",
  },
];

export const buildResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/jjVzS6V0rxaPtwgro5T0jtT1SU.webp?width=480&height=480",
    title: "Business Name Generator",
    subtitle: "Find A Business Name with AI",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/LPLJLjZ9YP6IDi5Y38zeDr0Yhk.png?width=1280&height=669",
    title: "Slogan Generator",
    subtitle: "AI Creates A Catchy Slogan for you",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/vRKHvYWGkrco7ma8f6v0qd6Zd6U.webp?width=1920&height=1080",
    title: "Mission Statement Generator",
    subtitle: "AI Writes Your Mission",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/QxoRb0hyzjhf04lfada38CWDQ.webp?width=900&height=900",
    title: "Vision Statement Generator",
    subtitle: "AI helps you Define Your Vision",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/1EYuHNLIZfd3KPA2YNNQ3SExdQ.png?width=2200&height=1155",
    title: "Design A Brand Logo",
    subtitle: "Create professional logos with AI",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/e08XkYTDTj364yoqwtnAc4aJFs.webp?width=1920&height=1080",
    title: "Website Builder",
    subtitle: "Build Websites With AI",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/PnnqkVgF0MoMLyv4nvZk7qwI.webp?width=200&height=200",
    title: "Digital E-Shop",
    subtitle: "Sell Products Online",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/HK6KSLTZ1lO0yslbw7PLMLK5o7k.webp?width=900&height=460",
    title: "Real Estate",
    subtitle: "Sale properties faster with AI",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/3nk8HG5ItlAWCv0U6jySow4IEFQ.jpg?width=2400&height=1800",
    title: "E-Shop Connect",
    subtitle: "Connect With Global Wholesalers",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/Nzdiy3XNG5dC2jF8fhxfL0mNwgs.jpg?width=2400&height=1800",
    title: "Digital Menu",
    subtitle: "Increase your sales with digital menu",
    category: "Build",
  },
  {
    image: "https://framerusercontent.com/images/p0R2sbIk02iPvix3d6dTG9Jo8aQ.png?width=2400&height=1800",
    title: "Digital Signature",
    subtitle: "Sign Documents Online",
    category: "Build",
  },
];

export const scaleResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/iC27oS3MuMxHlirXF2aX4OwR4.jpg?width=686&height=386",
    title: "Social Marketing",
    subtitle: "Grow Your Audience With AI",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/NgkQ2uqwhqhzp1GpuNpksVYeAE.png?width=2920&height=1602",
    title: "Live Shopping",
    subtitle: "Sell Products Live",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/jk8g42padnAY0o4tKhbV4kdzf1o.png?width=1920&height=1080",
    title: "VLS (Video Live Selling)",
    subtitle: "Sell With Live Video",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/NOZs9Jd135hsIVpEMdnSvE4qIk.png?width=800&height=800",
    title: "CRM",
    subtitle: "Manage Customer Relationships",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/Y9fiyZpn4qkBDzGhQdc9fba9vSM.png?width=2560&height=1707",
    title: "Sales CRM",
    subtitle: "Track Leads And Sales",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/owETFKhMJo9D1KuJk6xgJWNlL0.jpg?width=717&height=478",
    title: "Email Marketing",
    subtitle: "Send Marketing Emails",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/9BKk3iSbRxIZ9rhvAsbBx5YdAak.png?width=1200&height=650",
    title: "Digital Reporting",
    subtitle: "Track Business Performance",
    category: "Scale",
  },
  {
    image: "https://framerusercontent.com/images/SlX28zZGsaeYtT1j6QA7ZGUtYM.png?width=2000&height=1000",
    title: "Ada AI",
    subtitle: "Your 24/7 AI assistant",
    category: "Scale",
  },
];
