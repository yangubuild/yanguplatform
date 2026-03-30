/**
 * Visual preview styles for each system theme.
 * These generate rich CSS-based preview cards instead of placeholder boxes.
 */

export interface ThemePreviewStyle {
  /** CSS gradient for card background */
  gradient: string;
  /** Accent color for decorative elements */
  accent: string;
  /** Secondary decorative color */
  secondary: string;
  /** Icon/emoji to show as decorative element */
  icon: string;
  /** Sample headline text */
  sampleText: string;
  /** Sample subtext */
  sampleSub: string;
  /** Pattern type for visual variety */
  pattern: "circles" | "lines" | "dots" | "blocks" | "wave" | "minimal" | "diagonal" | "grid";
}

export const THEME_PREVIEW_STYLES: Record<string, ThemePreviewStyle> = {
  new_year: {
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    accent: "#ffd700", secondary: "#c0c0c0", icon: "✨",
    sampleText: "HAPPY NEW YEAR", sampleSub: "Fresh starts begin here",
    pattern: "circles",
  },
  admire: {
    gradient: "linear-gradient(135deg, #2d1b2e 0%, #4a2040 50%, #6b3a5c 100%)",
    accent: "#e8b4b8", secondary: "#d4a0a7", icon: "♡",
    sampleText: "ADMIRE", sampleSub: "Celebrate what matters",
    pattern: "minimal",
  },
  balance: {
    gradient: "linear-gradient(135deg, #2d3a2d 0%, #3d4a3d 50%, #4a5a4a 100%)",
    accent: "#a3b18a", secondary: "#dad7cd", icon: "☯",
    sampleText: "FIND BALANCE", sampleSub: "Harmony in everything",
    pattern: "lines",
  },
  bloom: {
    gradient: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)",
    accent: "#e91e63", secondary: "#4caf50", icon: "🌸",
    sampleText: "BLOOM", sampleSub: "Growth & beauty",
    pattern: "circles",
  },
  bold_tech: {
    gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)",
    accent: "#00e5ff", secondary: "#7c4dff", icon: "⚡",
    sampleText: "BOLD TECH", sampleSub: "Future forward",
    pattern: "grid",
  },
  bold_words: {
    gradient: "linear-gradient(135deg, #111 0%, #222 50%, #111 100%)",
    accent: "#ffffff", secondary: "#888888", icon: "A",
    sampleText: "SPEAK LOUD", sampleSub: "Words that matter",
    pattern: "minimal",
  },
  border: {
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
    accent: "#ffffff", secondary: "#666666", icon: "▢",
    sampleText: "FRAMED", sampleSub: "Clean structure",
    pattern: "blocks",
  },
  bubbles: {
    gradient: "linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #fce4ec 100%)",
    accent: "#ff7043", secondary: "#42a5f5", icon: "●",
    sampleText: "PLAYFUL", sampleSub: "Fun & friendly",
    pattern: "circles",
  },
  care: {
    gradient: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)",
    accent: "#e65100", secondary: "#f57c00", icon: "❤",
    sampleText: "WE CARE", sampleSub: "With compassion",
    pattern: "wave",
  },
  carousels: {
    gradient: "linear-gradient(135deg, #263238 0%, #37474f 50%, #455a64 100%)",
    accent: "#80cbc4", secondary: "#b2dfdb", icon: "⟩",
    sampleText: "SWIPE →", sampleSub: "Multi-slide stories",
    pattern: "blocks",
  },
  chapter: {
    gradient: "linear-gradient(135deg, #3e2723 0%, #4e342e 50%, #5d4037 100%)",
    accent: "#d7ccc8", secondary: "#bcaaa4", icon: "📖",
    sampleText: "CHAPTER ONE", sampleSub: "Your story begins",
    pattern: "lines",
  },
  christmas: {
    gradient: "linear-gradient(135deg, #1b5e20 0%, #b71c1c 50%, #1b5e20 100%)",
    accent: "#ffd700", secondary: "#ffffff", icon: "🎄",
    sampleText: "MERRY & BRIGHT", sampleSub: "Holiday cheer",
    pattern: "circles",
  },
  classic: {
    gradient: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)",
    accent: "#ffd54f", secondary: "#fff8e1", icon: "⚜",
    sampleText: "TIMELESS", sampleSub: "Classic elegance",
    pattern: "lines",
  },
  coffee: {
    gradient: "linear-gradient(135deg, #3e2723 0%, #4e342e 50%, #6d4c41 100%)",
    accent: "#d7ccc8", secondary: "#a1887f", icon: "☕",
    sampleText: "COFFEE TIME", sampleSub: "Warm & cozy vibes",
    pattern: "dots",
  },
  cyber: {
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a1a 100%)",
    accent: "#00ff41", secondary: "#b388ff", icon: "⬡",
    sampleText: "CYBER", sampleSub: "Digital futures",
    pattern: "grid",
  },
  dashed: {
    gradient: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)",
    accent: "#333333", secondary: "#ff5722", icon: "---",
    sampleText: "SKETCHED", sampleSub: "Hand-drawn feel",
    pattern: "lines",
  },
  easter: {
    gradient: "linear-gradient(135deg, #fff9c4 0%, #f8bbd0 50%, #e1bee7 100%)",
    accent: "#7b1fa2", secondary: "#4caf50", icon: "🥚",
    sampleText: "HAPPY EASTER", sampleSub: "Spring celebration",
    pattern: "dots",
  },
  elegance: {
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
    accent: "#d4af37", secondary: "#f5f5dc", icon: "◆",
    sampleText: "ELEGANCE", sampleSub: "Luxury refined",
    pattern: "minimal",
  },
  era: {
    gradient: "linear-gradient(135deg, #4a3728 0%, #5d4e37 50%, #8d6e63 100%)",
    accent: "#ffcc80", secondary: "#d7ccc8", icon: "◎",
    sampleText: "RETRO ERA", sampleSub: "Vintage nostalgia",
    pattern: "dots",
  },
  fonts: {
    gradient: "linear-gradient(135deg, #212121 0%, #424242 50%, #212121 100%)",
    accent: "#ffffff", secondary: "#ff9800", icon: "Aa",
    sampleText: "TYPOGRAPHY", sampleSub: "Font showcase",
    pattern: "minimal",
  },
  fresh_pop: {
    gradient: "linear-gradient(135deg, #ff1744 0%, #ff9100 50%, #ffea00 100%)",
    accent: "#ffffff", secondary: "#000000", icon: "★",
    sampleText: "POP!", sampleSub: "Bold & vibrant",
    pattern: "blocks",
  },
  influencer: {
    gradient: "linear-gradient(135deg, #ff6f00 0%, #ff8f00 50%, #ffa000 100%)",
    accent: "#ffffff", secondary: "#fff8e1", icon: "📸",
    sampleText: "INFLUENCE", sampleSub: "Personal brand",
    pattern: "wave",
  },
  influencer_captions: {
    gradient: "linear-gradient(135deg, #37474f 0%, #455a64 50%, #546e7a 100%)",
    accent: "#ffffff", secondary: "#b0bec5", icon: "💬",
    sampleText: "CAPTION THIS", sampleSub: "Authentic moments",
    pattern: "minimal",
  },
  interface: {
    gradient: "linear-gradient(135deg, #eceff1 0%, #cfd8dc 50%, #b0bec5 100%)",
    accent: "#1565c0", secondary: "#42a5f5", icon: "☐",
    sampleText: "UI CLEAN", sampleSub: "App-like design",
    pattern: "grid",
  },
  meme: {
    gradient: "linear-gradient(135deg, #fff176 0%, #ffee58 50%, #fdd835 100%)",
    accent: "#000000", secondary: "#f44336", icon: "😂",
    sampleText: "MEME TIME", sampleSub: "Relatable content",
    pattern: "blocks",
  },
  minimalist: {
    gradient: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #ffffff 100%)",
    accent: "#212121", secondary: "#9e9e9e", icon: "·",
    sampleText: "LESS IS MORE", sampleSub: "Simple & clean",
    pattern: "minimal",
  },
  modern: {
    gradient: "linear-gradient(135deg, #263238 0%, #37474f 50%, #455a64 100%)",
    accent: "#ff7043", secondary: "#ffffff", icon: "◇",
    sampleText: "MODERN", sampleSub: "Contemporary style",
    pattern: "diagonal",
  },
  natural: {
    gradient: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
    accent: "#a5d6a7", secondary: "#c8e6c9", icon: "🌿",
    sampleText: "NATURAL", sampleSub: "Organic & earthy",
    pattern: "wave",
  },
  notes: {
    gradient: "linear-gradient(135deg, #fff9c4 0%, #fff176 50%, #ffee58 100%)",
    accent: "#5d4037", secondary: "#795548", icon: "📝",
    sampleText: "NOTE TO SELF", sampleSub: "Personal touch",
    pattern: "lines",
  },
  picnic: {
    gradient: "linear-gradient(135deg, #ffcdd2 0%, #ffffff 25%, #ffcdd2 50%, #ffffff 75%)",
    accent: "#c62828", secondary: "#2e7d32", icon: "🧺",
    sampleText: "PICNIC DAY", sampleSub: "Outdoor fun",
    pattern: "blocks",
  },
  plus: {
    gradient: "linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%)",
    accent: "#283593", secondary: "#5c6bc0", icon: "+",
    sampleText: "PLUS MORE", sampleSub: "Structured & bold",
    pattern: "grid",
  },
  pride: {
    gradient: "linear-gradient(180deg, #e40303 0%, #ff8c00 20%, #ffed00 40%, #008026 60%, #004dff 80%, #750787 100%)",
    accent: "#ffffff", secondary: "#000000", icon: "🏳️‍🌈",
    sampleText: "PRIDE", sampleSub: "Love is love",
    pattern: "wave",
  },
  refine: {
    gradient: "linear-gradient(135deg, #37474f 0%, #455a64 50%, #546e7a 100%)",
    accent: "#b0bec5", secondary: "#eceff1", icon: "◈",
    sampleText: "REFINED", sampleSub: "Polished detail",
    pattern: "minimal",
  },
  save: {
    gradient: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)",
    accent: "#0d47a1", secondary: "#1565c0", icon: "🔖",
    sampleText: "SAVE THIS", sampleSub: "Bookmark-worthy tips",
    pattern: "blocks",
  },
  simply_image: {
    gradient: "linear-gradient(135deg, #616161 0%, #757575 50%, #9e9e9e 100%)",
    accent: "#ffffff", secondary: "#e0e0e0", icon: "🖼",
    sampleText: "FULL IMAGE", sampleSub: "Photo-first",
    pattern: "minimal",
  },
  sleek: {
    gradient: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #2d2d4a 100%)",
    accent: "#7c4dff", secondary: "#448aff", icon: "◎",
    sampleText: "SLEEK", sampleSub: "Premium glass feel",
    pattern: "diagonal",
  },
  spice: {
    gradient: "linear-gradient(135deg, #bf360c 0%, #e64a19 50%, #ff6e40 100%)",
    accent: "#fff3e0", secondary: "#ffccbc", icon: "🌶",
    sampleText: "SPICE IT UP", sampleSub: "Bold & warm",
    pattern: "wave",
  },
  spooky: {
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4a148c 100%)",
    accent: "#ff6d00", secondary: "#e040fb", icon: "👻",
    sampleText: "SPOOKY", sampleSub: "Eerie & fun",
    pattern: "dots",
  },
  st_patricks: {
    gradient: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #4caf50 100%)",
    accent: "#ffd700", secondary: "#ffffff", icon: "☘",
    sampleText: "LUCKY DAY", sampleSub: "Irish celebration",
    pattern: "circles",
  },
  stardust: {
    gradient: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #1a237e 100%)",
    accent: "#e0e0e0", secondary: "#b0bec5", icon: "✦",
    sampleText: "STARDUST", sampleSub: "Cosmic sparkle",
    pattern: "dots",
  },
  striking: {
    gradient: "linear-gradient(135deg, #d50000 0%, #ff1744 50%, #ff5252 100%)",
    accent: "#ffffff", secondary: "#000000", icon: "⚡",
    sampleText: "STRIKING", sampleSub: "Maximum impact",
    pattern: "diagonal",
  },
  threads: {
    gradient: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #eeeeee 100%)",
    accent: "#000000", secondary: "#757575", icon: "@",
    sampleText: "THREAD", sampleSub: "Text-first social",
    pattern: "minimal",
  },
  ticket: {
    gradient: "linear-gradient(135deg, #ff6f00 0%, #ff8f00 50%, #ffa000 100%)",
    accent: "#ffffff", secondary: "#3e2723", icon: "🎫",
    sampleText: "ADMIT ONE", sampleSub: "Event style",
    pattern: "lines",
  },
  triad: {
    gradient: "linear-gradient(135deg, #1565c0 0%, #e91e63 50%, #ffc107 100%)",
    accent: "#ffffff", secondary: "#000000", icon: "△",
    sampleText: "TRIAD", sampleSub: "Three-color harmony",
    pattern: "blocks",
  },
  tropical: {
    gradient: "linear-gradient(135deg, #00695c 0%, #00897b 50%, #26a69a 100%)",
    accent: "#ff7043", secondary: "#ffcc02", icon: "🌴",
    sampleText: "TROPICAL", sampleSub: "Beach vibes",
    pattern: "wave",
  },
  tweet: {
    gradient: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 50%, #e3f2fd 100%)",
    accent: "#1da1f2", secondary: "#14171a", icon: "𝕏",
    sampleText: "QUOTED", sampleSub: "Social proof style",
    pattern: "minimal",
  },
  voyage: {
    gradient: "linear-gradient(135deg, #01579b 0%, #0277bd 50%, #0288d1 100%)",
    accent: "#fff9c4", secondary: "#ffffff", icon: "✈",
    sampleText: "VOYAGE", sampleSub: "Adventure awaits",
    pattern: "wave",
  },
  webinar: {
    gradient: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)",
    accent: "#ff7043", secondary: "#ffffff", icon: "🎙",
    sampleText: "JOIN LIVE", sampleSub: "Webinar promo",
    pattern: "blocks",
  },
  wilderness: {
    gradient: "linear-gradient(135deg, #1b3a1b 0%, #2d5a2d 50%, #3a6b3a 100%)",
    accent: "#a1887f", secondary: "#d7ccc8", icon: "🏕",
    sampleText: "WILDERNESS", sampleSub: "Into the wild",
    pattern: "wave",
  },
};

export function getThemePreview(key: string): ThemePreviewStyle {
  return THEME_PREVIEW_STYLES[key] || {
    gradient: "linear-gradient(135deg, #333 0%, #555 100%)",
    accent: "#ffffff", secondary: "#999999", icon: "◆",
    sampleText: "CUSTOM", sampleSub: "Your theme",
    pattern: "minimal" as const,
  };
}
