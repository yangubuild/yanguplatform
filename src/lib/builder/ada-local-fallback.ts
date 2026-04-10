/**
 * Local deterministic fallback for ADA when the AI gateway is unavailable (402/429).
 * Parses user intent from plain text and returns an AdaMutationPlan.
 */
import type { AdaMutationPlan } from "./builder-ai-service";

interface ParsedPageContext {
  itemNames: string[];
  categoryNames: string[];
}

/**
 * Attempt to parse a user message into a mutation plan using keyword matching.
 * Returns null if the intent is too ambiguous for local handling.
 */
export function parseLocalIntent(
  userMessage: string,
  pageContext: ParsedPageContext
): AdaMutationPlan | null {
  const msg = userMessage.toLowerCase().trim();

  // 1. Change background / page color
  const colorMatch = tryParseColorIntent(msg);
  if (colorMatch) return colorMatch;

  // 2. Update WhatsApp / contact info
  const contactMatch = tryParseContactIntent(msg);
  if (contactMatch) return contactMatch;

  // 3. Change price of existing item
  const priceMatch = tryParsePriceChange(msg, pageContext);
  if (priceMatch) return priceMatch;

  // 4. Rename existing item or category
  const renameMatch = tryParseRename(msg, pageContext);
  if (renameMatch) return renameMatch;

  // 5. Add a new item with price
  const addMatch = tryParseAddItem(msg);
  if (addMatch) return addMatch;

  return null;
}

/**
 * Build a natural reply for a locally-executed plan (no markdown).
 */
export function buildLocalReply(plan: AdaMutationPlan): string {
  const changes = plan.changes || {};
  switch (plan.action) {
    case "update_color":
      return changes.backgroundColor
        ? `Done, I changed the background color to ${changes.backgroundColor}.`
        : `Done, I updated the text color to ${changes.textColor}.`;
    case "update_contact": {
      const fields = Object.keys(changes).join(", ");
      return `Done, I updated ${fields} in the contact section.`;
    }
    case "update_item": {
      if (changes.price && !changes.title) {
        return `Done, I changed the price of ${plan.target?.itemName} to ${changes.price}.`;
      }
      if (changes.title && !changes.price) {
        return `Done, I renamed ${plan.target?.itemName} to ${changes.title}.`;
      }
      return `Done, I updated ${plan.target?.itemName}.`;
    }
    case "add_item":
      return `Done, I added ${changes.title} at ${changes.price}.`;
    default:
      return "Done, the change has been applied.";
  }
}

// ─── Intent parsers ─────────────────────────────────────────────

function tryParseColorIntent(msg: string): AdaMutationPlan | null {
  // "change background to red", "make the page background #1a1a2e", "set background color to dark blue"
  const bgMatch = msg.match(
    /(?:change|set|make|update)\s+(?:the\s+)?(?:page\s+)?(?:background|bg)\s+(?:color\s+)?(?:to\s+)?(.+)/i
  );
  if (bgMatch) {
    const color = bgMatch[1].trim().replace(/[.!]+$/, "").trim();
    if (color) {
      return {
        action: "update_color",
        target: { section: "page" },
        changes: { backgroundColor: resolveColorName(color) },
      };
    }
  }

  // "change text color to white"
  const textColorMatch = msg.match(
    /(?:change|set|make|update)\s+(?:the\s+)?(?:text|font)\s+color\s+(?:to\s+)?(.+)/i
  );
  if (textColorMatch) {
    const color = textColorMatch[1].trim().replace(/[.!]+$/, "").trim();
    if (color) {
      return {
        action: "update_color",
        target: { section: "page" },
        changes: { textColor: resolveColorName(color) },
      };
    }
  }

  return null;
}

function tryParseContactIntent(msg: string): AdaMutationPlan | null {
  const changes: Record<string, string> = {};

  // WhatsApp
  const waMatch = msg.match(
    /(?:change|set|update|make)\s+(?:the\s+)?(?:whatsapp|wa)\s+(?:number\s+)?(?:to\s+)?([+\d][\d\s\-().]+)/i
  );
  if (waMatch) changes.whatsapp = waMatch[1].trim();

  // Direct whatsapp pattern
  if (!changes.whatsapp) {
    const waAlt = msg.match(/whatsapp\s*(?:to|:)\s*([+\d][\d\s\-().]+)/i);
    if (waAlt) changes.whatsapp = waAlt[1].trim();
  }

  // Phone
  const phoneMatch = msg.match(
    /(?:change|set|update)\s+(?:the\s+)?(?:phone|tel|telephone)\s+(?:number\s+)?(?:to\s+)?([+\d][\d\s\-().]+)/i
  );
  if (phoneMatch) changes.phone = phoneMatch[1].trim();

  // Email
  const emailMatch = msg.match(
    /(?:change|set|update)\s+(?:the\s+)?email\s+(?:to\s+)?([\w.+\-]+@[\w.\-]+\.\w+)/i
  );
  if (emailMatch) changes.email = emailMatch[1].trim();

  // Address
  const addressMatch = msg.match(
    /(?:change|set|update)\s+(?:the\s+)?address\s+to\s+(.+)/i
  );
  if (addressMatch) changes.address = addressMatch[1].trim().replace(/[.!]+$/, "").trim();

  if (Object.keys(changes).length > 0) {
    return { action: "update_contact", changes };
  }
  return null;
}

