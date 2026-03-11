import guideImg from "@/assets/university/courses/guide.png";
import buildingImg from "@/assets/university/courses/building.png";
import funnelImg from "@/assets/university/courses/funnel.png";
import platformsImg from "@/assets/university/courses/platforms.png";
import coinImg from "@/assets/university/courses/coin.png";
import copywritingImg from "@/assets/university/courses/copywriting.png";
import brushImg from "@/assets/university/courses/brush.png";

export interface MasterclassCourse {
  id: number;
  title: string;
  lessons: number;
  level: string;
  description: string;
  image: string;
  comingSoon: boolean;
  slug: string;
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
  },
];
