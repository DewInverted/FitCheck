import { db } from "@/db";
import { outfits } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const saved = await db
      .select()
      .from(outfits)
      .orderBy(desc(outfits.createdAt));
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error fetching outfits:", error);
    return NextResponse.json({ error: "Failed to fetch outfits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, itemIds, occasion, season } = body;

    if (!name || !itemIds || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Name and itemIds are required" },
        { status: 400 }
      );
    }

    const [saved] = await db
      .insert(outfits)
      .values({
        name,
        itemIds,
        occasion: occasion || null,
        season: season || null,
      })
      .returning();

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error saving outfit:", error);
    return NextResponse.json({ error: "Failed to save outfit" }, { status: 500 });
  }
}
