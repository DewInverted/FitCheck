import { db } from "@/db";
import { clothingItems } from "@/db/schema";
import { suggestMissingItems } from "@/lib/outfit-generator";
import { NextRequest, NextResponse } from "next/server";

// Detailed pairing tips based on item type + color + gender
function getPairingTip(subcategory: string, color: string, gender: string, _style: string): string {
  const g = gender === "female" ? "women" : "men";
  const tips: Record<string, string[]> = {
    "T-Shirt": [
      `A ${color.toLowerCase()} tee is the foundation of any outfit. Pair it with jeans and sneakers for an easy casual look, or tuck it into high-waisted pants for a more polished vibe.`,
      `Layer this under an open button-down or denim jacket. For ${g}, a ${color.toLowerCase()} tee works with literally everything in your closet.`,
    ],
    "Shirt": [
      `Roll the sleeves to the elbow for a relaxed smart-casual look. A ${color.toLowerCase()} shirt pairs perfectly with dark jeans or chinos. Leave the top button open.`,
      `Tuck into trousers for formal, or leave untucked over a plain tee for a layered streetwear vibe.`,
    ],
    "Jeans": [
      `${color} jeans are a wardrobe staple. They go with white tees, black tops, flannel shirts — basically anything. Cuff the hem slightly for a cleaner look.`,
      `For ${g}: pair with sneakers for casual or loafers/boots to dress them up. A fitted tee + ${color.toLowerCase()} jeans is an unbeatable combo.`,
    ],
    "Chinos": [
      `${color} chinos bridge the gap between casual and smart. Pair with a polo or button-down for office looks, or a graphic tee for weekends.`,
      `These work great with white sneakers or loafers. Add a belt to complete the look.`,
    ],
    "Sneakers": [
      `${color} sneakers are the most versatile footwear you can own. They work with jeans, joggers, chinos, shorts — everything except maybe a suit.`,
      `Keep them clean for maximum impact. ${color} sneakers especially pop when the rest of your outfit is darker tones.`,
    ],
    "Watch": [
      `A ${color.toLowerCase()} watch is the #1 accessory upgrade. It shows attention to detail and works with every outfit from casual to formal.`,
      `Match the watch tone to your belt/shoes for a put-together look. ${color} works best with neutral outfits.`,
    ],
    "Sunglasses": [
      `${color} frames are classic and go with everything. Essential for the PH sun, and they instantly add a cool factor to any outfit.`,
      `Choose a shape that complements your face — aviators for round faces, round frames for angular faces.`,
    ],
    "Crossbody Bag": [
      `A ${color.toLowerCase()} crossbody adds functionality and style. Wear it across the body for a streetwear look, or over one shoulder for a cleaner vibe.`,
      `${color} is versatile — it matches most outfits without clashing. Great for everyday carry.`,
    ],
    "Hoodie": [
      `Layer it under a denim or bomber jacket when it's cold. On its own, pair with joggers or jeans. A ${color.toLowerCase()} hoodie is a streetwear essential.`,
    ],
    "Cargo Pants": [
      `The utility look is in. Pair ${color.toLowerCase()} cargos with a fitted tee and chunky sneakers for a solid streetwear fit. Keep the top simple — the pants are the statement.`,
    ],
  };

  const options = tips[subcategory];
  if (options && options.length > 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
  return `A ${color.toLowerCase()} ${subcategory.toLowerCase()} pairs well with neutral tones like white, black, and gray. Mix with contrasting colors for a bolder look.`;
}

function getStyleContext(subcategory: string, style: string): string {
  const styleNames: Record<string, string> = {
    streetwear: "Streetwear", "old-money": "Old Money", "clean-girl": "Clean Girl",
    minimalist: "Minimalist", y2k: "Y2K", "casual-pinoy": "Casual Pinoy",
    "smart-casual": "Smart Casual", athleisure: "Athleisure",
  };
  const name = styleNames[style];
  if (!name) return "";

  const contexts: Record<string, Record<string, string>> = {
    streetwear: {
      "T-Shirt": "Oversized fit is key for streetwear. Let it hang loose over your pants.",
      Jeans: "Go for wide-leg or baggy cuts. Skinny jeans are out for street style.",
      Sneakers: "Chunky or retro runners are the move. AF1s, Dunks, or New Balance 550s.",
      Hoodie: "The streetwear uniform. Layer it right and you're golden.",
      "Cargo Pants": "Cargos are a streetwear staple right now. Pair with any top and you're set.",
    },
    "old-money": {
      Shirt: "Linen or oxford cloth in muted tones. Think Ralph Lauren, not party shirt.",
      Chinos: "Tailored fit, no cargo pockets. Classic old money bottom.",
      Loafers: "Penny loafers or driving mocs. The old money shoe of choice.",
    },
    minimalist: {
      "T-Shirt": "Stick to one solid color, no graphics. Quality over quantity.",
      Jeans: "Clean dark wash or black. No distressing, no rips.",
    },
  };

  return contexts[style]?.[subcategory] || (name ? `This fits well with the ${name} aesthetic.` : "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") || "male";
    const style = searchParams.get("style") || "";

    const items = await db.select().from(clothingItems);
    const suggestions = suggestMissingItems(items);

    const detailed = suggestions.map((s) => ({
      ...s,
      pairingTip: getPairingTip(s.subcategory, s.colors[0], gender, style),
      styleContext: getStyleContext(s.subcategory, style),
      shoppingLinks: [
        {
          store: "Shopee",
          url: `https://shopee.ph/search?keyword=${encodeURIComponent(`${s.colors[0]} ${s.subcategory} ${gender === "female" ? "women" : "men"}`)}`,
          icon: "🧡",
          tag: "from ₱99",
        },
        {
          store: "TikTok Shop",
          url: `https://www.tiktok.com/shop/search?q=${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`,
          icon: "🎵",
          tag: "trending",
        },
        {
          store: "Lazada",
          url: `https://www.lazada.com.ph/catalog/?q=${encodeURIComponent(`${s.colors[0]} ${s.subcategory} ${gender === "female" ? "women" : "men"} cheap`)}`,
          icon: "💙",
          tag: "deals",
        },
        {
          store: "Facebook",
          url: `https://www.facebook.com/marketplace/category/apparel?query=${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`,
          icon: "📘",
          tag: "marketplace",
        },
        {
          store: "Carousell",
          url: `https://www.carousell.ph/search/${encodeURIComponent(`${s.colors[0]} ${s.subcategory}`)}`,
          icon: "🔴",
          tag: "preloved",
        },
        {
          store: "Instagram",
          url: `https://www.instagram.com/explore/tags/${encodeURIComponent(`${s.subcategory.toLowerCase().replace(/ /g, "")}ph`)}/`,
          icon: "📸",
          tag: "IG shops",
        },
      ],
    }));

    return new NextResponse(JSON.stringify(detailed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
