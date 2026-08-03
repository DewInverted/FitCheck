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

export interface SuggestedPiece {
  category: string;
  subcategory: string;
  color: string;
  reason: string;
  shopQuery: string;
  shopUrl: string;
}

export interface OutfitResult {
  items: ClothingItem[];
  score: number;
  description: string;
  style: string;
  source: "closet" | "suggested" | "mixed";
  stylePreset?: StylePreset;
  accessories: AccessorySuggestion[];
  suggestedPieces: SuggestedPiece[];
  inspoLinks: {
    pinterest: string;
    tiktok: string;
    instagram: string;
  };
}

function scoreOutfit(items: ClothingItem[], stylePreset?: StylePreset): number {
  let score = 50;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (areColorsCompatible(items[i].primaryColor, items[j].primaryColor)) {
        score += 10;
      } else {
        score -= 15;
      }
    }
  }

  const bottom = items.find((i) => i.category === "bottom");
  if (bottom) {
    const family = getColorFamily(bottom.primaryColor);
    if (["black", "blue", "gray", "brown"].includes(family)) {
      score += 10;
    }
  }

  const occasions = items.map((i) => i.occasion).filter(Boolean);
  if (occasions.length > 1 && new Set(occasions).size === 1) {
    score += 15;
  }

  const seasons = items.map((i) => i.season).filter((s) => s && s !== "all");
  if (seasons.length > 1 && new Set(seasons).size === 1) {
    score += 10;
  }

  if (stylePreset) {
    for (const item of items) {
      const colorFam = getColorFamily(item.primaryColor);
      if (stylePreset.colorPalette.includes(colorFam)) {
        score += 5;
      }
    }
    for (const item of items) {
      const prefs = stylePreset.preferredCategories[item.category];
      if (prefs && item.subcategory && prefs.includes(item.subcategory)) {
        score += 8;
      }
    }
  }

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

// Get suggested pieces for categories the user is missing or doesn't match style
function getSuggestedPiecesForStyle(
  items: ClothingItem[],
  stylePreset: StylePreset,
  suggestCategories: string[],
  gender: string
): SuggestedPiece[] {
  const suggestions: SuggestedPiece[] = [];
  const g = gender === "female" ? "women" : "men";

  for (const cat of suggestCategories) {
    const prefs = stylePreset.preferredCategories[cat] || [];
    const keyPiece = stylePreset.keyPieces.find((kp) => kp.category === cat);
    const catItems = items.filter((i) => i.category === cat);

    // Check if user has items matching this style
    const hasStyleMatch = catItems.some((i) => {
      const subMatch = !prefs.length || (i.subcategory && prefs.includes(i.subcategory));
      const colorMatch = stylePreset.colorPalette.includes(getColorFamily(i.primaryColor));
      return subMatch && colorMatch;
    });

    if (!hasStyleMatch) {
      const suggestedSub = keyPiece?.subcategory || prefs[0] || getDefaultSubcategory(cat);
      const suggestedColor = keyPiece?.colors[0] || "Black";
      const query = `${suggestedColor} ${suggestedSub} ${g}`;

      suggestions.push({
        category: cat,
        subcategory: suggestedSub,
        color: suggestedColor,
        reason: catItems.length === 0
          ? `You're missing ${suggestedSub.toLowerCase()} — essential for ${stylePreset.label}`
          : `Your ${cat}s don't match ${stylePreset.label} style. Try this!`,
        shopQuery: query,
        shopUrl: `https://shopee.ph/search?keyword=${encodeURIComponent(query)}&sortBy=sales`,
      });
    }
  }

  return suggestions;
}

function getDefaultSubcategory(category: string): string {
  const defaults: Record<string, string> = {
    top: "T-Shirt",
    bottom: "Jeans",
    shoes: "Sneakers",
    outerwear: "Jacket",
    accessory: "Watch",
  };
  return defaults[category] || "Item";
}

