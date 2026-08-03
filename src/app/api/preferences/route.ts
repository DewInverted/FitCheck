import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await db.select().from(userPreferences).limit(1);
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, defaultStyle, showSuggested } = body;
    if (!gender || !defaultStyle) {
      return NextResponse.json({ error: "gender and defaultStyle required" }, { status: 400 });
    }

    await db.delete(userPreferences);
    const [pref] = await db
      .insert(userPreferences)
      .values({
        gender,
        defaultStyle,
        showSuggested: showSuggested !== undefined ? showSuggested : true,
      })
      .returning();
    return NextResponse.json(pref, { status: 201 });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = await db.select().from(userPreferences).limit(1);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "No preferences found" }, { status: 404 });
    }

    await db.delete(userPreferences);
    const [pref] = await db
      .insert(userPreferences)
      .values({
        gender: body.gender || rows[0].gender,
        defaultStyle: body.defaultStyle || rows[0].defaultStyle,
        showSuggested: body.showSuggested !== undefined ? body.showSuggested : rows[0].showSuggested,
      })
      .returning();
    return NextResponse.json(pref);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
