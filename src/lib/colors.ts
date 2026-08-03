// Color theory and matching logic

export const COLOR_FAMILIES: Record<string, string[]> = {
  red: ["red", "crimson", "scarlet", "burgundy", "maroon", "wine", "cherry", "rust", "brick", "vermillion", "ruby", "cardinal", "garnet"],
  orange: ["orange", "coral", "peach", "tangerine", "amber", "burnt orange", "terracotta", "apricot", "copper", "sienna", "papaya"],
  yellow: ["yellow", "gold", "mustard", "lemon", "cream", "canary", "saffron", "honey", "buttercup", "champagne", "maize"],
  green: ["green", "olive", "sage", "emerald", "forest", "mint", "lime", "teal", "army green", "moss", "hunter green", "jade", "seafoam", "pistachio", "fern", "celadon", "eucalyptus", "avocado"],
  blue: ["blue", "navy", "royal blue", "sky blue", "cobalt", "indigo", "denim", "powder blue", "steel blue", "ice blue", "cornflower", "azure", "cerulean", "periwinkle", "midnight blue", "baby blue", "ocean blue"],
  purple: ["purple", "lavender", "violet", "plum", "mauve", "lilac", "eggplant", "amethyst", "orchid", "grape", "mulberry", "wine purple"],
  pink: ["pink", "magenta", "rose", "blush", "fuchsia", "salmon", "hot pink", "dusty pink", "bubblegum", "mauve pink", "flamingo", "millennial pink", "ballet pink"],
  brown: ["brown", "tan", "beige", "khaki", "camel", "chocolate", "coffee", "taupe", "mocha", "espresso", "sand", "chestnut", "cinnamon", "walnut", "toffee", "hazel", "cocoa", "saddle brown", "sepia"],
  black: ["black", "charcoal", "jet black", "onyx", "obsidian", "coal", "off-black"],
  white: ["white", "ivory", "off-white", "cream white", "snow", "pearl", "eggshell", "alabaster", "bone", "chalk"],
  gray: ["gray", "grey", "silver", "slate", "ash", "heather", "stone", "pewter", "dove", "iron", "graphite", "smoke", "cement", "fog", "lead", "steel", "cool gray", "warm gray"],
};

export const COLOR_PAIRINGS: Record<string, string[]> = {
  red: ["black", "white", "gray", "navy", "beige", "denim", "charcoal"],
  orange: ["navy", "blue", "white", "brown", "black", "olive", "denim"],
  yellow: ["navy", "gray", "black", "white", "denim", "brown", "charcoal"],
  green: ["white", "black", "brown", "beige", "navy", "gray", "khaki", "cream"],
  blue: ["white", "gray", "brown", "beige", "black", "khaki", "cream", "tan"],
  purple: ["white", "gray", "black", "silver", "blush", "navy", "cream"],
  pink: ["gray", "navy", "white", "black", "denim", "beige", "charcoal"],
  brown: ["white", "blue", "green", "beige", "cream", "navy", "denim"],
  black: ["white", "red", "pink", "blue", "gray", "beige", "any"],
  white: ["any", "navy", "black", "blue", "red", "gray"],
  gray: ["any", "blue", "pink", "white", "black", "red", "navy"],
};

export function getColorFamily(color: string): string {
  const lower = color.toLowerCase();
  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    if (colors.some((c) => lower.includes(c) || c.includes(lower))) {
      return family;
    }
  }
  return "other";
}

export function getMatchingColors(color: string): string[] {
  const family = getColorFamily(color);
  return COLOR_PAIRINGS[family] || ["white", "black", "gray"];
}

export function areColorsCompatible(color1: string, color2: string): boolean {
  const family1 = getColorFamily(color1);
  const family2 = getColorFamily(color2);

  if (family1 === family2) return true;
  if (family1 === "black" || family1 === "white" || family1 === "gray") return true;
  if (family2 === "black" || family2 === "white" || family2 === "gray") return true;

  const pairings = COLOR_PAIRINGS[family1];
  if (!pairings) return false;
  if (pairings.includes("any")) return true;

  return pairings.some((p) => {
    const pFamily = getColorFamily(p);
    return pFamily === family2;
  });
}

