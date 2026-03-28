export type Category = "emenu" | "community" | "eshop" | "estore" | "esite" | "influencer";

export interface CategoryConfig {
  key: Category;
  label: string;
  domain: string;
  keywords: string[];
  pages: string[];
}

export const CATEGORY_CONFIGS: Record<Category, CategoryConfig> = {
  emenu: {
    key: "emenu",
    label: "Emenu",
    domain: ".shop",
    keywords: ["restaurant", "cafe", "food", "burger", "pizza", "delivery", "menu", "chicken", "fries", "kitchen", "bakery", "catering"],
    pages: ["Hero", "Menu", "About", "Location", "Delivery"],
  },
  community: {
    key: "community",
    label: "Community",
    domain: ".community",
    keywords: ["coach", "teacher", "freelancer", "webinar", "event", "course", "training", "mentor", "workshop"],
    pages: ["Hero", "Programs/Courses", "About", "Contact", "Events"],
  },
  eshop: {
    key: "eshop",
    label: "Eshop",
    domain: ".shop",
    keywords: ["shop", "store", "sell", "products", "retail", "merchandise", "fashion", "clothing"],
    pages: ["Hero", "Products", "About", "Contact", "Order"],
  },
  estore: {
    key: "estore",
    label: "Estore",
    domain: ".store",
    keywords: ["wholesale", "trader", "supermarket", "agriculture", "steel", "industrial", "bulk", "distribution", "hardware"],
    pages: ["Hero", "Products/Catalog", "About", "Contact", "Wholesale/Inquiry"],
  },
  esite: {
    key: "esite",
    label: "Esite",
    domain: ".site",
    keywords: ["service", "real estate", "agency", "consulting", "tour", "portfolio", "professional", "law", "medical"],
    pages: ["Hero", "Services", "About", "Contact", "Results"],
  },
  influencer: {
    key: "influencer",
    label: "Influencer",
    domain: ".live",
    keywords: ["creator", "streamer", "artist", "musician", "content", "influencer", "youtuber", "tiktoker", "vlogger"],
    pages: ["Hero", "Content/Gallery", "Bio", "Contact", "Support"],
  },
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  buttons?: SelectionButton[];
  timestamp: number;
}

export interface SelectionButton {
  id: string;
  label: string;
  value: string;
  type: "scope" | "assets" | "sections" | "delivery_apps" | "style_category" | "style_specific" | "confirm";
}

export interface Selection {
  type: string;
  label: string;
  value: string;
  timestamp: number;
}

export interface BuilderState {
  userIdea: string;
  category: Category | null;
  selections: Selection[];
  finalConfig: {
    scope: string | null;
    assets: string | null;
    sections: string[];
    deliveryApps: string[];
    styleCategory: string | null;
    styleSpecific: string | null;
    businessName: string;
    location: string;
  };
  step: number;
  isGenerating: boolean;
  messages: ChatMessage[];
}
