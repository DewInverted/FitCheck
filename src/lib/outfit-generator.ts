import { ClothingItem } from "@/db/schema";
import {
  areColorsCompatible,
  getColorFamily,
  getMatchingColors,
  STYLE_PRESETS,
  suggestAccessories,
  type AccessorySuggestion,
  type StylePreset,
} from "./colors";

export interface OutfitResult {
  items: ClothingItem[];
  score: number;
  description: string;
  style: string;
  stylePreset?: StylePreset;
  accessories: AccessorySuggestion[];
  inspoLinks: {
    pinterest: string;
    tiktok: string;
    instagram: string;
  };
}

function scoreOutfit(items: ClothingItem[], stylePreset?: StylePreset): number {
  let score = 50; // base score

  // Check color compatibility
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (areColorsCompatible(items[i].primaryColor, items[j].primaryColor)) {
        score += 10;
      } else {
        score -= 15;
      }
    }
  }

  // Bonus for neutral base (black, white, gray, navy bottoms)
  const bottom = items.find((i) => i.category === "bottom");
  if (bottom) {
    const family = getColorFamily(bottom.primaryColor);
    if (["black", "blue", "gray", "brown"].includes(family)) {
      score += 10;
    }
  }

  // Bonus for matching occasion
  const occasions = items.map((i) => i.occasion).filter(Boolean);
  if (occasions.length > 1 && new Set(occasions).size === 1) {
    score += 15;
  }

  // Bonus for matching season
  const seasons = items.map((i) => i.season).filter((s) => s && s !== "all");
  if (seasons.length > 1 && new Set(seasons).size === 1) {
    score += 10;
  }

  // Style preset bonuses
  if (stylePreset) {
    // Bonus if item colors match the style's preferred palette
    for (const item of items) {
      const colorFam = getColorFamily(item.primaryColor);
      if (stylePreset.colorPalette.includes(colorFam)) {
        score += 5;
      }
    }

    // Bonus if subcategory matches the style's preferred categories
    for (const item of items) {
      const prefs = stylePreset.preferredCategories[item.category];
      if (prefs && item.subcategory && prefs.includes(item.subcategory)) {
        score += 8;
      }
    }
  }

  // Cap score
  return Math.max(0, Math.min(100, score));
}

function getOutfitDescription(items: ClothingItem[]): string {
  const colors = [...new Set(items.map((i) => i.primaryColor))];
  const categories = items.map((i) => i.subcategory || i.category);
  return `${categories.join(" + ")} in ${colors.join(", ")}`;
}

function getOutfitStyleLabel(items: ClothingItem[], stylePreset?: StylePreset): string {
  if (stylePreset) return stylePreset.label;
  const occasions = items.map((i) => i.occasion).filter(Boolean);
  if (occasions.includes("formal") || occasions.includes("business")) return "Formal";
  if (occasions.includes("sport")) return "Sporty";
  if (occasions.includes("date night")) return "Date Night";
  return "Casual";
}

function buildInspoLinks(items: ClothingItem[], stylePreset?: StylePreset) {
  const outfitDesc = items
    .map((i) => `${i.primaryColor} ${i.subcategory || i.category}`)
    .join(" ");

  if (stylePreset) {
    return {
      pinterest: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(stylePreset.pinterestQuery)}`,
      tiktok: `https://www.tiktok.com/search?q=${encodeURIComponent(stylePreset.tiktokQuery)}`,
      instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(stylePreset.id.replace("-", "") + "outfit")}/`,
    };
  }

  return {
    pinterest: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(outfitDesc + " outfit idea")}`,
    tiktok: `https://www.tiktok.com/search?q=${encodeURIComponent(outfitDesc + " ootd")}`,
    instagram: `https://www.instagram.com/explore/tags/ootd/`,
  };
}

