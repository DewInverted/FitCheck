import { db } from "@/db";
import { clothingItems } from "@/db/schema";
import { generateOutfits } from "@/lib/outfit-generator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    const occasion = typeof body.occasion === "string" ? body.occasion : undefined;
    const season = typeof body.season === "string" ? body.season : undefined;
    const styleId = typeof body.styleId === "string" ? body.styleId : undefined;
    const count = typeof body.count === "number" ? body.count : 10;
    const gender = typeof body.gender === "string" ? body.gender : undefined;
    const showSuggested = typeof body.showSuggested === "boolean" ? body.showSuggested : true;
    const excludeIds = Array.isArray(body.excludeIds) ? body.excludeIds as string[] : [];
    const suggestCategories = Array.isArray(body.suggestCategories) ? body.suggestCategories as string[] : ["top", "bottom", "shoes", "accessory"];

    let items = await db.select().from(clothingItems);

    // Filter out excluded items
    if (excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds);
      items = items.filter(item => !excludeSet.has(item.id));
    }

    if (items.length < 2) {
      return NextResponse.json(
        { error: "You need at least 2 clothing items to generate outfits. Add more items first!" },
        { status: 400 }
      );
    }

    const outfitResults = generateOutfits(items, { 
      occasion, 
      season, 
      count, 
      styleId, 
      gender, 
      showSuggested,
      suggestCategories,
    });

    if (outfitResults.length === 0) {
      return NextResponse.json(
        { error: "No outfit combinations found. Try a different style or add more items." },
        { status: 400 }
      );
    }

    const cleaned = outfitResults.map((o) => ({
      items: o.items,
      score: o.score,
      description: o.description,
      style: o.style,
      source: o.source,
      accessories: o.accessories,
      suggestedPieces: o.suggestedPieces,
      inspoLinks: o.inspoLinks,
    }));

    return new NextResponse(JSON.stringify(cleaned), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating outfits:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate outfits. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
