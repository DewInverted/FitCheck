import { NextResponse } from "next/server";

export async function GET() {
  const hasDb = !!process.env.DATABASE_URL;
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.substring(0, 15) + "..." : "NOT SET";
  
  if (!hasDb) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL not set", masked });
  }

  try {
    const { pool } = await import("@/db");
    const result = await pool.query("SELECT 1 as test");
    return NextResponse.json({ ok: true, db: "connected", test: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ 
      ok: false, 
      error: String(err),
      masked,
    });
  }
}