// Shuffle array
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateOutfits(
  items: ClothingItem[],
  options?: {
    occasion?: string;
    season?: string;
    count?: number;
    styleId?: string;
    gender?: string;
    showSuggested?: boolean;
    suggestCategories?: string[];
  }
): OutfitResult[] {
  const stylePreset = options?.styleId
    ? STYLE_PRESETS.find((s) => s.id === options.styleId)
    : undefined;

  const gender = options?.gender || "male";
  const suggestCategories = options?.suggestCategories || ["top", "bottom", "shoes", "accessory"];

  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");
  const outerwear = items.filter((i) => i.category === "outerwear");

  const results: OutfitResult[] = [];
  const maxResults = options?.count || 8;
  const usedCombos = new Set<string>();

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

  const filterByStyle = (arr: ClothingItem[], category: string) => {
    if (!stylePreset) return arr;
    const prefs = stylePreset.preferredCategories[category];
    if (!prefs || prefs.length === 0) return arr;
    const matching = arr.filter(
      (i) => i.subcategory && prefs.includes(i.subcategory)
    );
    return matching.length > 0 ? matching : arr;
  };

  let filteredTops = shuffle(filterByStyle(filterItems(tops), "top"));
  let filteredBottoms = shuffle(filterByStyle(filterItems(bottoms), "bottom"));
  let filteredShoes = shuffle(filterByStyle(filterItems(shoes), "shoes"));
  let filteredOuterwear = shuffle(filterByStyle(filterItems(outerwear), "outerwear"));

  if (filteredTops.length === 0) filteredTops = shuffle(filterItems(tops));
  if (filteredBottoms.length === 0) filteredBottoms = shuffle(filterItems(bottoms));
  if (filteredShoes.length === 0) filteredShoes = shuffle(filterItems(shoes));
  if (filteredOuterwear.length === 0) filteredOuterwear = shuffle(filterItems(outerwear));

  // Track how many times each item is used to ensure variety
  const itemUsage: Record<string, number> = {};
  const maxUsagePerItem = Math.max(1, Math.ceil(maxResults / Math.max(filteredTops.length, 1)));

  const canUseItem = (item: ClothingItem) => {
    const usage = itemUsage[item.id] || 0;
    return usage < maxUsagePerItem;
  };

  const markUsed = (item: ClothingItem) => {
    itemUsage[item.id] = (itemUsage[item.id] || 0) + 1;
  };

  // Generate unique outfit combinations - prioritize variety!
  const generateCombos = () => {
    for (const top of filteredTops) {
      if (!canUseItem(top)) continue;
      
      for (const bottom of filteredBottoms) {
        if (!canUseItem(bottom)) continue;
        if (results.length >= maxResults) return;

        const comboKey = `${top.id}-${bottom.id}`;
        if (usedCombos.has(comboKey)) continue;

        // Find a shoe that hasn't been overused
        const availableShoes = filteredShoes.filter(canUseItem);
        const shoe = availableShoes.length > 0 ? availableShoes[Math.floor(Math.random() * availableShoes.length)] : null;

        const outfitItems = [top, bottom];
        if (shoe) outfitItems.push(shoe);

        const score = scoreOutfit(outfitItems, stylePreset);

        // Get suggestions for missing/non-matching categories
        let suggestedPieces: SuggestedPiece[] = [];
        if (stylePreset && options?.showSuggested !== false) {
          suggestedPieces = getSuggestedPiecesForStyle(outfitItems, stylePreset, suggestCategories, gender);
        }

        const source: "closet" | "mixed" = suggestedPieces.length > 0 ? "mixed" : "closet";

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
          source,
          stylePreset,
          accessories,
          suggestedPieces,
          inspoLinks: buildInspoLinks(outfitItems, stylePreset),
        });

        usedCombos.add(comboKey);
        markUsed(top);
        markUsed(bottom);
        if (shoe) markUsed(shoe);

        // Also try with outerwear for variety
        if (filteredOuterwear.length > 0 && results.length < maxResults) {
          const availableOuter = filteredOuterwear.filter(canUseItem);
          if (availableOuter.length > 0) {
            const outer = availableOuter[Math.floor(Math.random() * availableOuter.length)];
            const withOuter = [...outfitItems, outer];
            const outerKey = `${comboKey}-${outer.id}`;
            
            if (!usedCombos.has(outerKey)) {
              const outerScore = scoreOutfit(withOuter, stylePreset);
              
              let outerSuggested: SuggestedPiece[] = [];
              if (stylePreset && options?.showSuggested !== false) {
                outerSuggested = getSuggestedPiecesForStyle(withOuter, stylePreset, suggestCategories, gender);
              }

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
                source: outerSuggested.length > 0 ? "mixed" : "closet",
                stylePreset,
                accessories: outerAccessories,
                suggestedPieces: outerSuggested,
                inspoLinks: buildInspoLinks(withOuter, stylePreset),
              });

              usedCombos.add(outerKey);
              markUsed(outer);
            }
          }
        }
      }
    }
  };

  generateCombos();

  // If we didn't get enough outfits, relax the usage limits and try again
  if (results.length < maxResults) {
    Object.keys(itemUsage).forEach(k => { itemUsage[k] = 0; });
    generateCombos();
  }

  // Generate "suggested" outfits (full outfit suggestions from style, not from closet)
  if (stylePreset && options?.showSuggested !== false && results.length < maxResults) {
    const allSuggestions = getSuggestedPiecesForStyle(items, stylePreset, ["top", "bottom", "shoes"], gender);
    
    if (allSuggestions.length > 0) {
      // Create a "suggested outfit" entry showing what to buy
      const bestClosetItems = results.length > 0 ? results[0].items : [];
      
      results.push({
        items: bestClosetItems,
        score: 50,
        description: `Complete ${stylePreset.label} look`,
        style: stylePreset.label,
        source: "suggested",
        stylePreset,
        accessories: suggestAccessories(
          bestClosetItems.map((i) => ({
            category: i.category,
            subcategory: i.subcategory,
            primaryColor: i.primaryColor,
            occasion: i.occasion,
          })),
          stylePreset.id
        ),
        suggestedPieces: allSuggestions,
        inspoLinks: buildInspoLinks(bestClosetItems, stylePreset),
      });
    }
  }

  // Sort: closet fits first (highest scores), then mixed, then suggested
  results.sort((a, b) => {
    const sourceOrder = { closet: 0, mixed: 1, suggested: 2 };
    const sourceDiff = sourceOrder[a.source] - sourceOrder[b.source];
    if (sourceDiff !== 0) return sourceDiff;
    return b.score - a.score;
  });

  return results.slice(0, maxResults);
}