export const PREDEFINED_COLORS = [
  "Black", "White", "Navy", "Gray", "Beige", "Brown", "Red", "Blue",
  "Green", "Yellow", "Orange", "Pink", "Purple", "Olive", "Burgundy",
  "Teal", "Cream", "Khaki", "Denim", "Charcoal", "Camel", "Tan",
  "Coral", "Maroon", "Sage", "Mint", "Lavender", "Rust", "Taupe",
  "Forest Green", "Sky Blue", "Mustard", "Sand", "Ivory", "Slate",
  "Emerald", "Mauve", "Terracotta", "Cobalt", "Champagne",
];

export const CATEGORIES = [
  { value: "top", label: "👕 Top" },
  { value: "bottom", label: "👖 Bottom" },
  { value: "shoes", label: "👟 Shoes" },
  { value: "outerwear", label: "🧥 Outerwear" },
  { value: "accessory", label: "🎒 Accessory" },
];

export const SUBCATEGORIES: Record<string, string[]> = {
  top: ["T-Shirt", "Shirt", "Polo", "Sweater", "Hoodie", "Tank Top", "Henley", "Turtleneck"],
  bottom: ["Jeans", "Chinos", "Shorts", "Dress Pants", "Joggers", "Cargo Pants", "Sweatpants", "Wide Leg Pants"],
  shoes: ["Sneakers", "Boots", "Dress Shoes", "Sandals", "Loafers", "Running Shoes", "Slides", "Tsinelas"],
  outerwear: ["Jacket", "Coat", "Blazer", "Vest", "Windbreaker", "Parka", "Cardigan", "Denim Jacket", "Bomber Jacket"],
  accessory: ["Watch", "Hat", "Belt", "Scarf", "Sunglasses", "Bag", "Tie", "Cap", "Crossbody Bag", "Tote Bag", "Bracelet", "Ring", "Necklace", "Backpack"],
};

export const SUBCATEGORIES_FEMALE: Record<string, string[]> = {
  top: ["T-Shirt", "Shirt", "Blouse", "Sweater", "Hoodie", "Tank Top", "Crop Top", "Turtleneck"],
  bottom: ["Jeans", "Chinos", "Shorts", "Dress Pants", "Joggers", "Skirt", "Cargo Pants", "Wide Leg Pants"],
  shoes: ["Sneakers", "Boots", "Dress Shoes", "Sandals", "Loafers", "Heels", "Flats", "Slides"],
  outerwear: ["Jacket", "Coat", "Blazer", "Vest", "Windbreaker", "Cardigan", "Denim Jacket", "Bomber Jacket"],
  accessory: ["Watch", "Hat", "Belt", "Scarf", "Sunglasses", "Bag", "Cap", "Crossbody Bag", "Tote Bag", "Earrings", "Necklace", "Bracelet", "Ring"],
};

export const OCCASIONS = ["Casual", "Formal", "Business", "Sport", "Date Night", "Party", "Lakad", "Gala", "Church"];
export const SEASONS = ["Hot/Summer", "Rainy", "Cool/Ber Months", "All Seasons"];
export const PATTERNS = ["Solid", "Striped", "Plaid", "Floral", "Checkered", "Polka Dot", "Graphic", "Camo", "Tie-Dye"];

export const FIT_TYPES: Record<string, string[]> = {
  top: ["Regular", "Oversized", "Slim", "Relaxed", "Boxy"],
  bottom: ["Regular", "Skinny", "Slim", "Straight", "Baggy", "Wide Leg", "Relaxed", "Tapered"],
  outerwear: ["Regular", "Oversized", "Relaxed"],
};

