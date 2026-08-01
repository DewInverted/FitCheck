// Color theory and matching logic

export const COLOR_FAMILIES: Record<string, string[]> = {
  red: ["red", "crimson", "scarlet", "burgundy", "maroon", "wine", "cherry", "rust"],
  orange: ["orange", "coral", "peach", "tangerine", "amber", "burnt orange"],
  yellow: ["yellow", "gold", "mustard", "lemon", "cream"],
  green: ["green", "olive", "sage", "emerald", "forest", "mint", "lime", "teal", "army green"],
  blue: ["blue", "navy", "royal blue", "sky blue", "cobalt", "indigo", "denim", "powder blue"],
  purple: ["purple", "lavender", "violet", "plum", "mauve", "lilac", "eggplant"],
  pink: ["pink", "magenta", "rose", "blush", "fuchsia", "salmon", "hot pink"],
  brown: ["brown", "tan", "beige", "khaki", "camel", "chocolate", "coffee", "taupe", "mocha"],
  black: ["black", "charcoal"],
  white: ["white", "ivory", "off-white", "cream white"],
  gray: ["gray", "grey", "silver", "slate", "ash", "heather"],
};

// Complementary color pairings
export const COLOR_PAIRINGS: Record<string, string[]> = {
  red: ["black", "white", "gray", "navy", "beige", "denim"],
  orange: ["navy", "blue", "white", "brown", "black", "olive"],
  yellow: ["navy", "gray", "black", "white", "denim", "brown"],
  green: ["white", "black", "brown", "beige", "navy", "gray"],
  blue: ["white", "gray", "brown", "beige", "black", "khaki"],
  purple: ["white", "gray", "black", "silver", "blush", "navy"],
  pink: ["gray", "navy", "white", "black", "denim", "beige"],
  brown: ["white", "blue", "green", "beige", "cream", "navy"],
  black: ["white", "red", "pink", "blue", "gray", "beige", "any"],
  white: ["any", "navy", "black", "blue", "red", "gray"],
  gray: ["any", "blue", "pink", "white", "black", "red"],
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
  "Black",
  "White",
  "Navy",
  "Gray",
  "Beige",
  "Brown",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Pink",
  "Purple",
  "Olive",
  "Burgundy",
  "Teal",
  "Cream",
  "Khaki",
  "Denim",
  "Charcoal",
];

export const CATEGORIES = [
  { value: "top", label: "👕 Top" },
  { value: "bottom", label: "👖 Bottom" },
  { value: "shoes", label: "👟 Shoes" },
  { value: "outerwear", label: "🧥 Outerwear" },
  { value: "accessory", label: "🎒 Accessory" },
];

export const SUBCATEGORIES: Record<string, string[]> = {
  top: ["T-Shirt", "Shirt", "Polo", "Blouse", "Sweater", "Hoodie", "Tank Top", "Henley", "Turtleneck", "Crop Top"],
  bottom: ["Jeans", "Chinos", "Shorts", "Dress Pants", "Joggers", "Skirt", "Cargo Pants", "Sweatpants", "Wide Leg Pants"],
  shoes: ["Sneakers", "Boots", "Dress Shoes", "Sandals", "Loafers", "Running Shoes", "Heels", "Flats", "Slides", "Tsinelas"],
  outerwear: ["Jacket", "Coat", "Blazer", "Vest", "Windbreaker", "Parka", "Cardigan", "Denim Jacket", "Bomber Jacket"],
  accessory: ["Watch", "Hat", "Belt", "Scarf", "Sunglasses", "Bag", "Tie", "Jewelry", "Cap", "Crossbody Bag", "Tote Bag", "Earrings", "Necklace", "Bracelet", "Ring"],
};

export const OCCASIONS = ["Casual", "Formal", "Business", "Sport", "Date Night", "Party", "Lakad", "Gala", "Church"];
export const SEASONS = ["Hot/Summer", "Rainy", "Cool/Ber Months", "All Seasons"];
export const PATTERNS = ["Solid", "Striped", "Plaid", "Floral", "Checkered", "Polka Dot", "Graphic", "Camo", "Tie-Dye"];

// Fit types per category — which categories get fit options
export const FIT_TYPES: Record<string, string[]> = {
  top: ["Regular", "Oversized", "Slim", "Relaxed", "Cropped", "Boxy"],
  bottom: ["Regular", "Skinny", "Slim", "Straight", "Baggy", "Wide Leg", "Relaxed", "Tapered"],
  outerwear: ["Regular", "Oversized", "Cropped", "Relaxed"],
};