export function suggestMissingItems(
  items: ClothingItem[],
  styleId?: string,
  gender?: string
): {
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

  const stylePreset = styleId ? STYLE_PRESETS.find((s) => s.id === styleId) : undefined;

  if (stylePreset) {
    for (const keyPiece of stylePreset.keyPieces) {
      const catItems = items.filter((i) => i.category === keyPiece.category);
      const hasMatch = catItems.some(
        (i) =>
          i.subcategory === keyPiece.subcategory &&
          keyPiece.colors.some((c) => getColorFamily(c) === getColorFamily(i.primaryColor))
      );

      if (!hasMatch) {
        suggestions.push({
          category: keyPiece.category,
          subcategory: keyPiece.subcategory,
          colors: keyPiece.colors,
          reason: `Essential for ${stylePreset.label} style — adds to your outfit options`,
        });
      }
    }
  }

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
  if (accessories.length === 0) {
    suggestions.push({
      category: "accessory",
      subcategory: "Watch",
      colors: ["Black", "Brown", "Silver"],
      reason: "A watch is the #1 accessory that upgrades any outfit instantly",
    });
    suggestions.push({
      category: "accessory",
      subcategory: "Cap",
      colors: ["Black", "Navy", "White"],
      reason: "A cap adds instant streetwear vibes and sun protection",
    });
  }

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

  if (tops.length > 0) {
    const topColors = [...new Set(tops.map((t) => getColorFamily(t.primaryColor)))];
    if (topColors.length === 1) {
      const matching = getMatchingColors(topColors[0]);
      suggestions.push({
        category: "top",
        subcategory: gender === "female" ? "Blouse" : "Shirt",
        colors: matching
          .filter((c) => c !== "any")
          .slice(0, 3)
          .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        reason: `These colors would complement your ${topColors[0]} tops`,
      });
    }
  }

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

  if (!accessories.some((a) => a.subcategory?.toLowerCase().includes("bag"))) {
    suggestions.push({
      category: "accessory",
      subcategory: "Crossbody Bag",
      colors: ["Black", "Brown"],
      reason: "A good bag is both functional and adds to your fit",
    });
  }

  if (!accessories.some((a) => a.subcategory?.toLowerCase().includes("sunglasses"))) {
    suggestions.push({
      category: "accessory",
      subcategory: "Sunglasses",
      colors: ["Black", "Brown"],
      reason: "Essential for the PH sun and instant cool factor",
    });
  }

  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      const key = `${s.category}-${s.subcategory}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}