// ── Style Presets ──────────────────────
export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  gender: "all" | "male" | "female";
  colorPalette: string[];
  preferredCategories: Record<string, string[]>;
  pinterestQuery: string;
  tiktokQuery: string;
  accessorySuggestions: string[];
  // What items define this style (for suggestion matching)
  keyPieces: { category: string; subcategory: string; colors: string[] }[];
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "streetwear", gender: "all",
    label: "Streetwear", emoji: "🔥",
    description: "Oversized fits, sneakers, graphic tees, cargo pants",
    colorPalette: ["black", "white", "gray", "green", "brown"],
    preferredCategories: {
      top: ["Hoodie", "T-Shirt", "Sweater"],
      bottom: ["Cargo Pants", "Joggers", "Wide Leg Pants", "Jeans"],
      shoes: ["Sneakers", "Boots"],
      outerwear: ["Bomber Jacket", "Windbreaker", "Denim Jacket"],
    },
    pinterestQuery: "streetwear outfit ideas men 2025",
    tiktokQuery: "streetwear outfit inspo",
    accessorySuggestions: ["Cap", "Crossbody Bag", "Watch", "Sunglasses"],
    keyPieces: [
      { category: "top", subcategory: "Hoodie", colors: ["Black", "Gray", "White"] },
      { category: "bottom", subcategory: "Cargo Pants", colors: ["Black", "Olive", "Khaki"] },
      { category: "shoes", subcategory: "Sneakers", colors: ["White", "Black"] },
      { category: "outerwear", subcategory: "Bomber Jacket", colors: ["Black", "Navy"] },
    ],
  },
  {
    id: "old-money", gender: "all",
    label: "Old Money", emoji: "💎",
    description: "Clean, preppy, neutral tones, quality basics",
    colorPalette: ["white", "brown", "blue", "gray", "black"],
    preferredCategories: {
      top: ["Polo", "Shirt", "Turtleneck"],
      bottom: ["Chinos", "Dress Pants", "Wide Leg Pants"],
      shoes: ["Loafers", "Dress Shoes"],
      outerwear: ["Blazer", "Cardigan", "Coat"],
    },
    pinterestQuery: "old money aesthetic outfit men 2025",
    tiktokQuery: "old money outfit inspo quiet luxury",
    accessorySuggestions: ["Watch", "Belt", "Sunglasses"],
    keyPieces: [
      { category: "top", subcategory: "Polo", colors: ["White", "Navy", "Beige"] },
      { category: "top", subcategory: "Shirt", colors: ["White", "Blue", "Cream"] },
      { category: "bottom", subcategory: "Chinos", colors: ["Beige", "Navy", "Cream"] },
      { category: "shoes", subcategory: "Loafers", colors: ["Brown", "Black"] },
      { category: "outerwear", subcategory: "Blazer", colors: ["Navy", "Beige", "Gray"] },
    ],
  },
  {
    id: "clean-girl", gender: "female",
    label: "Clean Girl", emoji: "✨",
    description: "Minimal, slicked back, neutral + earth tones",
    colorPalette: ["white", "brown", "black", "gray"],
    preferredCategories: {
      top: ["Tank Top", "Crop Top", "Blouse", "T-Shirt"],
      bottom: ["Wide Leg Pants", "Jeans", "Skirt"],
      shoes: ["Sneakers", "Flats", "Sandals", "Slides"],
      outerwear: ["Cardigan", "Blazer"],
    },
    pinterestQuery: "clean girl aesthetic outfit ideas",
    tiktokQuery: "clean girl outfit of the day",
    accessorySuggestions: ["Earrings", "Necklace", "Tote Bag", "Sunglasses"],
    keyPieces: [
      { category: "top", subcategory: "Tank Top", colors: ["White", "Beige"] },
      { category: "bottom", subcategory: "Wide Leg Pants", colors: ["Beige", "Black"] },
      { category: "shoes", subcategory: "Flats", colors: ["Black", "Nude"] },
    ],
  },
  {
    id: "minimalist", gender: "all",
    label: "Minimalist", emoji: "🤍",
    description: "Neutral palette, simple silhouettes, timeless",
    colorPalette: ["black", "white", "gray", "brown"],
    preferredCategories: {
      top: ["T-Shirt", "Shirt", "Turtleneck"],
      bottom: ["Jeans", "Chinos", "Dress Pants", "Wide Leg Pants"],
      shoes: ["Sneakers", "Loafers"],
      outerwear: ["Blazer", "Coat", "Cardigan"],
    },
    pinterestQuery: "minimalist outfit ideas capsule wardrobe",
    tiktokQuery: "minimalist fashion outfit inspo",
    accessorySuggestions: ["Watch", "Belt"],
    keyPieces: [
      { category: "top", subcategory: "T-Shirt", colors: ["White", "Black", "Gray"] },
      { category: "bottom", subcategory: "Chinos", colors: ["Black", "Gray", "Beige"] },
      { category: "shoes", subcategory: "Sneakers", colors: ["White"] },
    ],
  },
  {
    id: "y2k", gender: "female",
    label: "Y2K", emoji: "💿",
    description: "Bold colors, low-rise, butterfly tops, chunky shoes",
    colorPalette: ["pink", "blue", "purple", "white", "yellow"],
    preferredCategories: {
      top: ["Crop Top", "Tank Top", "T-Shirt", "Blouse"],
      bottom: ["Jeans", "Skirt", "Wide Leg Pants", "Shorts"],
      shoes: ["Sneakers", "Heels", "Slides"],
      outerwear: ["Cardigan", "Denim Jacket"],
    },
    pinterestQuery: "y2k outfit aesthetic 2025",
    tiktokQuery: "y2k outfit ideas fashion",
    accessorySuggestions: ["Sunglasses", "Earrings", "Crossbody Bag", "Bracelet", "Ring"],
    keyPieces: [
      { category: "top", subcategory: "Crop Top", colors: ["Pink", "Blue", "White"] },
      { category: "bottom", subcategory: "Skirt", colors: ["Denim", "Pink"] },
    ],
  },
  {
    id: "casual-pinoy", gender: "all",
    label: "Casual Pinoy", emoji: "🇵🇭",
    description: "Comfy, breathable, perfect for PH weather",
    colorPalette: ["white", "blue", "black", "gray", "brown"],
    preferredCategories: {
      top: ["T-Shirt", "Polo", "Tank Top", "Shirt"],
      bottom: ["Shorts", "Jeans", "Joggers", "Chinos"],
      shoes: ["Sneakers", "Slides", "Tsinelas", "Sandals"],
      outerwear: ["Windbreaker", "Denim Jacket"],
    },
    pinterestQuery: "casual pinoy outfit men everyday",
    tiktokQuery: "pinoy ootd casual outfit",
    accessorySuggestions: ["Cap", "Watch", "Crossbody Bag", "Sunglasses"],
    keyPieces: [
      { category: "top", subcategory: "T-Shirt", colors: ["White", "Black"] },
      { category: "bottom", subcategory: "Shorts", colors: ["Black", "Khaki"] },
      { category: "shoes", subcategory: "Slides", colors: ["Black"] },
    ],
  },
  {
    id: "smart-casual", gender: "all",
    label: "Smart Casual", emoji: "👔",
    description: "Polished but relaxed, office to dinner",
    colorPalette: ["blue", "white", "gray", "black", "brown"],
    preferredCategories: {
      top: ["Shirt", "Polo", "Henley"],
      bottom: ["Chinos", "Dress Pants", "Jeans"],
      shoes: ["Loafers", "Dress Shoes", "Sneakers"],
      outerwear: ["Blazer", "Cardigan", "Vest"],
    },
    pinterestQuery: "smart casual outfit 2025",
    tiktokQuery: "smart casual ootd work outfit",
    accessorySuggestions: ["Watch", "Belt", "Bag", "Tie"],
    keyPieces: [
      { category: "top", subcategory: "Shirt", colors: ["White", "Blue"] },
      { category: "bottom", subcategory: "Chinos", colors: ["Beige", "Navy"] },
      { category: "shoes", subcategory: "Loafers", colors: ["Brown", "Black"] },
    ],
  },
  {
    id: "athleisure", gender: "all",
    label: "Athleisure", emoji: "🏃",
    description: "Sporty comfort meets everyday style",
    colorPalette: ["black", "gray", "white", "blue", "green"],
    preferredCategories: {
      top: ["Hoodie", "T-Shirt", "Tank Top"],
      bottom: ["Joggers", "Shorts", "Sweatpants"],
      shoes: ["Sneakers", "Running Shoes"],
      outerwear: ["Windbreaker", "Vest"],
    },
    pinterestQuery: "athleisure outfit ideas sporty",
    tiktokQuery: "athleisure ootd gym to street",
    accessorySuggestions: ["Cap", "Watch", "Backpack"],
    keyPieces: [
      { category: "top", subcategory: "T-Shirt", colors: ["Black", "Gray"] },
      { category: "bottom", subcategory: "Joggers", colors: ["Black", "Gray"] },
      { category: "shoes", subcategory: "Running Shoes", colors: ["Black", "White"] },
    ],
  },
  {
    id: "dark-academia", gender: "all",
    label: "Dark Academia", emoji: "📚",
    description: "Scholarly, layered, earth-toned, vintage vibes",
    colorPalette: ["brown", "black", "gray", "white"],
    preferredCategories: {
      top: ["Shirt", "Turtleneck", "Sweater"],
      bottom: ["Dress Pants", "Chinos", "Wide Leg Pants"],
      shoes: ["Dress Shoes", "Boots", "Loafers"],
      outerwear: ["Blazer", "Coat", "Cardigan"],
    },
    pinterestQuery: "dark academia outfit aesthetic",
    tiktokQuery: "dark academia outfit inspo",
    accessorySuggestions: ["Watch", "Belt", "Scarf", "Bag"],
    keyPieces: [
      { category: "top", subcategory: "Turtleneck", colors: ["Black", "Brown", "Cream"] },
      { category: "bottom", subcategory: "Dress Pants", colors: ["Brown", "Black"] },
      { category: "outerwear", subcategory: "Blazer", colors: ["Brown", "Black"] },
    ],
  },
  {
    id: "grunge", gender: "all",
    label: "Grunge", emoji: "🎸",
    description: "Raw, edgy, distressed, layered flannel",
    colorPalette: ["black", "gray", "red", "brown"],
    preferredCategories: {
      top: ["T-Shirt", "Hoodie", "Henley"],
      bottom: ["Jeans", "Cargo Pants"],
      shoes: ["Boots", "Sneakers"],
      outerwear: ["Denim Jacket", "Jacket"],
    },
    pinterestQuery: "grunge outfit ideas men edgy",
    tiktokQuery: "grunge outfit inspo fashion",
    accessorySuggestions: ["Ring", "Bracelet", "Necklace"],
    keyPieces: [
      { category: "top", subcategory: "T-Shirt", colors: ["Black", "Gray"] },
      { category: "bottom", subcategory: "Jeans", colors: ["Black", "Denim"] },
      { category: "outerwear", subcategory: "Denim Jacket", colors: ["Denim", "Black"] },
    ],
  },
  {
    id: "hypebeast", gender: "male",
    label: "Hypebeast", emoji: "🏆",
    description: "Flex culture, branded, sneaker-centric",
    colorPalette: ["black", "white", "red", "blue"],
    preferredCategories: {
      top: ["T-Shirt", "Hoodie"],
      bottom: ["Joggers", "Cargo Pants", "Jeans"],
      shoes: ["Sneakers"],
      outerwear: ["Windbreaker", "Bomber Jacket"],
    },
    pinterestQuery: "hypebeast outfit ideas 2025 men",
    tiktokQuery: "hypebeast outfit sneaker flex",
    accessorySuggestions: ["Cap", "Crossbody Bag", "Sunglasses", "Watch"],
    keyPieces: [
      { category: "top", subcategory: "Hoodie", colors: ["Black", "White"] },
      { category: "shoes", subcategory: "Sneakers", colors: ["White", "Red"] },
    ],
  },
  {
    id: "techwear", gender: "male",
    label: "Techwear", emoji: "⚡",
    description: "Functional, futuristic, all-black utility",
    colorPalette: ["black", "gray"],
    preferredCategories: {
      top: ["T-Shirt", "Hoodie"],
      bottom: ["Cargo Pants", "Joggers"],
      shoes: ["Sneakers", "Boots"],
      outerwear: ["Windbreaker", "Jacket"],
    },
    pinterestQuery: "techwear outfit all black futuristic",
    tiktokQuery: "techwear outfit inspo cyberpunk",
    accessorySuggestions: ["Crossbody Bag", "Cap", "Belt"],
    keyPieces: [
      { category: "top", subcategory: "T-Shirt", colors: ["Black"] },
      { category: "bottom", subcategory: "Cargo Pants", colors: ["Black"] },
      { category: "outerwear", subcategory: "Windbreaker", colors: ["Black"] },
    ],
  },
  {
    id: "cottagecore", gender: "female",
    label: "Cottagecore", emoji: "🌸",
    description: "Flowy, floral, soft, rustic charm",
    colorPalette: ["white", "brown", "green", "pink"],
    preferredCategories: {
      top: ["Blouse", "T-Shirt"],
      bottom: ["Skirt", "Wide Leg Pants", "Jeans"],
      shoes: ["Sandals", "Flats", "Boots"],
      outerwear: ["Cardigan"],
    },
    pinterestQuery: "cottagecore outfit aesthetic women",
    tiktokQuery: "cottagecore outfit inspo romantic",
    accessorySuggestions: ["Tote Bag", "Necklace", "Scarf"],
    keyPieces: [
      { category: "top", subcategory: "Blouse", colors: ["White", "Cream"] },
      { category: "bottom", subcategory: "Skirt", colors: ["Brown", "Beige"] },
    ],
  },
];

