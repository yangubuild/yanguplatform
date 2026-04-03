/**
 * Emenu Data Model — Phase 1
 * Rich menu item schema supporting restaurant-grade data.
 */

export interface DietaryTag {
  key: string;
  label: string;
  icon: string; // emoji
}

export const DIETARY_TAGS: DietaryTag[] = [
  { key: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { key: "vegan", label: "Vegan", icon: "🌱" },
  { key: "spicy", label: "Spicy", icon: "🌶️" },
  { key: "gluten_free", label: "Gluten Free", icon: "🚫🌾" },
  { key: "halal", label: "Halal", icon: "☪️" },
  { key: "dairy_free", label: "Dairy Free", icon: "🥛" },
  { key: "nut_free", label: "Nut Free", icon: "🥜" },
  { key: "keto", label: "Keto", icon: "🥑" },
  { key: "organic", label: "Organic", icon: "🌿" },
];

export interface ItemBadge {
  key: string;
  label: string;
  color: string; // tailwind color class suffix
}

export const ITEM_BADGES: ItemBadge[] = [
  { key: "popular", label: "Popular", color: "amber" },
  { key: "new", label: "New", color: "emerald" },
  { key: "chef_special", label: "Chef's Special", color: "violet" },
  { key: "best_seller", label: "Best Seller", color: "rose" },
  { key: "limited", label: "Limited Time", color: "orange" },
  { key: "seasonal", label: "Seasonal", color: "teal" },
];

export interface MenuItemModifier {
  name: string;
  price_add: string; // e.g. "2000" in smallest currency unit or formatted
}

export interface MenuItemPortionSize {
  label: string; // e.g. "Small", "Regular", "Large"
  price: string;
}

export interface EmenuItem {
  name: string;
  description?: string;
  full_description?: string;
  price: string;
  sale_price?: string;
  image_url?: string;
  dietary_tags?: string[]; // keys from DIETARY_TAGS
  badges?: string[]; // keys from ITEM_BADGES
  portion_sizes?: MenuItemPortionSize[];
  modifiers?: MenuItemModifier[];
  is_available?: boolean;
  sort_order?: number;
}

export interface EmenuCategory {
  name: string;
  description?: string;
  image_url?: string;
  items: EmenuItem[];
  _hidden?: boolean;
}

export interface EmenuMenuSchema {
  heading: string;
  categories: EmenuCategory[];
  layout_style: "grid" | "list";
  currency: string;
  currency_symbol: string;
  show_images: boolean;
  show_badges: boolean;
  show_dietary: boolean;
  columns_desktop: number;
  columns_mobile: number;
  card_style: "rounded" | "flat" | "shadow";
}

/** Complexity classification for template selection */
export type MenuComplexity = "simple" | "complex" | "reservation";

/** Reservation form schema for fine dining / hotel menus */
export interface ReservationFormSchema {
  heading: string;
  description?: string;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "email" | "tel" | "number" | "date" | "time" | "select";
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }>;
  submit_label: string;
}

/** Testimonial item for reservation-style menus */
export interface TestimonialItem {
  quote: string;
  author: string;
  rating?: number;
  avatar_url?: string;
}

/** Gallery item for restaurant ambiance/food */
export interface GalleryItem {
  image_url: string;
  caption?: string;
}

/** About/story section */
export interface RestaurantStory {
  heading: string;
  description: string;
  image_url?: string;
  established_year?: string;
}

/** Food category fallback images (used when no image is uploaded) */
export const FOOD_CATEGORY_PLACEHOLDERS: Record<string, string> = {
  default: "🍽️",
  appetizers: "🥗",
  salads: "🥬",
  soups: "🍲",
  main_courses: "🥩",
  grilled: "🔥",
  seafood: "🦐",
  pasta: "🍝",
  pizza: "🍕",
  burgers: "🍔",
  sandwiches: "🥪",
  rice: "🍚",
  noodles: "🍜",
  desserts: "🍰",
  ice_cream: "🍦",
  beverages: "🥤",
  coffee: "☕",
  tea: "🍵",
  cocktails: "🍹",
  juice: "🧃",
  smoothies: "🫐",
  breakfast: "🥞",
  kids: "👶",
  sides: "🍟",
};