// ── Style Presets (for outfit generation) ──────────────────────
export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  colorPalette: string[]; // preferred color families
  preferredCategories: Record<string, string[]>; // preferred subcategories per category
  pinterestQuery: string;
  tiktokQuery: string;
  accessorySuggestions: string[];
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "streetwear",
    label: "Streetwear",
    emoji: "🔥",
    description: "Oversized fits, sneakers, graphic tees, cargo pants",
    colorPalette: ["black", "white", "gray", "green", "brown"],
    preferredCategories: {
      top: ["Hoodie", "T-Shirt", "Sweater"],
      bottom: ["Cargo Pants", "Joggers", "Wide Leg Pants", "Jeans"],
      shoes: ["Sneakers", "Boots"],
      outerwear: ["Bomber Jacket", "Windbreaker", "Denim Jacket"],
    },
    pinterestQuery: "streetwear outfit ideas men women 2025",
    tiktokQuery: "streetwear outfit inspo",
    accessorySuggestions: ["Cap", "Crossbody Bag", "Watch", "Sunglasses"],
  },
  {
    id: "old-money",
    label: "Old Money",
    emoji: "💎",
    description: "Clean, preppy, neutral tones, quality basics",
    colorPalette: ["white", "brown", "blue", "gray", "black"],
    preferredCategories: {
      top: ["Polo", "Shirt", "Turtleneck", "Blouse"],
      bottom: ["Chinos", "Dress Pants", "Wide Leg Pants"],
      shoes: ["Loafers", "Dress Shoes", "Flats"],
      outerwear: ["Blazer", "Cardigan", "Coat"],
    },
    pinterestQuery: "old money aesthetic outfit 2025",
    tiktokQuery: "old money outfit inspo quiet luxury",
    accessorySuggestions: ["Watch", "Belt", "Sunglasses", "Tote Bag"],
  },
  {
    id: "clean-girl",
    label: "Clean Girl",
    emoji: "✨",
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
  },
  {
    id: "minimalist",
    label: "Minimalist",
    emoji: "🤍",
    description: "Neutral palette, simple silhouettes, timeless",
    colorPalette: ["black", "white", "gray", "brown"],
    preferredCategories: {
      top: ["T-Shirt", "Shirt", "Turtleneck"],
      bottom: ["Jeans", "Chinos", "Dress Pants", "Wide Leg Pants"],
      shoes: ["Sneakers", "Loafers", "Flats"],
      outerwear: ["Blazer", "Coat", "Cardigan"],
    },
    pinterestQuery: "minimalist outfit ideas capsule wardrobe",
    tiktokQuery: "minimalist fashion outfit inspo",
    accessorySuggestions: ["Watch", "Belt", "Tote Bag"],
  },
  {
    id: "y2k",
    label: "Y2K",
    emoji: "💿",
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
  },
  {
    id: "casual-pinoy",
    label: "Casual Pinoy",
    emoji: "🇵🇭",
    description: "Comfy, breathable, perfect for PH weather",
    colorPalette: ["white", "blue", "black", "gray", "brown"],
    preferredCategories: {
      top: ["T-Shirt", "Polo", "Tank Top", "Shirt"],
      bottom: ["Shorts", "Jeans", "Joggers", "Chinos"],
      shoes: ["Sneakers", "Slides", "Tsinelas", "Sandals"],
      outerwear: ["Windbreaker", "Denim Jacket"],
    },
    pinterestQuery: "casual pinoy outfit men women everyday",
    tiktokQuery: "pinoy ootd casual outfit",
    accessorySuggestions: ["Cap", "Watch", "Crossbody Bag", "Sunglasses"],
  },
  {
    id: "smart-casual",
    label: "Smart Casual",
    emoji: "👔",
    description: "Polished but relaxed, office to dinner",
    colorPalette: ["blue", "white", "gray", "black", "brown"],
    preferredCategories: {
      top: ["Shirt", "Polo", "Blouse", "Henley"],
      bottom: ["Chinos", "Dress Pants", "Jeans"],
      shoes: ["Loafers", "Dress Shoes", "Sneakers", "Flats"],
      outerwear: ["Blazer", "Cardigan", "Vest"],
    },
    pinterestQuery: "smart casual outfit 2025",
    tiktokQuery: "smart casual ootd work outfit",
    accessorySuggestions: ["Watch", "Belt", "Bag", "Tie"],
  },
  {
    id: "athleisure",
    label: "Athleisure",
    emoji: "🏃",
    description: "Sporty comfort meets everyday style",
    colorPalette: ["black", "gray", "white", "blue", "green"],
    preferredCategories: {
      top: ["Hoodie", "T-Shirt", "Tank Top"],
      bottom: ["Joggers", "Shorts", "Sweatpants"],
      shoes: ["Sneakers", "Running Shoes", "Slides"],
      outerwear: ["Windbreaker", "Vest", "Bomber Jacket"],
    },
    pinterestQuery: "athleisure outfit ideas sporty casual",
    tiktokQuery: "athleisure outfit inspo gym to street",
    accessorySuggestions: ["Cap", "Watch", "Crossbody Bag", "Sunglasses"],
  },
];