export function generateOutfits(
  items: ClothingItem[],
  options?: {
    occasion?: string;
    season?: string;
    count?: number;
    styleId?: string;
  }
): OutfitResult[] {
  const stylePreset = options?.styleId
    ? STYLE_PRESETS.find((s) => s.id === options.styleId)
    : undefined;

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");
  const outerwear = items.filter((i) => i.category === "outerwear");

  const results: OutfitResult[] = [];
  const maxResults = options?.count || 6;

  // Filter by occasion/season if specified
  const filterItems = (arr: ClothingItem[]) => {
    let filtered = arr;
    if (options?.occasion) {
      const matching = filtered.filter(
        (i) => i.occasion?.toLowerCase() === options.occasion?.toLowerCase()
      );
      if (matching.length > 0) filtered = matching;
    }
    if (options?.season) {
      const matching = filtered.filter(
        (i) =>
          i.season?.toLowerCase() === options.season?.toLowerCase() ||
          i.season?.toLowerCase() === "all seasons" ||
          i.season?.toLowerCase() === "all"
      );
      if (matching.length > 0) filtered = matching;
    }
    return filtered;
  };

  // Further filter by style-preferred subcategories
  const filterByStyle = (arr: ClothingItem[], category: string) => {
    if (!stylePreset) return arr;
    const prefs = stylePreset.preferredCategories[category];
    if (!prefs || prefs.length === 0) return arr;
    const matching = arr.filter(
      (i) => i.subcategory && prefs.includes(i.subcategory)
    );
    return matching.length > 0 ? matching : arr;
  };

  let filteredTops = filterByStyle(filterItems(tops), "top");
  let filteredBottoms = filterByStyle(filterItems(bottoms), "bottom");
  let filteredShoes = filterByStyle(filterItems(shoes), "shoes");
  let filteredOuterwear = filterByStyle(filterItems(outerwear), "outerwear");

  // Fallback: if style filtering left us with nothing, use all filtered items
  if (filteredTops.length === 0) filteredTops = filterItems(tops);
  if (filteredBottoms.length === 0) filteredBottoms = filterItems(bottoms);
  if (filteredShoes.length === 0) filteredShoes = filterItems(shoes);
  if (filteredOuterwear.length === 0) filteredOuterwear = filterItems(outerwear);

  // Generate all combinations
  for (const top of filteredTops) {
    for (const bottom of filteredBottoms) {
      const shoeOptions = filteredShoes.length > 0 ? filteredShoes : [null];
      for (const shoe of shoeOptions) {
        const outfitItems = [top, bottom];
        if (shoe) outfitItems.push(shoe);

        const score = scoreOutfit(outfitItems, stylePreset);
        const accessories = suggestAccessories(
          outfitItems.map((i) => ({
            category: i.category,
            subcategory: i.subcategory,
            primaryColor: i.primaryColor,
            occasion: i.occasion,
          })),
          stylePreset?.id
        );

        results.push({
          items: outfitItems,
          score,
          description: getOutfitDescription(outfitItems),
          style: getOutfitStyleLabel(outfitItems, stylePreset),
          stylePreset,
          accessories,
          inspoLinks: buildInspoLinks(outfitItems, stylePreset),
        });

        // Also try with outerwear
        if (filteredOuterwear.length > 0) {
          for (const outer of filteredOuterwear) {
            const withOuter = [...outfitItems, outer];
            const outerScore = scoreOutfit(withOuter, stylePreset);
            const outerAccessories = suggestAccessories(
              withOuter.map((i) => ({
                category: i.category,
                subcategory: i.subcategory,
                primaryColor: i.primaryColor,
                occasion: i.occasion,
              })),
              stylePreset?.id
            );
            results.push({
              items: withOuter,
              score: outerScore,
              description: getOutfitDescription(withOuter),
              style: getOutfitStyleLabel(withOuter, stylePreset),
              stylePreset,
              accessories: outerAccessories,
              inspoLinks: buildInspoLinks(withOuter, stylePreset),
            });
          }
        }
      }
    }
  }

  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

export function suggestMissingItems(items: ClothingItem[]): {
  category: string;
  subcategory: string;
  colors: string[];
  reason: string;
}[] {
  const suggestions: {
    category: string;
    subcategory: string;
    colors: string[];
    reason: string;
  }[] = [];

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");
  const accessories = items.filter((i) => i.category === "accessory");

  // Check if missing basic categories
  if (tops.length === 0) {
    suggestions.push({
      category: "top",
      subcategory: "T-Shirt",
      colors: ["White", "Black", "Navy"],
      reason: "You need basic tops to create outfits",
    });
  }
  if (bottoms.length === 0) {
    suggestions.push({
      category: "bottom",
      subcategory: "Jeans",
      colors: ["Denim", "Black", "Khaki"],
      reason: "You need bottoms to complete your outfits",
    });
  }
  if (shoes.length === 0) {
    suggestions.push({
      category: "shoes",
      subcategory: "Sneakers",
      colors: ["White", "Black"],
      reason: "Shoes complete every outfit — get a versatile pair",
    });
  }

  // Suggest accessories if missing
  if (accessories.length === 0) {
    suggestions.push({
      category: "accessory",
      subcategory: "Watch",
      colors: ["Black", "Brown", "Silver"],
      reason: "A watch is the #1 accessory that upgrades any outfit instantly",
    });
    suggestions.push({
      category: "accessory",
      subcategory: "Sunglasses",
      colors: ["Black", "Brown"],
      reason: "Essential for the Philippine sun ☀️ and adds instant cool factor",
    });
  }

  // Suggest colors that would complement existing wardrobe
  const existingColors = items.map((i) => getColorFamily(i.primaryColor));
  const hasNeutral = existingColors.some((c) => ["black", "white", "gray"].includes(c));

  if (!hasNeutral && items.length > 0) {
    suggestions.push({
      category: "top",
      subcategory: "T-Shirt",
      colors: ["White", "Black"],
      reason: "Neutral basics pair with everything in your wardrobe",
    });
  }

  // If all tops are one color, suggest complementary
  if (tops.length > 0) {
    const topColors = [...new Set(tops.map((t) => getColorFamily(t.primaryColor)))];
    if (topColors.length === 1) {
      const matching = getMatchingColors(topColors[0]);
      suggestions.push({
        category: "top",
        subcategory: "Shirt",
        colors: matching
          .filter((c) => c !== "any")
          .slice(0, 3)
          .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        reason: `These colors would complement your ${topColors[0]} tops`,
      });
    }
  }

  // If all bottoms are one color, suggest variety
  if (bottoms.length > 0 && bottoms.length < 3) {
    const bottomColors = bottoms.map((b) => b.primaryColor);
    const suggestedColors = ["Navy", "Black", "Khaki", "Gray"].filter(
      (c) => !bottomColors.some((bc) => bc.toLowerCase() === c.toLowerCase())
    );
    if (suggestedColors.length > 0) {
      suggestions.push({
        category: "bottom",
        subcategory: "Chinos",
        colors: suggestedColors.slice(0, 3),
        reason: "More bottom variety means more outfit combinations",
      });
    }
  }

  // Suggest bag if missing
  if (!accessories.some((a) => a.subcategory?.toLowerCase().includes("bag"))) {
    suggestions.push({
      category: "accessory",
      subcategory: "Crossbody Bag",
      colors: ["Black", "Brown"],
      reason: "A good bag is both functional and adds to your fit",
    });
  }

  return suggestions.slice(0, 8);
}
