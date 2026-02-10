export interface CommunityItem {
  id: string;
  image: string;
  title: string;
  description: string;
  price?: string;
  category: string;
}

export interface CreatorItem {
  id: string;
  image: string;
  name: string;
  role: string;
}

export const categories = [
  "Explore",
  "Be more productive",
  "Start and scale my business",
  "Improve my health",
  "Grow my brand and audience",
  "Build my tech skills",
  "Lead with confidence",
  "Grow my network",
  "Strengthen my relationships",
  "Grow my wealth",
  "Pursue new interests",
];

export const creatorItems: CreatorItem[] = [
  {
    id: "c1",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    name: "Gesche Haas",
    role: "Entrepreneur",
  },
  {
    id: "c2",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    name: "Brad Hussey",
    role: "Web Designer & Educator",
  },
  {
    id: "c3",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    name: "Kirill Zubovsky",
    role: "Podcast Host",
  },
];

export const communityItems: CommunityItem[] = [
  // --- Trending ---
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
    title: "The first online community in Morocco",
    description: "A vibrant space for Moroccan entrepreneurs, freelancers, and creators to connect, share resources, and grow together.",
    price: "From $35 / month",
    category: "Start and scale my business",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=375&fit=crop",
    title: "10x Designers",
    description: "Level up your design career with expert feedback, portfolio reviews, and a supportive design community.",
    category: "Build my tech skills",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=375&fit=crop",
    title: "The Get Klowt Community",
    description: "The #1 community for building a personal brand that's impossible to ignore.",
    price: "$37 / month",
    category: "Grow my brand and audience",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=375&fit=crop",
    title: "Creative Crew",
    description: "An online platform for web designers, agency owners, and creative professionals to grow their businesses.",
    price: "$29 / month",
    category: "Start and scale my business",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=375&fit=crop",
    title: "SuperDataScience Membership",
    description: "Accelerate your career and boost your earning potential with our expert instructors & community!",
    category: "Build my tech skills",
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=375&fit=crop",
    title: "Brand Deal Wizard",
    description: "Master pitching, pricing, and longer-term deals. Unearth the confident negotiator inside of you.",
    price: "$1,497",
    category: "Grow my brand and audience",
  },

  // --- Be more productive ---
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=375&fit=crop",
    title: "Leader Assistant",
    description: "Relevant training, private community, and ongoing support for executive assistants.",
    price: "$799 / year",
    category: "Be more productive",
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=600&h=375&fit=crop",
    title: "The Novelry Live",
    description: "Write your novel with daily coaching, a supportive community, and expert craft lessons.",
    price: "$24 / month",
    category: "Be more productive",
  },
  {
    id: "9",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=375&fit=crop",
    title: "Practice Portal",
    description: "A dedicated space for mindful practitioners to build consistent habits and share progress.",
    category: "Be more productive",
  },

  // --- Start and scale my business ---
  {
    id: "10",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=375&fit=crop",
    title: "How to Sell Without Feeling Like Selling",
    description: "Your step-by-step course to stop losing deals in discovery.",
    price: "$299",
    category: "Start and scale my business",
  },
  {
    id: "11",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=375&fit=crop",
    title: "SaaS Growth Lab",
    description: "Access personalized mentorship and community support for business growth.",
    price: "$29 / month",
    category: "Start and scale my business",
  },

  // --- Improve my health ---
  {
    id: "12",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=375&fit=crop",
    title: "Mindful Living Community",
    description: "Join a supportive community focused on mental health, mindfulness, and overall well-being.",
    category: "Improve my health",
  },
  {
    id: "13",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=375&fit=crop",
    title: "Fitness & Wellness Pro",
    description: "Expert-led fitness programs, nutrition advice, and wellness coaching.",
    price: "From $19 / month",
    category: "Improve my health",
  },

  // --- Grow my brand and audience ---
  {
    id: "14",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=375&fit=crop",
    title: "Content Creators Club",
    description: "Learn content strategy, grow your audience, and monetize your creative work.",
    price: "$25 / month",
    category: "Grow my brand and audience",
  },

  // --- Build my tech skills ---
  {
    id: "15",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=375&fit=crop",
    title: "Full-Stack Engineers",
    description: "A community for developers building modern web applications and sharing technical knowledge.",
    price: "$20 / month",
    category: "Build my tech skills",
  },

  // --- Lead with confidence ---
  {
    id: "16",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=375&fit=crop",
    title: "Executive Leaders Forum",
    description: "A private circle for C-suite executives sharing leadership strategies and insights.",
    price: "$99 / month",
    category: "Lead with confidence",
  },
  {
    id: "17",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=375&fit=crop",
    title: "Leadership Circle",
    description: "Build your leadership skills with peer mentoring and expert-led workshops.",
    price: "$49 / month",
    category: "Lead with confidence",
  },

  // --- Grow my network ---
  {
    id: "18",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=375&fit=crop",
    title: "Founders Network",
    description: "Connect with startup founders across industries to share wins, challenges, and resources.",
    price: "$39 / month",
    category: "Grow my network",
  },
  {
    id: "19",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=375&fit=crop",
    title: "Digital Nomad Hub",
    description: "A global community for remote workers and digital nomads sharing tips and co-working meetups.",
    category: "Grow my network",
  },

  // --- Strengthen my relationships ---
  {
    id: "20",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=375&fit=crop",
    title: "Relationship Mastery",
    description: "Build stronger personal and professional relationships through expert guidance and community support.",
    category: "Strengthen my relationships",
  },

  // --- Grow my wealth ---
  {
    id: "21",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=375&fit=crop",
    title: "Wealth Builders Academy",
    description: "Learn investment strategies, financial planning, and wealth-building techniques from experts.",
    price: "$59 / month",
    category: "Grow my wealth",
  },
  {
    id: "22",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=375&fit=crop",
    title: "Crypto & DeFi Circle",
    description: "Stay ahead in the world of cryptocurrency and decentralized finance with real-time analysis.",
    price: "$35 / month",
    category: "Grow my wealth",
  },

  // --- Pursue new interests ---
  {
    id: "23",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=375&fit=crop",
    title: "Photography Masters",
    description: "A creative community for photographers of all levels to learn, share, and get inspired.",
    category: "Pursue new interests",
  },
  {
    id: "24",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=375&fit=crop",
    title: "Study Together",
    description: "Find accountability partners and study groups for any subject or certification.",
    category: "Pursue new interests",
  },
];
