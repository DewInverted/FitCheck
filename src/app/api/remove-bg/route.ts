import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "REMOVE_BG_API_KEY not configured",
          setupRequired: true,
          fallbackUrl: "https://www.remove.bg/upload",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const imageData = typeof body.imageData === "string" ? body.imageData : "";

    if (!imageData.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64 = imageData.split(",")[1];
    if (!base64) {
      return NextResponse.json({ error: "Missing image payload" }, { status: 400 });
    }

    const form = new FormData();
    form.append("image_file_b64", base64);
    form.append("size", "auto");
    form.append("format", "png");
    form.append("crop", "true");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Background removal failed",
          details: errorText,
          fallbackUrl: "https://www.remove.bg/upload",
        },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Out = Buffer.from(arrayBuffer).toString("base64");
    const result = `data:image/png;base64,${base64Out}`;

    return NextResponse.json({ imageData: result });
  } catch (error) {
    console.error("remove-bg error:", error);
    return NextResponse.json(
      {
        error: "Background removal failed",
        fallbackUrl: "https://www.remove.bg/upload",
      },
      { status: 500 }
    );
  }
}