function tryParsePriceChange(msg: string, ctx: ParsedPageContext): AdaMutationPlan | null {
  // "change BBQ Wings price to $18", "set smash burger price to $20"
  const priceChange = msg.match(
    /(?:change|set|update|make)\s+(?:the\s+)?(.+?)\s+price\s+(?:to\s+)?([$€£¥₹₦]?\s?[\d,.]+)/i
  );
  if (priceChange) {
    const rawName = priceChange[1].trim();
    const newPrice = priceChange[2].trim();
    const match = fuzzyMatchName(rawName, ctx.itemNames);
    if (match) {
      return {
        action: "update_item",
        target: { itemName: match },
        changes: { price: newPrice.startsWith("$") ? newPrice : `$${newPrice}` },
      };
    }
    // No match but clear intent
    return {
      action: "update_item",
      target: { itemName: rawName },
      changes: { price: newPrice.startsWith("$") ? newPrice : `$${newPrice}` },
    };
  }

  // "price of X to Y"
  const priceOf = msg.match(
    /price\s+(?:of\s+)?(.+?)\s+(?:to|=)\s+([$€£¥₹₦]?\s?[\d,.]+)/i
  );
  if (priceOf) {
    const rawName = priceOf[1].trim();
    const newPrice = priceOf[2].trim();
    const match = fuzzyMatchName(rawName, ctx.itemNames);
    return {
      action: "update_item",
      target: { itemName: match || rawName },
      changes: { price: newPrice.startsWith("$") ? newPrice : `$${newPrice}` },
    };
  }

  return null;
}

function tryParseRename(msg: string, ctx: ParsedPageContext): AdaMutationPlan | null {
  // "rename BBQ Wings to Grilled Wings", "change name of Smash Burger to Classic Burger"
  const renameMatch = msg.match(
    /(?:rename|change\s+(?:the\s+)?name\s+of)\s+(.+?)\s+to\s+(.+)/i
  );
  if (renameMatch) {
    const oldName = renameMatch[1].trim().replace(/^["']|["']$/g, "");
    const newName = renameMatch[2].trim().replace(/^["']|["']$/g, "").replace(/[.!]+$/, "").trim();
    const isCategory = msg.includes("category") || msg.includes("section");

    // Try matching against known names
    const allNames = [...ctx.itemNames, ...ctx.categoryNames];
    const match = fuzzyMatchName(oldName, allNames);

    if (isCategory) {
      return {
        action: "update_item",
        target: { itemName: match || oldName, section: "category" },
        changes: { title: newName },
      };
    }
    return {
      action: "update_item",
      target: { itemName: match || oldName },
      changes: { title: newName },
    };
  }

  return null;
}

function tryParseAddItem(msg: string): AdaMutationPlan | null {
  // "add Jollof Rice at $12", "add new item Tropical Juice for $8"
  const addMatch = msg.match(
    /(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:item\s+)?(.+?)\s+(?:at|for|price|priced\s+at|@)\s+([$€£¥₹₦]?\s?[\d,.]+)/i
  );
  if (addMatch) {
    const title = addMatch[1].trim().replace(/^["']|["']$/g, "");
    const price = addMatch[2].trim();
    return {
      action: "add_item",
      changes: {
        title,
        price: price.startsWith("$") ? price : `$${price}`,
      },
    };
  }

  // "add Garlic Bread $7"
  const addSimple = msg.match(
    /(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:item\s+)?(.+?)\s+([$€£¥₹₦]\s?[\d,.]+)/i
  );
  if (addSimple) {
    const title = addSimple[1].trim().replace(/^["']|["']$/g, "");
    const price = addSimple[2].trim();
    return {
      action: "add_item",
      changes: { title, price },
    };
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────

function fuzzyMatchName(query: string, names: string[]): string | null {
  const q = query.toLowerCase().trim();
  // Exact match
  const exact = names.find((n) => n.toLowerCase() === q);
  if (exact) return exact;
  // Includes match
  const includes = names.find(
    (n) => n.toLowerCase().includes(q) || q.includes(n.toLowerCase())
  );
  if (includes) return includes;
  return null;
}

const COLOR_MAP: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#e53e3e",
  blue: "#3182ce",
  green: "#38a169",
  yellow: "#ecc94b",
  orange: "#ed8936",
  purple: "#805ad5",
  pink: "#ed64a6",
  gray: "#718096",
  grey: "#718096",
  "dark blue": "#1a365d",
  "dark green": "#1c4532",
  "dark red": "#742a2a",
  navy: "#1a2744",
  teal: "#2c7a7b",
  coral: "#ff6b6b",
  maroon: "#742a2a",
  beige: "#f5f0e1",
  cream: "#fffdd0",
  "light gray": "#e2e8f0",
  "light grey": "#e2e8f0",
};

function resolveColorName(input: string): string {
  const lower = input.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // If it looks like a hex/rgb/hsl already, pass through
  if (/^(#|rgb|hsl)/.test(lower)) return input;
  // Best effort — return as-is (CSS named color)
  return input;
}

/**
 * Extract item and category names from the current HTML for fuzzy matching.
 */
export function extractPageContext(html: string): ParsedPageContext {
  if (typeof DOMParser === "undefined") return { itemNames: [], categoryNames: [] };
  const doc = new DOMParser().parseFromString(html, "text/html");

  const itemNames: string[] = [];
  const categoryNames: string[] = [];

  // Items: look for card-like structures with prices
  doc.querySelectorAll("h3, h4, [class*='title'], [class*='name']").forEach((el) => {
    const text = (el as HTMLElement).textContent?.trim();
    if (text && text.length > 1 && text.length < 80) {
      itemNames.push(text);
    }
  });

  // Categories: typically h2s or tab labels
  doc.querySelectorAll("h2, [class*='category'], [class*='tab'], [role='tab']").forEach((el) => {
    const text = (el as HTMLElement).textContent?.trim();
    if (text && text.length > 1 && text.length < 60) {
      categoryNames.push(text);
    }
  });

  return { itemNames, categoryNames };
}