// ── Accessory Suggestions ──────────────────────

export interface AccessorySuggestion {
  name: string;
  emoji: string;
  reason: string;
  shopQuery: string;
}

export function suggestAccessories(
  items: { category: string; subcategory: string | null; primaryColor: string; occasion: string | null }[],
  styleId?: string
): AccessorySuggestion[] {
  const suggestions: AccessorySuggestion[] = [];
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  const hasShoes = items.some((i) => i.category === "shoes");
  const topColor = items.find((i) => i.category === "top")?.primaryColor || "Black";

  suggestions.push({
    name: "Watch",
    emoji: "⌚",
    reason: "A watch elevates any outfit instantly",
    shopQuery: `${topColor.toLowerCase()} watch ${style?.id || "casual"}`,
  });

  if (style?.id === "streetwear" || style?.id === "hypebeast") {
    suggestions.push({
      name: "Crossbody Bag",
      emoji: "👜",
      reason: "Hands-free and adds a streetwear edge to your look",
      shopQuery: "crossbody bag sling bag",
    });
  } else if (style?.id === "old-money" || style?.id === "minimalist") {
    suggestions.push({
      name: "Tote Bag",
      emoji: "👜",
      reason: "Clean silhouette that matches the minimal aesthetic",
      shopQuery: "leather tote bag minimalist",
    });
  } else {
    suggestions.push({
      name: "Bag",
      emoji: "👜",
      reason: "Complete your outfit with a matching bag",
      shopQuery: `${topColor.toLowerCase()} bag`,
    });
  }

  const occasion = items[0]?.occasion?.toLowerCase() || "";
  if (occasion !== "formal" && occasion !== "church") {
    suggestions.push({
      name: "Sunglasses",
      emoji: "🕶️",
      reason: "Essential for the PH sun and instant cool factor",
      shopQuery: "classic sunglasses",
    });
  }

  if (style?.id === "streetwear" || style?.id === "casual-pinoy" || style?.id === "athleisure" || style?.id === "hypebeast") {
    suggestions.push({
      name: "Cap",
      emoji: "🧢",
      reason: "Sun protection + instant style upgrade",
      shopQuery: "baseball cap snapback",
    });
  }

  if (occasion === "formal" || occasion === "business" || style?.id === "smart-casual" || style?.id === "old-money") {
    suggestions.push({
      name: "Belt",
      emoji: "👔",
      reason: "A good belt is a must for polished looks",
      shopQuery: "leather belt classic",
    });
  }

  if (!hasShoes) {
    const shoeType = style?.preferredCategories?.shoes?.[0] || "Sneakers";
    suggestions.push({
      name: shoeType,
      emoji: "👟",
      reason: "Don't forget your shoes! They make or break an outfit",
      shopQuery: `${shoeType.toLowerCase()} ${topColor.toLowerCase()}`,
    });
  }

  return suggestions.slice(0, 6);
}
