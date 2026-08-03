import { db } from "@/db";
import { clothingItems } from "@/db/schema";
import { suggestMissingItems } from "@/lib/outfit-generator";
import { NextRequest, NextResponse } from "next/server";

function getPairingTip(subcategory: string, color: string, gender: string): string {
  const g = gender === "female" ? "women" : "men";
  const tips: Record<string, string[]> = {
    "T-Shirt": [
      `A ${color.toLowerCase()} tee is the foundation of any outfit. Pair it with jeans and sneakers for an easy casual look.`,
      `Layer this under an open button-down or denim jacket. For ${g}, a ${color.toLowerCase()} tee works with literally everything.`,
    ],
    "Shirt": [
      `Roll the sleeves to the elbow for a relaxed smart-casual look. A ${color.toLowerCase()} shirt pairs perfectly with dark jeans or chinos.`,
    ],
    "Polo": [
      `A ${color.toLowerCase()} polo is versatile — tuck it into chinos for old money vibes, or wear it loose with shorts for casual days.`,
    ],
    "Jeans": [
      `${color} jeans are a wardrobe staple. They go with white tees, black tops, flannel shirts — basically anything.`,
    ],
    "Chinos": [
      `${color} chinos bridge the gap between casual and smart. Pair with a polo or button-down for office looks.`,
    ],
    "Sneakers": [
      `${color} sneakers are the most versatile footwear you can own. They work with jeans, joggers, chinos — everything.`,
    ],
    "Loafers": [
      `${color} loafers instantly dress up any outfit. Perfect for smart casual and old money looks.`,
    ],
    "Watch": [
      `A ${color.toLowerCase()} watch is the #1 accessory upgrade. It shows attention to detail and works with every outfit.`,
    ],
    "Sunglasses": [
      `${color} frames are classic and go with everything. Essential for the PH sun.`,
    ],
    "Crossbody Bag": [
      `A ${color.toLowerCase()} crossbody adds functionality and style. Wear it across the body for a streetwear look.`,
    ],
    "Hoodie": [
      `Layer it under a denim or bomber jacket. A ${color.toLowerCase()} hoodie is a streetwear essential.`,
    ],
    "Cargo Pants": [
      `Pair ${color.toLowerCase()} cargos with a fitted tee and chunky sneakers for a solid streetwear fit.`,
    ],
    "Blazer": [
      `A ${color.toLowerCase()} blazer elevates any basic outfit. Throw it over a tee for instant sophistication.`,
    ],
    "Turtleneck": [
      `A ${color.toLowerCase()} turtleneck is the cornerstone of dark academia and old money aesthetics.`,
    ],
  };

  const options = tips[subcategory];
  if (options && options.length > 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
  return `A ${color.toLowerCase()} ${subcategory.toLowerCase()} pairs well with neutral tones. Mix with contrasting colors for a bolder look.`;
}

function getStyleContext(subcategory: string, style: string): string {
  const styleNames: Record<string, string> = {
    streetwear: "Streetwear", "old-money": "Old Money",
    minimalist: "Minimalist", "casual-pinoy": "Casual Pinoy",
    "smart-casual": "Smart Casual", athleisure: "Athleisure",
    "dark-academia": "Dark Academia", grunge: "Grunge",
    hypebeast: "Hypebeast", techwear: "Techwear",
  };
  const name = styleNames[style];
  if (!name) return "";
  return `This fits well with the ${name} aesthetic.`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") || "male";
    const style = searchParams.get("style") || "";

    const items = await db.select().from(clothingItems);
    const suggestions = suggestMissingItems(items, style, gender);

    const detailed = suggestions.map((s) => ({
      ...s,
      pairingTip: getPairingTip(s.subcategory, s.colors[0], gender),
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
