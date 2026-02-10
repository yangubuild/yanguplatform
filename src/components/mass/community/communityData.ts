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
];

export const creatorItems: CreatorItem[] = [
  {
    id: "c1",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    name: "Ali Abdaal",
    role: "Productivity expert",
  },
  {
    id: "c2",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    name: "Dana Malstaff",
    role: "Business owner",
  },
  {
    id: "c3",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    name: "Pat Flynn",
    role: "Entrepreneur",
  },
  {
    id: "c4",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    name: "Mila Clarke",
    role: "Health coach",
  },
  {
    id: "c5",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    name: "Jay Shetty",
    role: "Life Coach",
  },
  {
    id: "c6",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    name: "Brendon Burchard",
    role: "High performance coach",
  },
  {
    id: "c7",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    name: "Gesche Haas",
    role: "Entrepreneur",
  },
];

export const communityItems: CommunityItem[] = [
  // --- Trending ---
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=375&fit=crop",
    title: "The Sistas Club",
    description: "A movement education community focused on Pilates, mobility, and body awareness.",
    price: "From $79 / month",
    category: "Improve my health",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=375&fit=crop",
    title: "Aiville",
    description: "Community and learning hub for mastering AI tools and skills.",
    price: "From $87 / month",
    category: "Build my tech skills",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
    title: "Everyday Korean",
    description: "Supportive global Korean learning community.",
    price: "From $67 / month",
    category: "Be more productive",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=375&fit=crop",
    title: "Calligraphy Together",
    description: "A cozy, welcoming home for anyone learning calligraphy.",
    price: "From $50 / month",
    category: "Be more productive",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=375&fit=crop",
    title: "Quantum Human Design",
    description: "Reclaim the Truth of Who You Are and create a life that is worthy of you.",
    price: "FREE",
    category: "Improve my health",
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=375&fit=crop",
    title: "Dynamics of Mastery",
    description: "A holistic community + course for building production-ready AI agent systems.",
    price: "$712 / year",
    category: "Build my tech skills",
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=375&fit=crop",
    title: "Backbone School",
    description: "Learn virtual bookkeeping through live classes, challenges, and creative community.",
    price: "From $17 / month",
    category: "Start and scale my business",
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=375&fit=crop",
    title: "SupaRose Academy",
    description: "Circle-based learning and course for testing and anti-erosion growth.",
    price: "$6.93",
    category: "Build my tech skills",
  },

  // --- Popular ---
  {
    id: "9",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=375&fit=crop",
    title: "Community in The Future Life",
    description: "A supportive makerspace community offering expert education, guidance, and crafts...",
    price: "FREE",
    category: "Be more productive",
  },
  {
    id: "10",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=375&fit=crop",
    title: "Teal Swan",
    description: "A fiercely relational platform mixing community, courses, and live events.",
    price: "From $79 / month",
    category: "Improve my health",
  },
  {
    id: "11",
    image: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=600&h=375&fit=crop",
    title: "The Naming Channel Club",
    description: "The Naming Channel's Club aims to create the world's most supportive online naming...",
    price: "From $0 / month",
    category: "Start and scale my business",
  },
  {
    id: "12",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=375&fit=crop",
    title: "The First Online Process Driven Community",
    description: "Level up your online business with real experts. Live coaching, workshops, and more.",
    price: "$199 / year",
    category: "Start and scale my business",
  },
  {
    id: "13",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=375&fit=crop",
    title: "Toolie Harmonica School",
    description: "Comprehensive harmonica curriculum with lessons, live sessions, and community.",
    price: "From $17 / year",
    category: "Be more productive",
  },
  {
    id: "14",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=375&fit=crop",
    title: "Musical Friends",
    description: "A judgment-free community offering education and real-world support for musicians.",
    price: "$9 / month",
    category: "Be more productive",
  },
  {
    id: "15",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=375&fit=crop",
    title: "Second Brain Membership",
    description: "Build systems that simplify work & magnify results.",
    price: "$225 / quarter",
    category: "Be more productive",
  },
  {
    id: "16",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=375&fit=crop",
    title: "London Writers' Salon - Global Writing Community",
    description: "The writing community you've been looking for.",
    price: "From $49 / month",
    category: "Be more productive",
  },

  // --- Be more productive ---
  {
    id: "17",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=375&fit=crop",
    title: "Doing it For The Kids",
    description: "Community & connection for freelance parents. A very different kind of 4am Club...",
    price: "$18 / month",
    category: "Be more productive",
  },
  {
    id: "18",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=375&fit=crop",
    title: "New Designer Port - Coaching",
    description: "The Full Pro experience with access to all classes, community and coaching with Jos...",
    price: "from $198 / month",
    category: "Be more productive",
  },
  {
    id: "19",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=375&fit=crop",
    title: "GrowthCommunity Academy",
    description: "Learn how to design, build and launch your community the right way.",
    price: "$987 / biannual",
    category: "Be more productive",
  },
  {
    id: "20",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=375&fit=crop",
    title: "Productivity Lab",
    description: "Double your Productivity. Enjoy the Journey.",
    price: "$397 / year",
    category: "Be more productive",
  },

  // --- Start and scale my business ---
  {
    id: "21",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=375&fit=crop",
    title: "Investor's Club",
    description: "Need help with pitching, pricing, and negotiating brand partnerships? Join...",
    price: "$207 / month",
    category: "Start and scale my business",
  },
  {
    id: "22",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=375&fit=crop",
    title: "ExcessivelyBizMeaningful Masterclass + Community",
    description: "The expert guidance you need to create and scale world-class, one-of-a-kind...",
    price: "$6,497",
    category: "Start and scale my business",
  },
  {
    id: "23",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=375&fit=crop",
    title: "Divide Systems + Build Community + Generate More",
    description: "Learn how to use quizzes to attract the right kind of leads to your business.",
    price: "$497",
    category: "Start and scale my business",
  },
  {
    id: "24",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=375&fit=crop",
    title: "Creative Lab",
    description: "Turning passionate creatives into profitable product heroes with focused challenges & ...",
    price: "from $27 / month",
    category: "Start and scale my business",
  },
  {
    id: "25",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=375&fit=crop",
    title: "Design for Freedom*",
    description: "The #1 Community for designers building a business on your own terms.",
    price: "$49 / biannual",
    category: "Start and scale my business",
  },
  {
    id: "26",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=375&fit=crop",
    title: "ExtravirtualList 101",
    description: "Pro-level immersive training, exclusive projects, and a sprawling community led by...",
    price: "From $189 / month",
    category: "Start and scale my business",
  },
  {
    id: "27",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=375&fit=crop",
    title: "Altea",
    description: "Move to the must-join private community for serious alternative investors.",
    price: "$89 / year",
    category: "Start and scale my business",
  },
  {
    id: "28",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=375&fit=crop",
    title: "AI Finance Club",
    description: "A training and peer support platform helping finance pros use AI to revise smarter and...",
    price: "$497 /quarter",
    category: "Start and scale my business",
  },

  // Additional categories
  {
    id: "29",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=375&fit=crop",
    title: "Mindful Living Community",
    description: "Join a supportive community focused on mental health, mindfulness, and well-being.",
    category: "Improve my health",
  },
  {
    id: "30",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=375&fit=crop",
    title: "Fitness & Wellness Pro",
    description: "Expert-led fitness programs, nutrition advice, and wellness coaching.",
    price: "From $19 / month",
    category: "Improve my health",
  },
  {
    id: "31",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=375&fit=crop",
    title: "Content Creators Club",
    description: "Learn content strategy, grow your audience, and monetize your creative work.",
    price: "$25 / month",
    category: "Grow my brand and audience",
  },
  {
    id: "32",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=375&fit=crop",
    title: "Brand Deal Wizard",
    description: "Master pitching, pricing, and longer-term brand deals.",
    price: "$1,497",
    category: "Grow my brand and audience",
  },
  {
    id: "33",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=375&fit=crop",
    title: "Full-Stack Engineers",
    description: "A community for developers building modern web applications.",
    price: "$20 / month",
    category: "Build my tech skills",
  },
  {
    id: "34",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=375&fit=crop",
    title: "Executive Leaders Forum",
    description: "A private circle for C-suite executives sharing leadership strategies.",
    price: "$99 / month",
    category: "Lead with confidence",
  },
  {
    id: "35",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=375&fit=crop",
    title: "Leadership Circle",
    description: "Build your leadership skills with peer mentoring and expert-led workshops.",
    price: "$49 / month",
    category: "Lead with confidence",
  },
];
