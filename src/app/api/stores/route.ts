import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
  }

  const googleMapsUrl = `https://www.google.com/maps/search/clothing+store/@${lat},${lng},14z`;

  const commonStores = [
    { name: "Ukay-Ukay / Thrift", description: "Hidden gems — ₱50-300 finds, sustainable fashion", icon: "♻️", directionsUrl: `https://www.google.com/maps/search/ukay+ukay+thrift+store/@${lat},${lng},14z`, category: "thrift" },
    { name: "Divisoria / Tiangge", description: "Wholesale prices — clothes, shoes, bags from ₱50", icon: "🏷️", directionsUrl: `https://www.google.com/maps/search/tiangge+market/@${lat},${lng},14z`, category: "thrift" },
    { name: "Surplus Shops", description: "Branded overruns & factory surplus — ₱100-500", icon: "📦", directionsUrl: `https://www.google.com/maps/search/surplus+shop/@${lat},${lng},14z`, category: "thrift" },
    { name: "Landmark", description: "Budget department store — cheap basics", icon: "🏬", directionsUrl: `https://www.google.com/maps/search/Landmark+Department+Store/@${lat},${lng},14z`, category: "budget" },
    { name: "SM Department Store", description: "Wide range, frequent sales & promos", icon: "🛒", directionsUrl: `https://www.google.com/maps/search/SM+Department+Store/@${lat},${lng},14z`, category: "budget" },
    { name: "Bench", description: "Pinoy brand — affordable casual & basics", icon: "🇵🇭", directionsUrl: `https://www.google.com/maps/search/Bench+clothing/@${lat},${lng},14z`, category: "budget" },
    { name: "Penshoppe", description: "Budget streetwear — ₱300-800 range", icon: "👕", directionsUrl: `https://www.google.com/maps/search/Penshoppe/@${lat},${lng},14z`, category: "budget" },
    { name: "World Balance", description: "Affordable Pinoy sneakers — ₱500-1500", icon: "👟", directionsUrl: `https://www.google.com/maps/search/World+Balance/@${lat},${lng},14z`, category: "shoes" },
    { name: "Shoe Stores", description: "Local shoe shops near you", icon: "👞", directionsUrl: `https://www.google.com/maps/search/shoe+store/@${lat},${lng},14z`, category: "shoes" },
    { name: "Uniqlo", description: "Quality basics — wait for sales ₱190-590", icon: "🧥", directionsUrl: `https://www.google.com/maps/search/Uniqlo/@${lat},${lng},14z`, category: "budget" },
  ];

  return NextResponse.json({
    googleMapsUrl,
    stores: commonStores,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  });
}