// ── Accessory Recommendation Engine ────────────────────────────
export interface AccessorySuggestion {
  name: string;
  emoji: string;
  reason: string;
  shopQuery: string; // for PH shop links
}

export function suggestAccessories(
  outfitItems: { category: string; subcategory: string | null; primaryColor: string; occasion: string | null }[],
  styleId?: string
): AccessorySuggestion[] {
  const suggestions: AccessorySuggestion[] = [];
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  const hasShoes = outfitItems.some((i) => i.category === "shoes");
  const occasion = outfitItems.find((i) => i.occasion)?.occasion?.toLowerCase() || "";
  const topColor = outfitItems.find((i) => i.category === "top")?.primaryColor || "Black";

  // Always suggest a watch
  suggestions.push({
    name: "Watch",
    emoji: "⌚",
    reason: "A watch ties any outfit together and adds polish",
    shopQuery: occasion.includes("formal") || occasion.includes("business")
      ? "classic dress watch"
      : "casual everyday watch",
  });

  // Bag suggestion based on style
  if (style?.id === "streetwear" || style?.id === "casual-pinoy" || style?.id === "athleisure") {
    suggestions.push({
      name: "Crossbody Bag",
      emoji: "👜",
      reason: "Hands-free and adds a streetwear edge to your look",
      shopQuery: "crossbody bag sling bag",
    });
  } else if (style?.id === "old-money" || style?.id === "clean-girl" || style?.id === "minimalist") {
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

  // Sunglasses
  if (occasion !== "formal" && occasion !== "church") {
    suggestions.push({
      name: "Sunglasses",
      emoji: "🕶️",
      reason: "Essential for the PH sun and instant cool factor",
      shopQuery: style?.id === "y2k" ? "y2k sunglasses trendy" : "classic sunglasses",
    });
  }

  // Hat/Cap
  if (style?.id === "streetwear" || style?.id === "casual-pinoy" || style?.id === "athleisure") {
    suggestions.push({
      name: "Cap",
      emoji: "🧢",
      reason: "Sun protection + instant style upgrade",
      shopQuery: "baseball cap snapback",
    });
  }

  // Belt for formal / smart casual
  if (occasion === "formal" || occasion === "business" || style?.id === "smart-casual" || style?.id === "old-money") {
    suggestions.push({
      name: "Belt",
      emoji: "👔",
      reason: "A good belt is a must for polished looks",
      shopQuery: "leather belt classic",
    });
  }

  // Jewelry
  if (style?.id === "clean-girl" || style?.id === "y2k" || style?.id === "old-money") {
    suggestions.push({
      name: "Layered Necklace",
      emoji: "📿",
      reason: "Subtle layering adds dimension to your outfit",
      shopQuery: "layered necklace gold dainty",
    });
    suggestions.push({
      name: "Earrings",
      emoji: "✨",
      reason: "Small hoops or studs frame your face beautifully",
      shopQuery: style?.id === "y2k" ? "chunky hoop earrings colorful" : "small hoop earrings gold",
    });
  }

  // Bracelet
  if (style?.id === "streetwear" || style?.id === "y2k") {
    suggestions.push({
      name: "Bracelet",
      emoji: "📿",
      reason: "Stack bracelets for extra personality",
      shopQuery: "beaded bracelet stack",
    });
  }

  // Scarf for formal / old money
  if (style?.id === "old-money") {
    suggestions.push({
      name: "Silk Scarf",
      emoji: "🧣",
      reason: "Classic old money accessory — tie it on your bag or neck",
      shopQuery: "silk scarf classic",
    });
  }

  // Shoe suggestion if missing
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
