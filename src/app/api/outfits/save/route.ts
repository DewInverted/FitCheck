import { db } from "@/db";
import { outfits } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
    const { name, itemIds, occasion, season, style, source } = body;

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
        style: style || null,
        occasion: occasion || null,
        season: season || null,
        source: source || "closet",
      })
      .returning();

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error saving outfit:", error);
    return NextResponse.json({ error: "Failed to save outfit" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, itemIds, name } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (itemIds) updateData.itemIds = itemIds;
    if (name) updateData.name = name;

    const [updated] = await db
      .update(outfits)
      .set(updateData)
      .where(eq(outfits.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating outfit:", error);
    return NextResponse.json({ error: "Failed to update outfit" }, { status: 500 });
  }
}
