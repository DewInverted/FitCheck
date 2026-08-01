import { db } from "@/db";
import { clothingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(clothingItems)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(clothingItems.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating clothing item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(clothingItems).where(eq(clothingItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting clothing item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
