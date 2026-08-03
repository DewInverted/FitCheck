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

// Analyze what categories the user is missing for a given style
function analyzeStyleGap(
  items: ClothingItem[],
  stylePreset: StylePreset
): { category: string; hasMatch: boolean; bestMatch: ClothingItem | null; suggestedPiece: SuggestedPiece | null }[] {
  const categories = ["top", "bottom", "shoes"];
  const results: { category: string; hasMatch: boolean; bestMatch: ClothingItem | null; suggestedPiece: SuggestedPiece | null }[] = [];

  for (const cat of categories) {
    const prefs = stylePreset.preferredCategories[cat] || [];
    const palette = stylePreset.colorPalette;
    const catItems = items.filter((i) => i.category === cat);

    // Check if any item matches the style
    const styleMatches = catItems.filter((i) => {
      const subMatch = !prefs.length || (i.subcategory && prefs.includes(i.subcategory));
      const colorMatch = palette.includes(getColorFamily(i.primaryColor));
      return subMatch && colorMatch;
    });

    // Partial matches (at least subcategory matches)
    const partialMatches = catItems.filter((i) => {
      return i.subcategory && prefs.includes(i.subcategory);
    });

    if (styleMatches.length > 0) {
      results.push({ category: cat, hasMatch: true, bestMatch: styleMatches[0], suggestedPiece: null });
    } else if (partialMatches.length > 0) {
      results.push({ category: cat, hasMatch: true, bestMatch: partialMatches[0], suggestedPiece: null });
    } else if (catItems.length > 0) {
      // Has items in this category but none match the style
      const keyPiece = stylePreset.keyPieces.find((kp) => kp.category === cat);
      const suggestedSub = keyPiece?.subcategory || prefs[0] || "Item";
      const suggestedColor = keyPiece?.colors[0] || "Black";
      const query = `${suggestedColor} ${suggestedSub} men`;
      results.push({
        category: cat,
        hasMatch: false,
        bestMatch: catItems[0], // use best available
        suggestedPiece: {
          category: cat,
          subcategory: suggestedSub,
          color: suggestedColor,
          reason: `Your closet doesn't have ${suggestedSub.toLowerCase()} in ${stylePreset.label} colors. This would complete the look.`,
          shopQuery: query,
          shopUrl: `https://shopee.ph/search?keyword=${encodeURIComponent(query)}&sortBy=sales`,
        },
      });
    } else {
      // Missing entire category
      const keyPiece = stylePreset.keyPieces.find((kp) => kp.category === cat);
      const suggestedSub = keyPiece?.subcategory || prefs[0] || "Item";
      const suggestedColor = keyPiece?.colors[0] || "Black";
      const query = `${suggestedColor} ${suggestedSub} men`;
      results.push({
        category: cat,
        hasMatch: false,
        bestMatch: null,
        suggestedPiece: {
          category: cat,
          subcategory: suggestedSub,
          color: suggestedColor,
          reason: `You're missing ${suggestedSub.toLowerCase()} — essential for ${stylePreset.label} style.`,
          shopQuery: query,
          shopUrl: `https://shopee.ph/search?keyword=${encodeURIComponent(query)}&sortBy=sales`,
        },
      });
    }
  }

  return results;
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

  let filteredTops = filterByStyle(filterItems(tops), "top");
  let filteredBottoms = filterByStyle(filterItems(bottoms), "bottom");
  let filteredShoes = filterByStyle(filterItems(shoes), "shoes");
  let filteredOuterwear = filterByStyle(filterItems(outerwear), "outerwear");

  if (filteredTops.length === 0) filteredTops = filterItems(tops);
  if (filteredBottoms.length === 0) filteredBottoms = filterItems(bottoms);
  if (filteredShoes.length === 0) filteredShoes = filterItems(shoes);
  if (filteredOuterwear.length === 0) filteredOuterwear = filterItems(outerwear);

  // Generate "from your closet" outfits
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

        // Determine source label
        let source: "closet" | "suggested" | "mixed" = "closet";
        
        // Analyze gap for suggestions
        let suggestedPieces: SuggestedPiece[] = [];
        if (stylePreset) {
          const gapAnalysis = analyzeStyleGap(outfitItems, stylePreset);
          suggestedPieces = gapAnalysis
            .filter((g) => !g.hasMatch && g.suggestedPiece)
            .map((g) => g.suggestedPiece!);
          
          if (suggestedPieces.length > 0) {
            source = "mixed";
          }
        }

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
            
            let outerSuggested: SuggestedPiece[] = [];
            let outerSource: "closet" | "suggested" | "mixed" = "closet";
            if (stylePreset) {
              const outerGap = analyzeStyleGap(withOuter, stylePreset);
              outerSuggested = outerGap
                .filter((g) => !g.hasMatch && g.suggestedPiece)
                .map((g) => g.suggestedPiece!);
              if (outerSuggested.length > 0) outerSource = "mixed";
            }

            results.push({
              items: withOuter,
              score: outerScore,
              description: getOutfitDescription(withOuter),
              style: getOutfitStyleLabel(withOuter, stylePreset),
              source: outerSource,
              stylePreset,
              accessories: outerAccessories,
              suggestedPieces: outerSuggested,
              inspoLinks: buildInspoLinks(withOuter, stylePreset),
            });
          }
        }
      }
    }
  }

  // If style preset selected and we have few good matches, generate "suggested" outfits
  if (stylePreset && (options?.showSuggested !== false)) {
    const hasGoodClosetFits = results.filter((r) => r.source === "closet" && r.score >= 70).length;
    
    // Always generate suggestions for what's missing
    const gapAnalysis = analyzeStyleGap(items, stylePreset);
    const missingPieces = gapAnalysis.filter((g) => !g.hasMatch && g.suggestedPiece);
    
    if (missingPieces.length > 0 && hasGoodClosetFits < 3) {
      // Create a "suggested outfit" entry  
      const suggestedPieces = missingPieces.map((g) => g.suggestedPiece!);
      const bestClosetItems = results.length > 0 
        ? results[0].items 
        : items.slice(0, 2);

      if (bestClosetItems.length > 0) {
        results.push({
          items: bestClosetItems,
          score: 60,
          description: `${stylePreset.label} suggestion`,
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
          suggestedPieces,
          inspoLinks: buildInspoLinks(bestClosetItems, stylePreset),
        });
      }
    }
  }

  // Sort: closet fits first (with high scores), then mixed, then suggested
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

  // Style-specific suggestions
  const stylePreset = styleId ? STYLE_PRESETS.find((s) => s.id === styleId) : undefined;

  if (stylePreset) {
    // Check what key pieces are missing for this style
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

  // Generic suggestions based on wardrobe gaps
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
  }

  // Color gap analysis
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

  // Deduplicate by subcategory
  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      const key = `${s.category}-${s.subcategory}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}
