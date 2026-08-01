import { db } from "@/db";
import { clothingItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await db
      .select()
      .from(clothingItems)
      .orderBy(desc(clothingItems.createdAt));
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching clothes:", error);
    return NextResponse.json({ error: "Failed to fetch clothes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      subcategory,
      primaryColor,
      secondaryColor,
      pattern,
      fit,
      season,
      occasion,
      brand,
      imageData,
      tags,
    } = body;

    if (!name || !category || !primaryColor || !imageData) {
      return NextResponse.json(
        { error: "Name, category, primaryColor, and imageData are required" },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(clothingItems)
      .values({
        name,
        category,
        subcategory: subcategory || null,
        primaryColor,
        secondaryColor: secondaryColor || null,
        pattern: pattern || null,
        fit: fit || null,
        season: season || null,
        occasion: occasion || null,
        brand: brand || null,
        imageData,
        tags: tags || [],
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating clothing item:", error);
    return NextResponse.json({ error: "Failed to create clothing item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.delete(clothingItems).where(eq(clothingItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting clothing item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
